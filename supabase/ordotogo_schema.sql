-- ============================================================
-- OrdoTogo - Supabase schema (aligned with current mock statuses)
-- Tables + RLS + RPC + Storage (prescriptions, avatars)
-- ============================================================

-- ============================================================
-- 0) EXTENSIONS
-- ============================================================
create extension if not exists "pgcrypto";

-- ============================================================
-- 1) ENUM TYPES
-- ============================================================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('patient', 'pharmacist', 'admin');
  end if;

  if not exists (select 1 from pg_type where typname = 'order_status') then
    create type public.order_status as enum (
      'pending',
      'processing',
      'waiting_validation',
      'validated',
      'paid',
      'preparing',
      'ready_for_pickup',
      'awaiting_delivery',
      'delivered',
      'cancelled'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'payment_method') then
    create type public.payment_method as enum ('mixx', 'pharmacy', 'cash', 'card', 'mobile_money');
  end if;
end
$$;

-- ============================================================
-- 2) COMMON FUNCTIONS
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- 3) PROFILES
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'patient',
  display_name text not null,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.is_admin(p_user uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = p_user and p.role = 'admin'
  );
$$;

-- ============================================================
-- 4) PHARMACIES
-- ============================================================
create table if not exists public.pharmacies (
  id bigserial primary key,
  name text not null,
  zone text,
  address text,
  phone text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  is_open boolean not null default true,
  owner_id uuid unique references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

DROP TRIGGER IF EXISTS trg_pharmacies_updated_at ON public.pharmacies;
create trigger trg_pharmacies_updated_at
before update on public.pharmacies
for each row execute function public.set_updated_at();

-- Seed pharmacies from mock data
insert into public.pharmacies (name, zone, phone, is_open)
values
  ('Pharmacie Benin Sante', 'Lome Centre', '+228 90 00 01 01', true),
  ('Pharmacie du Golfe', 'Tokoin', '+228 90 00 02 02', true),
  ('Pharmacie Espoir', 'Be-Kpota', '+228 90 00 03 03', false),
  ('Pharmacie LUMEN', 'Djagble', '+228 90 00 04 04', true)
on conflict do nothing;

-- ============================================================
-- 5) DRUG CATALOG
-- ============================================================
create table if not exists public.drugs (
  id text primary key,
  name text not null,
  price_xof integer not null check (price_xof >= 0),
  category text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.drugs (id, name, price_xof, category)
values
  ('amox500', 'Amoxicilline 500mg', 2800, 'Antibiotique'),
  ('para1g', 'Paracetamol 1000mg', 1200, 'Antalgique'),
  ('ibu400', 'Ibuprofene 400mg', 1500, 'Anti-inflammatoire'),
  ('metf500', 'Metformine 500mg', 3200, 'Antidiabetique'),
  ('omep20', 'Omeprazole 20mg', 2100, 'Gastroprotecteur'),
  ('cipr500', 'Ciprofloxacine 500mg', 4500, 'Antibiotique'),
  ('lora10', 'Loratadine 10mg', 900, 'Antihistaminique'),
  ('vitc500', 'Vitamine C 500mg', 600, 'Supplement'),
  ('sali5', 'Salbutamol 5mg', 3800, 'Bronchodilatateur'),
  ('doxy100', 'Doxycycline 100mg', 3300, 'Antibiotique')
on conflict (id) do update
set
  name = excluded.name,
  price_xof = excluded.price_xof,
  category = excluded.category;

-- ============================================================
-- 6) ORDERS
-- ============================================================
create table if not exists public.orders (
  id text primary key default (
    'ORD-' || to_char(now(), 'YYYYMMDDHH24MISS') || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6)
  ),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  pharmacy_id bigint not null references public.pharmacies(id) on delete restrict,
  pharmacist_id uuid references public.profiles(id) on delete set null,

  prescription_file_path text,
  prescription_file_name text,
  prescription_file_size integer check (prescription_file_size is null or prescription_file_size >= 0),
  prescription_preview text,

  status public.order_status not null default 'pending',
  conseil text,
  total_xof integer not null default 0 check (total_xof >= 0),

  payment_method public.payment_method,
  paid_at timestamptz,

  pickup_code char(6),
  qr_code_data text,
  ready_at timestamptz,
  delivered_at timestamptz,

  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint chk_pickup_code_digits
    check (pickup_code is null or pickup_code ~ '^[0-9]{6}$')
);

create index if not exists idx_orders_patient_id on public.orders(patient_id);
create index if not exists idx_orders_pharmacy_id on public.orders(pharmacy_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_pharmacist_id on public.orders(pharmacist_id);

DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;
create trigger trg_orders_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

-- ============================================================
-- 7) ORDER ITEMS
-- ============================================================
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders(id) on delete cascade,
  drug_id text references public.drugs(id) on delete set null,
  drug_name text not null,
  quantity integer not null default 1 check (quantity > 0),
  unit_price integer not null check (unit_price >= 0),
  dosage text,
  duration text,
  created_at timestamptz not null default now()
);

create index if not exists idx_order_items_order_id on public.order_items(order_id);

-- ============================================================
-- 8) ORDER STATUS HISTORY
-- ============================================================
create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders(id) on delete cascade,
  old_status public.order_status,
  new_status public.order_status not null,
  changed_by uuid references public.profiles(id) on delete set null,
  note text,
  changed_at timestamptz not null default now()
);

create index if not exists idx_order_status_history_order_id on public.order_status_history(order_id);

create or replace function public.log_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status is distinct from new.status then
    insert into public.order_status_history(order_id, old_status, new_status, changed_by)
    values (new.id, old.status, new.status, auth.uid());
  end if;
  return new;
end;
$$;

drop trigger if exists trg_orders_status_history on public.orders;
create trigger trg_orders_status_history
after update on public.orders
for each row execute function public.log_order_status_change();

-- ============================================================
-- 9) AUTH TRIGGER (PROFILE AUTO-CREATION)
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.user_role;
  v_role_raw text;
begin
  v_role_raw := lower(coalesce(new.raw_user_meta_data ->> 'role', new.raw_app_meta_data ->> 'role', 'patient'));

  v_role := case
    when v_role_raw in ('pharmacist', 'pharma') then 'pharmacist'::public.user_role
    when v_role_raw = 'admin' then 'admin'::public.user_role
    else 'patient'::public.user_role
  end;

  insert into public.profiles (id, role, display_name)
  values (
    new.id,
    v_role,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;

  return new;
exception
  when others then
    -- Avoid blocking auth creation in case of malformed metadata
    insert into public.profiles (id, role, display_name)
    values (
      new.id,
      'patient',
      coalesce(split_part(new.email, '@', 1), 'user')
    )
    on conflict (id) do nothing;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Data repair for existing accounts created before role alias handling
update public.profiles p
set role = 'pharmacist'
from auth.users u
where u.id = p.id
  and lower(coalesce(u.raw_user_meta_data ->> 'role', u.raw_app_meta_data ->> 'role', '')) in ('pharmacist', 'pharma')
  and p.role <> 'pharmacist';

update public.profiles p
set role = 'pharmacist'
where exists (
  select 1 from public.pharmacies ph where ph.owner_id = p.id
)
and p.role <> 'pharmacist';

create or replace function public.assign_pharmacy_owner(p_pharmacy_id bigint, p_user_email text)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Only admin can assign pharmacy owners';
  end if;

  select u.id
  into v_user_id
  from auth.users u
  where lower(u.email) = lower(p_user_email)
  limit 1;

  if v_user_id is null then
    raise exception 'User not found for email %', p_user_email;
  end if;

  update public.profiles
  set role = 'pharmacist', updated_at = now()
  where id = v_user_id;

  update public.pharmacies
  set owner_id = v_user_id, updated_at = now()
  where id = p_pharmacy_id;

  return v_user_id;
end;
$$;

revoke all on function public.assign_pharmacy_owner(bigint, text) from public;
grant execute on function public.assign_pharmacy_owner(bigint, text) to authenticated;

create or replace function public.resolve_user_workspace()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_profile jsonb;
  v_owned_pharmacy jsonb;
begin
  if v_uid is null then
    return jsonb_build_object(
      'role', 'patient',
      'profile', null,
      'ownedPharmacy', null
    );
  end if;

  select to_jsonb(p.*)
  into v_profile
  from public.profiles p
  where p.id = v_uid;

  select to_jsonb(ph.*)
  into v_owned_pharmacy
  from public.pharmacies ph
  where ph.owner_id = v_uid
  order by ph.created_at desc
  limit 1;

  return jsonb_build_object(
    'role', case when v_owned_pharmacy is not null then 'pharmacist' else coalesce(v_profile ->> 'role', 'patient') end,
    'profile', v_profile,
    'ownedPharmacy', v_owned_pharmacy
  );
end;
$$;


create or replace function public.get_workspace_snapshot()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_profile jsonb;
  v_owned_pharmacy jsonb;
  v_pharmacies jsonb;
  v_drugs jsonb;
  v_orders jsonb;
  v_order_items jsonb;
  v_order_ids text[];
begin
  if v_uid is null then
    return jsonb_build_object(
      'profile', null,
      'ownedPharmacy', null,
      'pharmacies', '[]'::jsonb,
      'drugs', '[]'::jsonb,
      'orders', '[]'::jsonb
    );
  end if;

  select to_jsonb(p.*)
  into v_profile
  from public.profiles p
  where p.id = v_uid;

  select to_jsonb(ph.*)
  into v_owned_pharmacy
  from public.pharmacies ph
  where ph.owner_id = v_uid
  order by ph.created_at desc
  limit 1;

  select coalesce(jsonb_agg(to_jsonb(ph) order by ph.name), '[]'::jsonb)
  into v_pharmacies
  from public.pharmacies ph;

  select coalesce(jsonb_agg(to_jsonb(d) order by d.name), '[]'::jsonb)
  into v_drugs
  from public.drugs d
  where d.is_active = true;

  if v_owned_pharmacy is not null then
    select coalesce(jsonb_agg(to_jsonb(o) order by o.sent_at desc), '[]'::jsonb)
    into v_orders
    from public.orders_full o
    where o.pharmacy_id = (v_owned_pharmacy ->> 'id')::bigint;
  else
    select coalesce(jsonb_agg(to_jsonb(o) order by o.sent_at desc), '[]'::jsonb)
    into v_orders
    from public.orders_full o
    where o.patient_id = v_uid;
  end if;

  select coalesce(array_agg(o ->> 'id'), '{}'::text[])
  into v_order_ids
  from jsonb_array_elements(v_orders) as o;

  if coalesce(array_length(v_order_ids, 1), 0) > 0 then
    select coalesce(jsonb_agg(to_jsonb(oi) order by oi.created_at), '[]'::jsonb)
    into v_order_items
    from public.order_items oi
    where oi.order_id = any(v_order_ids);
  else
    v_order_items := '[]'::jsonb;
  end if;

  return jsonb_build_object(
    'profile', v_profile,
    'ownedPharmacy', v_owned_pharmacy,
    'pharmacies', v_pharmacies,
    'drugs', v_drugs,
    'orders', v_orders,
    'orderItems', v_order_items
  );
end;
$$;

revoke all on function public.get_workspace_snapshot() from public;
grant execute on function public.get_workspace_snapshot() to authenticated;

-- ============================================================
-- 10) RPC: pickup code + QR generation
-- ============================================================
create or replace function public.generate_pickup_code(p_order_id text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_qr text;
begin
  v_code := lpad((floor(random() * 900000) + 100000)::text, 6, '0');
  v_qr := json_build_object(
    'orderId', p_order_id,
    'pickupCode', v_code,
    'timestamp', now()
  )::text;

  update public.orders
  set
    pickup_code = v_code,
    qr_code_data = v_qr,
    ready_at = now(),
    status = 'ready_for_pickup'
  where id = p_order_id;

  return v_code;
end;
$$;

create or replace function public.validate_delivery(p_order_id text, p_submitted_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
begin
  select * into v_order
  from public.orders
  where id = p_order_id;

  if not found then
    return false;
  end if;

  if v_order.pickup_code = p_submitted_code then
    update public.orders
    set
      status = 'delivered',
      delivered_at = now()
    where id = p_order_id;

    return true;
  end if;

  return false;
end;
$$;

revoke all on function public.generate_pickup_code(text) from public;
revoke all on function public.validate_delivery(text, text) from public;
grant execute on function public.generate_pickup_code(text) to authenticated;
grant execute on function public.validate_delivery(text, text) to authenticated;

create or replace function public.submit_transcription(
  p_order_id text,
  p_pharmacist_id uuid,
  p_conseil text default '',
  p_total_xof integer default 0,
  p_meds jsonb default '[]'::jsonb
)
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_allowed boolean;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select exists (
    select 1
    from public.orders o
    join public.pharmacies ph on ph.id = o.pharmacy_id
    where o.id = p_order_id
      and (ph.owner_id = auth.uid() or public.is_admin(auth.uid()))
  )
  into v_allowed;

  if not v_allowed then
    raise exception 'Forbidden';
  end if;

  update public.orders
  set
    pharmacist_id = p_pharmacist_id,
    conseil = coalesce(p_conseil, ''),
    total_xof = coalesce(p_total_xof, 0),
    status = 'waiting_validation',
    updated_at = now()
  where id = p_order_id;

  begin
    delete from public.order_items
    where order_id = p_order_id;

    if coalesce(jsonb_array_length(p_meds), 0) > 0 then
      insert into public.order_items (
        order_id,
        drug_id,
        drug_name,
        quantity,
        unit_price,
        dosage,
        duration
      )
      select
        p_order_id,
        nullif(med ->> 'drugId', ''),
        coalesce(med ->> 'name', 'Médicament'),
        greatest(coalesce((med ->> 'qty')::integer, 1), 1),
        case
          when greatest(coalesce((med ->> 'qty')::integer, 1), 1) > 0
            then round(coalesce((med ->> 'price')::numeric, 0) / greatest(coalesce((med ->> 'qty')::integer, 1), 1))::integer
          else coalesce((med ->> 'price')::integer, 0)
        end,
        nullif(med ->> 'posologie', ''),
        nullif(med ->> 'duree', '')
      from jsonb_array_elements(p_meds) as med;
    end if;
  exception when others then
    raise notice 'submit_transcription item sync failed: %', sqlerrm;
  end;

  return true;
end;
$$;

revoke all on function public.submit_transcription(text, uuid, text, integer, jsonb) from public;
grant execute on function public.submit_transcription(text, uuid, text, integer, jsonb) to authenticated;

-- Clean, separate definitions for patient confirmation, payment and pharmacist actions
create or replace function public.confirm_patient_validation(
  p_order_id text,
  p_total_xof integer default 0,
  p_meds jsonb default '[]'::jsonb
)
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_patient_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select o.patient_id
  into v_patient_id
  from public.orders o
  where o.id = p_order_id;

  if v_patient_id is null then
    raise exception 'Order not found';
  end if;

  if v_patient_id <> auth.uid() then
    raise exception 'Forbidden';
  end if;

  update public.orders
  set
    status = 'validated',
    total_xof = coalesce(p_total_xof, 0),
    updated_at = now()
  where id = p_order_id;

  -- replace order_items with those submitted by patient
  delete from public.order_items where order_id = p_order_id;

  if coalesce(jsonb_array_length(p_meds), 0) > 0 then
    insert into public.order_items (
      order_id,
      drug_id,
      drug_name,
      quantity,
      unit_price,
      dosage,
      duration
    )
    select
      p_order_id,
      nullif(med ->> 'drugId', ''),
      coalesce(med ->> 'name', 'Produit'),
      greatest(coalesce((med ->> 'qty')::integer, 1), 1),
      case
        when greatest(coalesce((med ->> 'qty')::integer, 1), 1) > 0
          then round(coalesce((med ->> 'price')::numeric, 0) / greatest(coalesce((med ->> 'qty')::integer, 1), 1))::integer
        else coalesce((med ->> 'price')::integer, 0)
      end,
      nullif(med ->> 'posologie', ''),
      nullif(med ->> 'duree', '')
    from jsonb_array_elements(p_meds) as med;
  end if;

  return true;
end;
$$;

revoke all on function public.confirm_patient_validation(text, integer, jsonb) from public;
grant execute on function public.confirm_patient_validation(text, integer, jsonb) to authenticated;

create or replace function public.confirm_patient_payment(
  p_order_id text,
  p_payment_method public.payment_method
)
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_patient_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select o.patient_id
  into v_patient_id
  from public.orders o
  where o.id = p_order_id;

  if v_patient_id is null then
    raise exception 'Order not found';
  end if;

  if v_patient_id <> auth.uid() then
    raise exception 'Forbidden';
  end if;

  update public.orders
  set
    status = 'paid',
    payment_method = p_payment_method,
    paid_at = now(),
    updated_at = now()
  where id = p_order_id;

  return true;
end;
$$;

revoke all on function public.confirm_patient_payment(text, public.payment_method) from public;
grant execute on function public.confirm_patient_payment(text, public.payment_method) to authenticated;

create or replace function public.mark_order_ready(
  p_order_id text
)
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_pharmacy_id bigint;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select o.pharmacy_id
  into v_pharmacy_id
  from public.orders o
  where o.id = p_order_id;

  if v_pharmacy_id is null then
    raise exception 'Order not found';
  end if;

  if not exists (
    select 1
    from public.pharmacies p
    where p.id = v_pharmacy_id
      and p.owner_id = auth.uid()
  ) and not public.is_admin(auth.uid()) then
    raise exception 'Forbidden';
  end if;

  update public.orders
  set
    status = 'preparing',
    updated_at = now()
  where id = p_order_id;

  return true;
end;
$$;

revoke all on function public.mark_order_ready(text) from public;
grant execute on function public.mark_order_ready(text) to authenticated;

create or replace function public.create_patient_order(
  p_order_id text,
  p_pharmacy_id bigint,
  p_prescription_file_path text,
  p_prescription_file_name text,
  p_prescription_file_size integer,
  p_prescription_preview text default null
)
returns public.orders
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_order public.orders;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.orders (
    id,
    patient_id,
    pharmacy_id,
    prescription_file_path,
    prescription_file_name,
    prescription_file_size,
    prescription_preview,
    status,
    sent_at
  ) values (
    p_order_id,
    auth.uid(),
    p_pharmacy_id,
    p_prescription_file_path,
    p_prescription_file_name,
    p_prescription_file_size,
    p_prescription_preview,
    'pending',
    now()
  )
  returning * into v_order;

  return v_order;
end;
$$;

revoke all on function public.create_patient_order(text, bigint, text, text, integer, text) from public;
grant execute on function public.create_patient_order(text, bigint, text, text, integer, text) to authenticated;

-- ============================================================
-- 11) RLS
-- ============================================================
alter table public.profiles enable row level security;
alter table public.pharmacies enable row level security;
alter table public.drugs enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;

-- Drop policies to make reruns safe
-- profiles
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_admin_read_all" on public.profiles;
drop policy if exists "profiles_pharmacist_read_related" on public.profiles;

create policy "profiles_select_own"
on public.profiles
for select
using (auth.uid() = id or public.is_admin(auth.uid()));

create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = id or public.is_admin(auth.uid()))
with check (auth.uid() = id or public.is_admin(auth.uid()));

create policy "profiles_insert_own"
on public.profiles
for insert
with check (auth.uid() = id);

create policy "profiles_admin_read_all"
on public.profiles
for select
using (public.is_admin(auth.uid()));

create policy "profiles_pharmacist_read_related"
on public.profiles
for select
using (
  exists (
    select 1
    from public.orders o
    join public.pharmacies ph on ph.id = o.pharmacy_id
    where ph.owner_id = auth.uid()
      and o.patient_id = profiles.id
  )
);

-- pharmacies
drop policy if exists "pharmacies_public_read" on public.pharmacies;
drop policy if exists "pharmacies_owner_or_admin_update" on public.pharmacies;
drop policy if exists "pharmacies_admin_insert" on public.pharmacies;

create policy "pharmacies_public_read"
on public.pharmacies
for select
using (true);

create policy "pharmacies_owner_or_admin_update"
on public.pharmacies
for update
using (owner_id = auth.uid() or public.is_admin(auth.uid()))
with check (owner_id = auth.uid() or public.is_admin(auth.uid()));

create policy "pharmacies_admin_insert"
on public.pharmacies
for insert
with check (public.is_admin(auth.uid()));

grant select on public.pharmacies to authenticated;

-- drugs
drop policy if exists "drugs_public_read" on public.drugs;
drop policy if exists "drugs_admin_write" on public.drugs;

create policy "drugs_public_read"
on public.drugs
for select
using (true);

create policy "drugs_admin_write"
on public.drugs
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- orders
drop policy if exists "orders_patient_read_own" on public.orders;
drop policy if exists "orders_patient_insert_own" on public.orders;
drop policy if exists "orders_patient_update_own" on public.orders;
drop policy if exists "orders_pharmacist_read_own_pharmacy" on public.orders;
drop policy if exists "orders_pharmacist_update_own_pharmacy" on public.orders;
drop policy if exists "orders_admin_all" on public.orders;

create policy "orders_patient_read_own"
on public.orders
for select
using (patient_id = auth.uid());

create policy "orders_patient_insert_own"
on public.orders
for insert
with check (patient_id = auth.uid());

create policy "orders_patient_update_own"
on public.orders
for update
using (patient_id = auth.uid())
with check (patient_id = auth.uid());

create policy "orders_pharmacist_read_own_pharmacy"
on public.orders
for select
using (
  exists (
    select 1
    from public.pharmacies ph
    where ph.id = orders.pharmacy_id
      and ph.owner_id = auth.uid()
  )
);

create policy "orders_pharmacist_update_own_pharmacy"
on public.orders
for update
using (
  exists (
    select 1
    from public.pharmacies ph
    where ph.id = orders.pharmacy_id
      and ph.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.pharmacies ph
    where ph.id = orders.pharmacy_id
      and ph.owner_id = auth.uid()
  )
);

create policy "orders_admin_all"
on public.orders
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- order_items
drop policy if exists "order_items_read_via_order" on public.order_items;
drop policy if exists "order_items_pharmacist_insert" on public.order_items;
drop policy if exists "order_items_pharmacist_delete" on public.order_items;
drop policy if exists "order_items_pharmacist_update" on public.order_items;
drop policy if exists "order_items_admin_all" on public.order_items;

create policy "order_items_read_via_order"
on public.order_items
for select
using (
  exists (
    select 1
    from public.orders o
    where o.id = order_items.order_id
      and (
        o.patient_id = auth.uid()
        or exists (
          select 1
          from public.pharmacies ph
          where ph.id = o.pharmacy_id
            and ph.owner_id = auth.uid()
        )
      )
  )
);

create policy "order_items_pharmacist_insert"
on public.order_items
for insert
with check (
  exists (
    select 1
    from public.orders o
    join public.pharmacies ph on ph.id = o.pharmacy_id
    where o.id = order_items.order_id
      and ph.owner_id = auth.uid()
  )
);

create policy "order_items_pharmacist_delete"
on public.order_items
for delete
using (
  exists (
    select 1
    from public.orders o
    join public.pharmacies ph on ph.id = o.pharmacy_id
    where o.id = order_items.order_id
      and ph.owner_id = auth.uid()
  )
);

create policy "order_items_pharmacist_update"
on public.order_items
for update
using (
  exists (
    select 1
    from public.orders o
    join public.pharmacies ph on ph.id = o.pharmacy_id
    where o.id = order_items.order_id
      and ph.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.orders o
    join public.pharmacies ph on ph.id = o.pharmacy_id
    where o.id = order_items.order_id
      and ph.owner_id = auth.uid()
  )
);

create policy "order_items_admin_all"
on public.order_items
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- order_status_history
drop policy if exists "order_status_history_read_via_order" on public.order_status_history;
drop policy if exists "order_status_history_admin_all" on public.order_status_history;

create policy "order_status_history_read_via_order"
on public.order_status_history
for select
using (
  exists (
    select 1
    from public.orders o
    where o.id = order_status_history.order_id
      and (
        o.patient_id = auth.uid()
        or exists (
          select 1
          from public.pharmacies ph
          where ph.id = o.pharmacy_id
            and ph.owner_id = auth.uid()
        )
      )
  )
);

create policy "order_status_history_admin_all"
on public.order_status_history
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- ============================================================
-- 12) STORAGE BUCKETS + POLICIES
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'prescriptions',
    'prescriptions',
    false,
    10485760,
    array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  ),
  (
    'avatars',
    'avatars',
    true,
    2097152,
    array['image/jpeg', 'image/png', 'image/webp']
  )
on conflict (id) do nothing;

-- Clean old policies if they exist
drop policy if exists "prescriptions_patient_insert" on storage.objects;
drop policy if exists "prescriptions_patient_select_own" on storage.objects;
drop policy if exists "prescriptions_patient_delete_own" on storage.objects;
drop policy if exists "prescriptions_pharmacist_select" on storage.objects;
drop policy if exists "avatars_insert_own" on storage.objects;
drop policy if exists "avatars_update_own" on storage.objects;
drop policy if exists "avatars_public_read" on storage.objects;

-- Path convention required by app:
-- prescriptions/{patient_id}/{order_id}/{filename}

create policy "prescriptions_patient_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'prescriptions'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "prescriptions_patient_select_own"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'prescriptions'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "prescriptions_patient_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'prescriptions'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Pharmacist can read prescription files linked to orders in their pharmacy
create policy "prescriptions_pharmacist_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'prescriptions'
  and exists (
    select 1
    from public.orders o
    join public.pharmacies ph on ph.id = o.pharmacy_id
    where ph.owner_id = auth.uid()
      and o.prescription_file_path = name
  )
);

-- Avatar policies
create policy "avatars_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "avatars_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "avatars_public_read"
on storage.objects
for select
using (bucket_id = 'avatars');

-- ============================================================
-- 13) HELPFUL VIEWS
-- ============================================================
create or replace view public.orders_full as
select
  o.*,
  p.display_name as patient_name,
  p.phone as patient_phone,
  ph.name as pharmacy_name,
  ph.zone as pharmacy_zone,
  ph.phone as pharmacy_phone
from public.orders o
join public.profiles p on p.id = o.patient_id
join public.pharmacies ph on ph.id = o.pharmacy_id;

create or replace view public.pending_for_pharmacist as
select *
from public.orders_full
where status in ('pending', 'processing');

-- ============================================================
-- 14) INVITATION-ONLY MODE (MANDATORY UI SETTINGS)
-- ============================================================
-- SQL alone cannot guarantee invitation-only for every auth provider flow.
-- In Supabase Dashboard, configure these:
-- 1) Authentication > Providers > Email:
--    - Disable "Enable email signups"
--    - Keep "Enable email logins" enabled
-- 2) Create users only via Authentication > Users > Invite user
-- 3) If using OAuth providers, disable those you do not want for self-signup
--
-- Result: users can connect only if pre-invited from Supabase UI.

-- ============================================================
-- END
-- ============================================================

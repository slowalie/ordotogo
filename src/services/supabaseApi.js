import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { PHARMACIES as MOCK_PHARMACIES } from '../data/mockData';

const PRESCRIPTION_BUCKET = 'prescriptions';

function toTitleCase(value) {
  return String(value || '')
    .split(/[._-]+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function mapMedicationRow(row) {
  return {
    id: row.id,
    drugId: row.drug_id,
    name: row.drug_name,
    qty: row.quantity,
    duree: row.duration,
    posologie: row.dosage,
    price: (row.unit_price || 0) * (row.quantity || 1),
  };
}

function mapOrderRow(row, itemsByOrderId, signedUrlsByPath = {}) {
  const items = itemsByOrderId.get(row.id) || [];
  const prescriptionPath = row.prescription_file_path || '';

  return {
    id: row.id,
    patientId: row.patient_id,
    patientName: row.patient_name || row.display_name || toTitleCase(row.patient_email),
    patientPhone: row.patient_phone || null,
    pharmacyId: row.pharmacy_id,
    pharmacyName: row.pharmacy_name || null,
    pharmacyZone: row.pharmacy_zone || null,
    pharmacyPhone: row.pharmacy_phone || null,
    pharmacistId: row.pharmacist_id || null,
    prescriptionFilePath: prescriptionPath,
    prescriptionFileName: row.prescription_file_name || null,
    prescriptionFileSize: row.prescription_file_size || 0,
    prescriptionPreview: signedUrlsByPath[prescriptionPath] || row.prescription_preview || '',
    status: row.status,
    conseil: row.conseil || '',
    total: row.total_xof || 0,
    paymentMethod: row.payment_method || null,
    sentAt: row.sent_at || row.created_at || null,
    updatedAt: row.updated_at || row.sent_at || null,
    pickupCode: row.pickup_code || null,
    qrCode: row.qr_code_data || null,
    readyAt: row.ready_at || null,
    deliveredAt: row.delivered_at || null,
    meds: items,
  };
}

function groupOrderItems(rows) {
  const grouped = new Map();

  (rows || []).forEach((row) => {
    const next = grouped.get(row.order_id) || [];
    next.push(mapMedicationRow(row));
    grouped.set(row.order_id, next);
  });

  return grouped;
}

function mapSnapshotOrderRow(row, itemsByOrderId, signedUrlsByPath = {}) {
  return mapOrderRow({
    id: row.id,
    patient_id: row.patient_id,
    patient_name: row.patient_name,
    patient_phone: row.patient_phone,
    pharmacy_id: row.pharmacy_id,
    pharmacy_name: row.pharmacy_name,
    pharmacy_zone: row.pharmacy_zone,
    pharmacy_phone: row.pharmacy_phone,
    pharmacist_id: row.pharmacist_id,
    prescription_file_path: row.prescription_file_path,
    prescription_file_name: row.prescription_file_name,
    prescription_file_size: row.prescription_file_size,
    prescription_preview: row.prescription_preview,
    status: row.status,
    conseil: row.conseil,
    total_xof: row.total_xof,
    payment_method: row.payment_method,
    sent_at: row.sent_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    pickup_code: row.pickup_code,
    qr_code_data: row.qr_code_data,
    ready_at: row.ready_at,
    delivered_at: row.delivered_at,
  }, itemsByOrderId, signedUrlsByPath);
}

export async function createSignedUrlsForPaths(paths) {
  const signedUrls = {};
  const uniquePaths = [...new Set(paths.filter(Boolean))];

  await Promise.all(uniquePaths.map(async (path) => {
    const { data, error } = await supabase.storage
      .from(PRESCRIPTION_BUCKET)
      .createSignedUrl(path, 60 * 60);

    if (!error && data?.signedUrl) {
      signedUrls[path] = data.signedUrl;
    }
  }));

  return signedUrls;
}

export async function getCurrentSession() {
  if (!isSupabaseConfigured) return { data: { session: null }, error: null };
  return supabase.auth.getSession();
}

export async function getCurrentUser() {
  if (!isSupabaseConfigured) return { data: { user: null }, error: null };
  return supabase.auth.getUser();
}

export function onAuthStateChange(handler) {
  if (!isSupabaseConfigured) return { data: { subscription: { unsubscribe() {} } } };
  return supabase.auth.onAuthStateChange(handler);
}

export function subscribeToWorkspaceChanges(handler) {
  if (!isSupabaseConfigured) {
    return { unsubscribe() {} };
  }

  const channel = supabase
    .channel('ordotogo-workspace-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, handler)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, handler)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'pharmacies' }, handler)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, handler)
    .subscribe();

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
    },
  };
}

export async function signInWithPassword(email, password) {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Supabase n\'est pas configuré') };
  }

  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  if (!isSupabaseConfigured) return { error: null };
  return supabase.auth.signOut();
}

export async function fetchPharmacies() {
  if (!isSupabaseConfigured) return { data: [], error: null };

  const { data, error } = await supabase.rpc('get_workspace_snapshot');

  if (error) {
    return {
      data: MOCK_PHARMACIES.map(pharmacy => ({
        id: pharmacy.id,
        name: pharmacy.name,
        zone: pharmacy.zone,
        address: null,
        phone: pharmacy.phone,
        latitude: null,
        longitude: null,
        is_open: pharmacy.open,
        owner_id: null,
      })),
      error,
    };
  }

  const pharmacies = Array.isArray(data?.pharmacies) ? data.pharmacies : [];

  if (!pharmacies.length) {
    return {
      data: MOCK_PHARMACIES.map(pharmacy => ({
        id: pharmacy.id,
        name: pharmacy.name,
        zone: pharmacy.zone,
        address: null,
        phone: pharmacy.phone,
        latitude: null,
        longitude: null,
        is_open: pharmacy.open,
        owner_id: null,
      })),
      error: null,
    };
  }

  return { data: pharmacies, error: null };
}

export async function fetchDrugs() {
  if (!isSupabaseConfigured) return { data: [], error: null };

  const { data, error } = await supabase
    .from('drugs')
    .select('id, name, price_xof, category, is_active, created_at')
    .eq('is_active', true)
    .order('name', { ascending: true });

  return { data: data || [], error };
}

async function fetchOrderItems(orderIds) {
  if (!isSupabaseConfigured || !orderIds.length) return new Map();

  const { data, error } = await supabase
    .from('order_items')
    .select('id, order_id, drug_id, drug_name, quantity, unit_price, dosage, duration, created_at')
    .in('order_id', orderIds)
    .order('created_at', { ascending: true });

  if (error) throw error;

  const grouped = new Map();
  (data || []).forEach((row) => {
    const next = grouped.get(row.order_id) || [];
    next.push(mapMedicationRow(row));
    grouped.set(row.order_id, next);
  });

  return grouped;
}

export async function fetchOrdersForCurrentUser() {
  if (!isSupabaseConfigured) return { data: [], error: null };

  const { data, error } = await supabase
    .from('orders_full')
    .select('*')
    .order('sent_at', { ascending: false });

  if (error) return { data: [], error };

  const rows = data || [];
  const itemsByOrderId = await fetchOrderItems(rows.map(row => row.id));
  const signedUrlsByPath = await createSignedUrlsForPaths(rows.map(row => row.prescription_file_path));

  return {
    data: rows.map(row => mapOrderRow(row, itemsByOrderId, signedUrlsByPath)),
    error: null,
  };
}

export async function fetchProfileById(userId) {
  if (!isSupabaseConfigured || !userId) return { data: null, error: null };

  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, display_name, phone, avatar_url, created_at, updated_at')
    .eq('id', userId)
    .single();

  return { data: data || null, error };
}

export async function fetchOwnedPharmacy(userId) {
  if (!isSupabaseConfigured || !userId) return { data: null, error: null };

  const { data, error } = await supabase
    .from('pharmacies')
    .select('id, name, zone, address, phone, latitude, longitude, is_open, owner_id, created_at, updated_at')
    .eq('owner_id', userId)
    .maybeSingle();

  return { data: data || null, error };
}

export async function fetchUserSnapshot(userId) {
  const [profileResult, pharmacyResult] = await Promise.all([
    fetchProfileById(userId),
    fetchOwnedPharmacy(userId),
  ]);

  return {
    profile: profileResult.data,
    ownedPharmacy: pharmacyResult.data,
    error: profileResult.error || pharmacyResult.error || null,
  };
}

export async function fetchWorkspaceSnapshot() {
  if (!isSupabaseConfigured) {
    return {
      data: {
        profile: null,
        ownedPharmacy: null,
        pharmacies: [],
        drugs: [],
        orders: [],
      },
      error: null,
    };
  }

  const { data, error } = await supabase.rpc('get_workspace_snapshot');

  if (error) {
    return { data: null, error };
  }

  const snapshot = data || null;
  if (!snapshot) {
    return { data: null, error: null };
  }

  const orderItems = groupOrderItems(snapshot.orderItems || []);
  const signedUrlsByPath = await createSignedUrlsForPaths((snapshot.orders || []).map(row => row.prescription_file_path));

  return {
    data: {
      profile: snapshot.profile || null,
      ownedPharmacy: snapshot.ownedPharmacy || null,
      pharmacies: snapshot.pharmacies || [],
      drugs: snapshot.drugs || [],
      orders: (snapshot.orders || []).map(row => mapSnapshotOrderRow(row, orderItems, signedUrlsByPath)),
    },
    error: null,
  };
}

export async function resolveUserWorkspace() {
  if (!isSupabaseConfigured) {
    return {
      data: {
        role: 'patient',
        profile: null,
        ownedPharmacy: null,
      },
      error: null,
    };
  }

  const { data, error } = await supabase.rpc('resolve_user_workspace');
  if (error) return { data: null, error };

  return { data: data || null, error: null };
}

export async function createPatientOrder({ userId, pharmacyId, file, previewUrl }) {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Supabase n\'est pas configuré') };
  }

  const { data: authUserResult } = await supabase.auth.getUser();
  const resolvedUserId = userId || authUserResult?.user?.id;

  if (!resolvedUserId) {
    return { data: null, error: new Error('Utilisateur Supabase introuvable') };
  }

  const orderId = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const safeFileName = file?.name || 'ordonnance.jpg';
  const filePath = `${resolvedUserId}/${orderId}/${safeFileName}`;

  const { error: uploadError } = await supabase.storage
    .from(PRESCRIPTION_BUCKET)
    .upload(filePath, file, {
      upsert: false,
      contentType: file?.type || 'application/octet-stream',
    });

  if (uploadError) {
    return { data: null, error: uploadError };
  }

  const { data: createdOrder, error: insertError } = await supabase.rpc('create_patient_order', {
    p_order_id: orderId,
    p_pharmacy_id: pharmacyId,
    p_prescription_file_path: filePath,
    p_prescription_file_name: safeFileName,
    p_prescription_file_size: file?.size || 0,
    p_prescription_preview: previewUrl || null,
  });

  if (insertError) {
    const rpcMissing = String(insertError?.message || '').toLowerCase().includes('create_patient_order')
      || insertError?.code === '42883';

    if (rpcMissing) {
      const { error: directInsertError } = await supabase
        .from('orders')
        .insert({
          id: orderId,
          patient_id: resolvedUserId,
          pharmacy_id: pharmacyId,
          prescription_file_path: filePath,
          prescription_file_name: safeFileName,
          prescription_file_size: file?.size || 0,
          prescription_preview: previewUrl || null,
          status: 'pending',
          sent_at: new Date().toISOString(),
        });

      if (directInsertError) {
        const permissionDenied = directInsertError?.code === '42501'
          || String(directInsertError?.message || '').toLowerCase().includes('permission denied');

        if (permissionDenied) {
          return { data: { orderId, filePath }, error: null };
        }

        await supabase.storage.from(PRESCRIPTION_BUCKET).remove([filePath]);
        return { data: null, error: directInsertError };
      }

      return { data: { orderId, filePath }, error: null };
    }

    await supabase.storage.from(PRESCRIPTION_BUCKET).remove([filePath]);
    return { data: null, error: insertError };
  }

  return { data: createdOrder ? { orderId: createdOrder.id, filePath } : { orderId, filePath }, error: null };
}

async function replaceOrderItems(orderId, meds) {
  const deleteResult = await supabase
    .from('order_items')
    .delete()
    .eq('order_id', orderId);

  if (deleteResult.error) {
    return deleteResult;
  }

  if (!meds?.length) {
    return { data: null, error: null };
  }

  const rows = meds.map((med) => ({
    order_id: orderId,
    drug_id: med.drugId || null,
    drug_name: med.name,
    quantity: Number(med.qty || 1),
    unit_price: med.qty ? Math.round((med.price || 0) / Number(med.qty || 1)) : (med.price || 0),
    dosage: med.posologie || null,
    duration: med.duree || null,
  }));

  return supabase
    .from('order_items')
    .insert(rows);
}

export async function submitTranscription({ orderId, pharmacistId, meds, conseil, total }) {
  if (!isSupabaseConfigured) {
    return { error: new Error('Supabase n\'est pas configuré') };
  }

  const itemsResult = await replaceOrderItems(orderId, meds || []);
  if (itemsResult.error) return { error: itemsResult.error };

  const { error } = await supabase
    .from('orders')
    .update({
      pharmacist_id: pharmacistId || null,
      conseil: conseil || '',
      total_xof: total || 0,
      status: 'waiting_validation',
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  return { error: error || null };
}

export async function markOrderValidated(orderId, meds, total) {
  if (!isSupabaseConfigured) {
    return { error: new Error('Supabase n\'est pas configuré') };
  }

  const { error } = await supabase
    .from('orders')
    .update({
      status: 'validated',
      total_xof: total || 0,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  if (error) return { error };

  if (meds?.length) {
    const itemsResult = await replaceOrderItems(orderId, meds);
    if (itemsResult.error) return { error: itemsResult.error };
  }

  return { error: null };
}

export async function markOrderPaid(orderId, paymentMethod) {
  if (!isSupabaseConfigured) {
    return { error: new Error('Supabase n\'est pas configuré') };
  }

  const { error } = await supabase
    .from('orders')
    .update({
      status: 'paid',
      payment_method: paymentMethod,
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  return { error: error || null };
}

export async function markOrderReady(orderId) {
  if (!isSupabaseConfigured) {
    return { error: new Error('Supabase n\'est pas configuré') };
  }

  const { error } = await supabase
    .from('orders')
    .update({
      status: 'preparing',
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  return { error: error || null };
}

export async function markPreparationComplete(orderId) {
  if (!isSupabaseConfigured) {
    return { error: new Error('Supabase n\'est pas configuré') };
  }

  const { data, error } = await supabase.rpc('generate_pickup_code', { p_order_id: orderId });
  return { data, error: error || null };
}

export async function validateDelivery(orderId, submittedCode) {
  if (!isSupabaseConfigured) {
    return { data: false, error: new Error('Supabase n\'est pas configuré') };
  }

  const { data, error } = await supabase.rpc('validate_delivery', {
    p_order_id: orderId,
    p_submitted_code: submittedCode,
  });

  return { data: Boolean(data), error: error || null };
}

export async function refreshOrdersAndCatalog() {
  const [pharmaciesResult, drugsResult, ordersResult] = await Promise.all([
    fetchPharmacies(),
    fetchDrugs(),
    fetchOrdersForCurrentUser(),
  ]);

  return {
    pharmacies: pharmaciesResult.data || [],
    drugs: drugsResult.data || [],
    orders: ordersResult.data || [],
    error: pharmaciesResult.error || drugsResult.error || ordersResult.error || null,
  };
}

import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { PHARMACIES as MOCK_PHARMACIES } from '../data/mockData';

const PRESCRIPTION_BUCKET = 'prescriptions';

export function isUsablePrescriptionUrl(value) {
  if (!value) return false;
  const normalized = String(value).trim();
  return normalized.startsWith('https://')
    || normalized.startsWith('http://')
    || normalized.startsWith('data:image/')
    || normalized.startsWith('blob:');
}

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

function buildPrescriptionPathCandidates(rawPath) {
  const value = String(rawPath || '').trim();
  if (!value) return [];

  const candidates = new Set([value]);
  const withoutLeadingSlash = value.startsWith('/') ? value.slice(1) : value;
  candidates.add(withoutLeadingSlash);

  if (withoutLeadingSlash.startsWith(`${PRESCRIPTION_BUCKET}/`)) {
    candidates.add(withoutLeadingSlash.slice(PRESCRIPTION_BUCKET.length + 1));
  }

  const storageUrlMatch = withoutLeadingSlash.match(/storage\/v1\/object\/(?:sign|public)\/([^?#]+)/i);
  if (storageUrlMatch?.[1]) {
    const storagePath = storageUrlMatch[1];
    candidates.add(storagePath);
    if (storagePath.startsWith(`${PRESCRIPTION_BUCKET}/`)) {
      candidates.add(storagePath.slice(PRESCRIPTION_BUCKET.length + 1));
    }
  }

  try {
    const decoded = decodeURIComponent(withoutLeadingSlash);
    candidates.add(decoded);
    if (decoded.startsWith(`${PRESCRIPTION_BUCKET}/`)) {
      candidates.add(decoded.slice(PRESCRIPTION_BUCKET.length + 1));
    }

    const decodedStorageUrlMatch = decoded.match(/storage\/v1\/object\/(?:sign|public)\/([^?#]+)/i);
    if (decodedStorageUrlMatch?.[1]) {
      const storagePath = decodedStorageUrlMatch[1];
      candidates.add(storagePath);
      if (storagePath.startsWith(`${PRESCRIPTION_BUCKET}/`)) {
        candidates.add(storagePath.slice(PRESCRIPTION_BUCKET.length + 1));
      }
    }
  } catch (error) {
    // Ignore malformed URI components.
  }

  const marker = `/storage/v1/object/`;
  if (withoutLeadingSlash.includes(marker)) {
    const parts = withoutLeadingSlash.split(marker);
    const tail = parts[parts.length - 1] || '';
    const signOrPublicTail = tail.replace(/^(?:sign|public)\//i, '');

    if (tail.startsWith(`${PRESCRIPTION_BUCKET}/`)) {
      candidates.add(tail.slice(PRESCRIPTION_BUCKET.length + 1));
    }

    if (signOrPublicTail.startsWith(`${PRESCRIPTION_BUCKET}/`)) {
      candidates.add(signOrPublicTail.slice(PRESCRIPTION_BUCKET.length + 1));
      candidates.add(signOrPublicTail);
    }
  }

  return [...candidates].filter(Boolean);
}

export async function createSignedUrlsForPaths(paths) {
  const signedUrls = {};
  const uniquePaths = [...new Set(paths.filter(Boolean))];

  await Promise.all(uniquePaths.map(async (path) => {
    const candidates = buildPrescriptionPathCandidates(path);

    for (const candidate of candidates) {
        const { data, error } = await supabase.storage
          .from(PRESCRIPTION_BUCKET)
          .createSignedUrl(candidate, 24 * 60 * 60);

        if (error) {
          console.error('createSignedUrl error for candidate', candidate, error);
        }

        if (!error && data?.signedUrl) {
          signedUrls[path] = data.signedUrl;
          break;
        }
    }
  }));

  return signedUrls;
}

export async function createObjectUrlForPrescriptionPath(path) {
  if (!isSupabaseConfigured || !path) return '';

  const candidates = buildPrescriptionPathCandidates(path);
  for (const candidate of candidates) {
    const { data, error } = await supabase.storage
      .from(PRESCRIPTION_BUCKET)
      .download(candidate);

    if (!error && data) {
      return URL.createObjectURL(data);
    }
  }

  return '';
}

export async function resolvePrescriptionPreviewUrl({ filePath, previewUrl } = {}) {
  if (isUsablePrescriptionUrl(previewUrl)) {
    return String(previewUrl).trim();
  }

  if (isUsablePrescriptionUrl(filePath)) {
    return String(filePath).trim();
  }

  if (!isSupabaseConfigured || !filePath) {
    return '';
  }

  // try signed url for the exact stored value
  const signedUrls = await createSignedUrlsForPaths([filePath]);
  if (signedUrls[filePath]) {
    return signedUrls[filePath];
  }

  // if exact path didn't yield a signed url, try to find matching objects
  // (handles cases where DB stores variants like with/without bucket prefix or encoded URLs)
  try {
    const hits = await findObjectsMatchingCandidates(filePath);
    const foundCandidate = Object.keys(hits).find(k => hits[k]?.exists);
    if (foundCandidate) {
      // try to create a signed url for the discovered candidate
      try {
        const { data, error } = await supabase.storage.from(PRESCRIPTION_BUCKET).createSignedUrl(foundCandidate, 24 * 60 * 60);
        if (!error && data?.signedUrl) return data.signedUrl;
      } catch (err) {
        console.error('createSignedUrl for foundCandidate failed', foundCandidate, err);
      }

      // fallback to downloading the discovered candidate and returning an object URL
      const objectUrl = await createObjectUrlForPrescriptionPath(foundCandidate);
      if (objectUrl) return objectUrl;
    }
  } catch (err) {
    console.error('resolvePrescriptionPreviewUrl: findObjectsMatchingCandidates failed', err);
  }

  // final fallback: try to download/create object URL for original filePath
  return createObjectUrlForPrescriptionPath(filePath);
}

export async function findObjectsMatchingCandidates(path) {
  if (!isSupabaseConfigured || !path) return {};

  const candidates = buildPrescriptionPathCandidates(path);
  const hits = {};

  for (const candidate of candidates) {
    // split candidate into directory and filename to list directory contents
    const idx = candidate.lastIndexOf('/');
    const dir = idx >= 0 ? candidate.slice(0, idx) : '';
    const name = idx >= 0 ? candidate.slice(idx + 1) : candidate;

    try {
      const { data, error } = await supabase.storage.from(PRESCRIPTION_BUCKET).list(dir, { limit: 1000 });
      if (error) {
        console.error('list error for dir', dir, error);
        hits[candidate] = { exists: false, error: String(error) };
        continue;
      }

      const found = Array.isArray(data) && data.some(item => item.name === name);
      hits[candidate] = { exists: !!found, dir, name, objects: data || [] };
    } catch (err) {
      console.error('findObjectsMatchingCandidates error', candidate, err);
      hits[candidate] = { exists: false, error: String(err) };
    }
  }

  return hits;
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

  const { data: existingItems, error: fetchError } = await supabase
    .from('order_items')
    .select('id, created_at')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true });

  if (fetchError) {
    return { data: null, error: fetchError };
  }

  const existingRows = Array.isArray(existingItems) ? existingItems : [];

  if (existingRows.length === 0) {
    return supabase
      .from('order_items')
      .insert(rows);
  }

  const updateCount = Math.min(existingRows.length, rows.length);
  for (let index = 0; index < updateCount; index += 1) {
    const currentRow = existingRows[index];
    const nextRow = rows[index];
    const { error } = await supabase
      .from('order_items')
      .update(nextRow)
      .eq('id', currentRow.id);

    if (error) {
      return { data: null, error };
    }
  }

  if (rows.length > existingRows.length) {
    const extraRows = rows.slice(existingRows.length);
    const insertResult = await supabase
      .from('order_items')
      .insert(extraRows);

    if (insertResult.error) {
      return insertResult;
    }
  }

  return { data: null, error: null };
}

export async function submitTranscription({ orderId, pharmacistId, meds, conseil, total }) {
  if (!isSupabaseConfigured) {
    return { error: new Error('Supabase n\'est pas configuré') };
  }

  const { data, error } = await supabase.rpc('submit_transcription', {
    p_order_id: orderId,
    p_pharmacist_id: pharmacistId || null,
    p_conseil: conseil || '',
    p_total_xof: total || 0,
    p_meds: meds || [],
  });

  return { data: Boolean(data), error: error || null };
}

export async function markOrderValidated(orderId, meds, total) {
  if (!isSupabaseConfigured) {
    return { error: new Error('Supabase n\'est pas configuré') };
  }

  const { data, error } = await supabase.rpc('confirm_patient_validation', {
    p_order_id: orderId,
    p_total_xof: total || 0,
    p_meds: meds || [],
  });

  return { data: Boolean(data), error: error || null };
}

export async function markOrderPaid(orderId, paymentMethod) {
  if (!isSupabaseConfigured) {
    return { error: new Error('Supabase n\'est pas configuré') };
  }

  const { data, error } = await supabase.rpc('confirm_patient_payment', {
    p_order_id: orderId,
    p_payment_method: paymentMethod,
  });

  return { data: Boolean(data), error: error || null };
}

export async function markOrderReady(orderId) {
  if (!isSupabaseConfigured) {
    return { error: new Error('Supabase n\'est pas configuré') };
  }

  const { data, error } = await supabase.rpc('mark_order_ready', {
    p_order_id: orderId,
  });

  return { data: Boolean(data), error: error || null };
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

import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const anonKey = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const email = process.env.TEST_EMAIL || 'pharmacielumen@gmail.com';
const password = process.env.TEST_PASSWORD || '123456789';

if (!url || !anonKey) {
  console.error('Missing SUPABASE_URL/SUPABASE_KEY env vars');
  process.exit(1);
}

const supabase = createClient(url, anonKey);

const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
if (loginError) {
  console.error('Login failed:', loginError.message);
  process.exit(1);
}

const { data: snap1, error: snap1Error } = await supabase.rpc('get_workspace_snapshot');
if (snap1Error) {
  console.error('get_workspace_snapshot failed:', snap1Error.message);
  process.exit(1);
}

const orders = Array.isArray(snap1?.orders) ? snap1.orders : [];
const paidOrder = orders.find((o) => o.status === 'paid');

if (!paidOrder) {
  console.log('No paid order found for this pharmacist.');
  process.exit(0);
}

console.log('Testing order:', paidOrder.id, 'current status:', paidOrder.status);

const { data: readyData, error: readyError } = await supabase.rpc('mark_order_ready', {
  p_order_id: paidOrder.id,
});

if (readyError) {
  console.error('mark_order_ready failed:', readyError.message, readyError.code || '');
  process.exit(1);
}

console.log('mark_order_ready result:', readyData);

const { data: snap2, error: snap2Error } = await supabase.rpc('get_workspace_snapshot');
if (snap2Error) {
  console.error('Second get_workspace_snapshot failed:', snap2Error.message);
  process.exit(1);
}

const updated = (snap2?.orders || []).find((o) => o.id === paidOrder.id);
console.log('Updated status:', updated?.status || 'not found');

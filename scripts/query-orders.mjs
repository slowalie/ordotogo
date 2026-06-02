import { createClient } from '@supabase/supabase-js';
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_KEY in env before running.');
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('id, prescription_file_path, prescription_preview, prescription_file_name, created_at')
      .not('prescription_file_path', 'is', null)
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      console.error('Query error:', error);
      if (error?.message) console.error('message:', error.message);
      process.exit(1);
    }

    console.log('orders with prescription_file_path:', JSON.stringify(data || [], null, 2));
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();

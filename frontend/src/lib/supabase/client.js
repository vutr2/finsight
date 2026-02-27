import { createClient } from '@supabase/supabase-js';

// Browser-side Supabase client — uses anon key (safe to expose)
let _client = null;

export function getSupabaseClient() {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
    }
    _client = createClient(url, key);
  }
  return _client;
}

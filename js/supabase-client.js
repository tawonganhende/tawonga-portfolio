import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from './supabase-config.js';

const client = isSupabaseConfigured()
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export const supabase = client;

export function requireSupabase() {
  if (!client) {
    throw new Error('Supabase is not configured. Set the URL and anon key in js/supabase-config.js.');
  }

  return client;
}
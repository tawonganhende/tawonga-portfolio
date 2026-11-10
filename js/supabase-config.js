const runtimeConfig = globalThis.GGC_SUPABASE_CONFIG || {};

export const SUPABASE_URL = runtimeConfig.url || 'https://fwwyfkfimyvhagmfqpry.supabase.co';
export const SUPABASE_ANON_KEY = runtimeConfig.anonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3d3lma2ZpbXl2aGFnbWZxcHJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MzA3ODMsImV4cCI6MjA5NjUwNjc4M30.A0fTSo-vr76ii33NxfqcPIhflUkpZ-GIrT81Ebz1i58';

export function isSupabaseConfigured() {
  return Boolean(
    SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    !SUPABASE_URL.includes('YOUR_PROJECT') &&
    !SUPABASE_ANON_KEY.includes('YOUR_SUPABASE')
  );
}
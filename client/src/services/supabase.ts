import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables supplied via Vite (e.g. on Vercel deployment)
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    })
  : null;

if (isSupabaseConfigured) {
  console.log('⚡ [Client Supabase] Initialized with endpoint:', supabaseUrl);
} else {
  console.info('ℹ️ [Client Supabase] VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY not set. Using WebSocket state stream.');
}

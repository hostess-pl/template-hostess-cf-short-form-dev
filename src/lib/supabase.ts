import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from 'astro:env/server';

import { readEnvString } from '@/lib/runtimeEnv';

let cached: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient | null {
  const url = SUPABASE_URL || readEnvString('SUPABASE_URL');
  const key = SUPABASE_SERVICE_ROLE_KEY || readEnvString('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) return null;
  if (!cached) {
    cached = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getPublicSupabaseUrl } from '@/lib/cms/env'
import { readEnvString } from '@/lib/runtimeEnv'
import { getSupabaseAdmin } from '@/lib/supabase'

let cached: SupabaseClient | null = null

/**
 * Service-role client for cms_* / site-media.
 * Prefer dedicated CMS credentials when analytics lives on a different Supabase project.
 */
export function getCmsSupabaseAdmin(): SupabaseClient | null {
  const url =
    getPublicSupabaseUrl() ||
    readEnvString('CMS_SUPABASE_URL') ||
    readEnvString('PUBLIC_SUPABASE_URL') ||
    readEnvString('SUPABASE_URL')
  const key =
    readEnvString('CMS_SUPABASE_SERVICE_ROLE_KEY') ||
    readEnvString('SUPABASE_SERVICE_ROLE_KEY')

  if (url && key) {
    if (!cached) {
      cached = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    }
    return cached
  }

  return getSupabaseAdmin()
}

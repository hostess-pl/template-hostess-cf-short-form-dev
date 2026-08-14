import {
  GENERATED_PUBLIC_CMS_SITE_SLUG,
  GENERATED_PUBLIC_SUPABASE_ANON_KEY,
  GENERATED_PUBLIC_SUPABASE_URL,
} from '@/generated/public-cms-env'
import { readEnvString } from '@/lib/runtimeEnv'

function trim(value: string | undefined | null): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function getCmsSiteSlug(): string {
  // Prefer runtime Worker bindings over build-time generated defaults so
  // secret flips (Test→Prod CMS) take effect without stale tip placeholders.
  return (
    trim(import.meta.env.PUBLIC_CMS_SITE_SLUG) ||
    trim(readEnvString('PUBLIC_CMS_SITE_SLUG')) ||
    trim(readEnvString('CMS_SITE_SLUG')) ||
    trim(GENERATED_PUBLIC_CMS_SITE_SLUG)
  )
}

export function getPublicSupabaseUrl(): string {
  return (
    trim(import.meta.env.PUBLIC_SUPABASE_URL) ||
    trim(readEnvString('PUBLIC_SUPABASE_URL')) ||
    trim(readEnvString('SUPABASE_URL')) ||
    trim(GENERATED_PUBLIC_SUPABASE_URL)
  )
}

export function getPublicSupabaseAnonKey(): string {
  return (
    trim(import.meta.env.PUBLIC_SUPABASE_ANON_KEY) ||
    trim(readEnvString('PUBLIC_SUPABASE_ANON_KEY')) ||
    trim(GENERATED_PUBLIC_SUPABASE_ANON_KEY)
  )
}

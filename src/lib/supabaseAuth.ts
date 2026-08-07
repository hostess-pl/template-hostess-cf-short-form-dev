import { createServerClient, createBrowserClient, type CookieOptions } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { AstroCookies } from 'astro'
import { getPublicSupabaseAnonKey, getPublicSupabaseUrl } from '@/lib/cms/env'

export function createSupabaseBrowser(
  urlOverride?: string,
  anonOverride?: string,
): SupabaseClient | null {
  const url = urlOverride?.trim() || getPublicSupabaseUrl()
  const anon = anonOverride?.trim() || getPublicSupabaseAnonKey()
  if (!url || !anon) return null
  return createBrowserClient(url, anon, {
    auth: {
      flowType: 'pkce',
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true,
    },
  })
}

export function createSupabaseServer(
  cookies: AstroCookies,
  requestCookies?: string,
): SupabaseClient | null {
  const url = getPublicSupabaseUrl()
  const anon = getPublicSupabaseAnonKey()
  if (!url || !anon) return null

  return createServerClient(url, anon, {
    cookies: {
      get(name: string) {
        return cookies.get(name)?.value ?? parseCookieHeader(requestCookies)[name]
      },
      set(name: string, value: string, options: CookieOptions) {
        cookies.set(name, value, options)
      },
      remove(name: string, options: CookieOptions) {
        cookies.delete(name, options)
      },
    },
  })
}

function parseCookieHeader(header: string | undefined): Record<string, string> {
  if (!header) return {}
  const out: Record<string, string> = {}
  for (const part of header.split(';')) {
    const idx = part.indexOf('=')
    if (idx === -1) continue
    const key = part.slice(0, idx).trim()
    const value = part.slice(idx + 1).trim()
    if (key) out[key] = decodeURIComponent(value)
  }
  return out
}

export async function getSessionUser(cookies: AstroCookies, requestCookies?: string) {
  const supabase = createSupabaseServer(cookies, requestCookies)
  if (!supabase) return { supabase: null, user: null }
  const { data } = await supabase.auth.getUser()
  return { supabase, user: data.user }
}

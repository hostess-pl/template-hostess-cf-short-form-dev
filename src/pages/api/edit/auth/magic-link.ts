import type { APIRoute } from 'astro'
import { createHash } from 'node:crypto'
import { jsonError, jsonOk, isEmailSiteMember } from '@/lib/cms/access'
import { getCmsSiteSlug } from '@/lib/cms/env'
import { getCmsSupabaseAdmin } from '@/lib/cms/supabaseAdmin'

const WINDOW_MINUTES = 1
const MAX_PER_WINDOW = 1

const COOLDOWN_MESSAGE = 'Please wait a minute before requesting another link.'
const UNAVAILABLE_MESSAGE = 'Sign-in is temporarily unavailable. Please try again shortly.'
const INVITE_ONLY_MESSAGE = 'This email is not invited to edit this site.'

export const prerender = false

function isLocalHost(url: string): boolean {
  return url.includes('localhost') || url.includes('127.0.0.1')
}

function resolveAuthSiteOrigin(request: Request): string {
  try {
    const origin = new URL(request.url).origin.replace(/\/$/, '')
    if (origin && !isLocalHost(origin)) return origin
  } catch {
    // fall through
  }
  try {
    return new URL(request.url).origin.replace(/\/$/, '')
  } catch {
    return 'http://localhost:4321'
  }
}

/** Per-site invite quota so ops email is not shared across all client Workers. */
function inviteQuotaKey(email: string): string {
  const siteSlug = getCmsSiteSlug() || 'unknown'
  return createHash('sha256').update(`cms-magic-link:${siteSlug}:${email}`).digest('hex')
}

async function consumeInviteCheckQuota(email: string): Promise<
  | { allowed: true }
  | { allowed: false; reason: 'cooldown'; retryAfterSec: number }
  | { allowed: false; reason: 'unavailable'; retryAfterSec: number }
> {
  const admin = getCmsSupabaseAdmin()
  if (!admin) {
    // Fail closed when admin client is missing — do not pretend this is a cooldown.
    return { allowed: false, reason: 'unavailable', retryAfterSec: 60 }
  }

  const { data, error } = await admin.rpc('api_try_consume_quota', {
    p_route: 'cms_magic_link_invite',
    p_ip_hash: inviteQuotaKey(email),
    p_max: MAX_PER_WINDOW,
    p_window_minutes: WINDOW_MINUTES,
  })

  if (error || !data || typeof data !== 'object') {
    console.error('[magic-link] rate limit RPC error:', error?.message ?? 'empty')
    return { allowed: false, reason: 'unavailable', retryAfterSec: 60 }
  }

  const row = data as Record<string, unknown>
  if (row.allowed === true) return { allowed: true }
  return {
    allowed: false,
    reason: 'cooldown',
    retryAfterSec: Number(row.retry_after_sec ?? 60),
  }
}

/**
 * Invite gate only. The browser must call signInWithOtp so the PKCE code_verifier
 * stays in localStorage — server-side OTP breaks Workers cookie PKCE on callback.
 */
export const POST: APIRoute = async ({ request }) => {
  let body: { email?: string }
  try {
    body = (await request.json()) as { email?: string }
  } catch {
    return jsonError(400, 'Invalid JSON')
  }

  const email = body.email?.trim().toLowerCase()
  if (!email || !email.includes('@')) return jsonError(400, 'Enter a valid email')

  const quota = await consumeInviteCheckQuota(email)
  if (!quota.allowed) {
    if (quota.reason === 'unavailable') {
      return new Response(
        JSON.stringify({
          error: UNAVAILABLE_MESSAGE,
          retryAfterSec: quota.retryAfterSec,
        }),
        {
          status: 503,
          headers: {
            'content-type': 'application/json; charset=utf-8',
            'retry-after': String(quota.retryAfterSec),
          },
        },
      )
    }
    return new Response(
      JSON.stringify({
        error: COOLDOWN_MESSAGE,
        retryAfterSec: quota.retryAfterSec,
      }),
      {
        status: 429,
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'retry-after': String(quota.retryAfterSec),
        },
      },
    )
  }

  const invited = await isEmailSiteMember(email)
  if (!invited) {
    return jsonError(403, INVITE_ONLY_MESSAGE)
  }

  const redirectTo = `${resolveAuthSiteOrigin(request)}/edit/auth/callback`
  return jsonOk({ ok: true, redirectTo })
}

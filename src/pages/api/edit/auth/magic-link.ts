import type { APIRoute } from 'astro'
import { createHash } from 'node:crypto'
import { CMS_OPS_OWNER_EMAILS } from 'astro:env/server'
import { jsonError, jsonOk, isEmailSiteMember } from '@/lib/cms/access'
import { getCmsSiteSlug } from '@/lib/cms/env'
import { getCmsSupabaseAdmin } from '@/lib/cms/supabaseAdmin'
import { readEnvString } from '@/lib/runtimeEnv'

/** Per site × email — hostess quota. Ops owners are exempt. */
const WINDOW_MINUTES = 60
const MAX_PER_WINDOW = 2

const COOLDOWN_MESSAGE =
  'Please wait before requesting another code for this site (limit: 2 per hour).'
const UNAVAILABLE_MESSAGE = 'Sign-in is temporarily unavailable. Please try again shortly.'
const INVITE_ONLY_MESSAGE = 'This email is not invited to edit this site.'

export const prerender = false

function parseOpsOwnerEmails(): Set<string> {
  const raw =
    (typeof CMS_OPS_OWNER_EMAILS === 'string' ? CMS_OPS_OWNER_EMAILS : '') ||
    readEnvString('CMS_OPS_OWNER_EMAILS')
  return new Set(
    String(raw || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.includes('@')),
  )
}

function isOpsOwnerEmail(email: string): boolean {
  return parseOpsOwnerEmails().has(email)
}

/** Per-site invite quota so traffic on one Worker does not block another. */
function inviteQuotaKey(email: string): string {
  const siteSlug = getCmsSiteSlug() || 'unknown'
  return createHash('sha256').update(`cms-magic-link:${siteSlug}:${email}`).digest('hex')
}

async function consumeInviteCheckQuota(email: string): Promise<
  | { allowed: true }
  | { allowed: false; reason: 'cooldown'; retryAfterSec: number }
  | { allowed: false; reason: 'unavailable'; retryAfterSec: number }
> {
  if (isOpsOwnerEmail(email)) return { allowed: true }

  const admin = getCmsSupabaseAdmin()
  if (!admin) {
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
    retryAfterSec: Number(row.retry_after_sec ?? WINDOW_MINUTES * 60),
  }
}

/**
 * Invite gate only. Browser then calls signInWithOtp (no emailRedirectTo) and
 * verifyOtp({ type: 'email' }) with the 6-digit code — no PKCE / no clickable link.
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

  const invited = await isEmailSiteMember(email)
  if (!invited) {
    return jsonError(403, INVITE_ONLY_MESSAGE)
  }

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

  return jsonOk({ ok: true })
}

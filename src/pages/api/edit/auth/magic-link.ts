import type { APIRoute } from 'astro'
import { createHash } from 'node:crypto'
import { Resend } from 'resend'
import { RESEND_API_KEY, RESEND_FROM, CMS_OPS_OWNER_EMAILS } from 'astro:env/server'
import { jsonError, jsonOk, isEmailSiteMember } from '@/lib/cms/access'
import { getCmsSiteSlug } from '@/lib/cms/env'
import { getCmsSupabaseAdmin } from '@/lib/cms/supabaseAdmin'
import { readEnvString } from '@/lib/runtimeEnv'

/** Per site × email — avoids shared Supabase Auth SMTP project limits. */
const WINDOW_MINUTES = 60
const MAX_PER_WINDOW = 2

const COOLDOWN_MESSAGE =
  'Please wait before requesting another link for this site (limit: 2 per hour).'
const UNAVAILABLE_MESSAGE = 'Sign-in is temporarily unavailable. Please try again shortly.'
const INVITE_ONLY_MESSAGE = 'This email is not invited to edit this site.'
const EMAIL_UNAVAILABLE_MESSAGE =
  'Email sign-in is temporarily unavailable. Ask an admin for a direct link (cms:login-link).'

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

/** Per-site send quota so ops/admin traffic on one Worker does not block another. */
function sendQuotaKey(email: string): string {
  const siteSlug = getCmsSiteSlug() || 'unknown'
  return createHash('sha256').update(`cms-magic-link:${siteSlug}:${email}`).digest('hex')
}

async function consumeSendQuota(email: string): Promise<
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
    p_route: 'cms_magic_link_send',
    p_ip_hash: sendQuotaKey(email),
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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildMagicLinkEmail(loginUrl: string): { subject: string; text: string; html: string } {
  const subject = 'Twój link do edycji portfolio'
  const text = [
    'Cześć!',
    '',
    'Otwórz ten link, aby zalogować się do panelu edycji (ważny ok. 1 godziny):',
    loginUrl,
    '',
    'Jeśli nie prosiłaś o ten link, zignoruj tę wiadomość.',
  ].join('\n')
  const html = [
    '<!DOCTYPE html><html><body style="font-family:Georgia,serif;color:#222;line-height:1.5;">',
    '<p>Cześć!</p>',
    '<p>Kliknij poniższy przycisk, aby zalogować się do panelu edycji (link ważny ok. 1 godziny):</p>',
    `<p><a href="${escapeHtml(loginUrl)}" style="display:inline-block;background:#C4A46B;color:#fff;`,
    'text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;">Otwórz panel</a></p>',
    `<p style="font-size:13px;color:#666;word-break:break-all;">${escapeHtml(loginUrl)}</p>`,
    '<p style="font-size:13px;color:#888;">Jeśli nie prosiłaś o ten link, zignoruj tę wiadomość.</p>',
    '</body></html>',
  ].join('')
  return { subject, text, html }
}

async function sendMagicLinkEmail(to: string, loginUrl: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = (RESEND_API_KEY || readEnvString('RESEND_API_KEY') || '').trim()
  const from = (RESEND_FROM || readEnvString('RESEND_FROM') || '').trim()
  if (!apiKey || !from) {
    return { ok: false, error: 'resend_not_configured' }
  }

  const { subject, text, html } = buildMagicLinkEmail(loginUrl)
  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send({ from, to: [to], subject, text, html })
  if (error) {
    return { ok: false, error: error.message || 'resend_send_failed' }
  }
  return { ok: true }
}

/**
 * Invite gate + server-sent magic link (Resend + token_hash).
 * Avoids browser signInWithOtp / shared Supabase Auth SMTP rate limits.
 * Callback uses token_hash (no PKCE) — same path as cms:login-link.
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

  const quota = await consumeSendQuota(email)
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

  const admin = getCmsSupabaseAdmin()
  if (!admin) {
    return new Response(JSON.stringify({ error: UNAVAILABLE_MESSAGE, retryAfterSec: 60 }), {
      status: 503,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'retry-after': '60',
      },
    })
  }

  const redirectTo = `${resolveAuthSiteOrigin(request)}/edit/auth/callback`
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo },
  })

  const hashedToken = data?.properties?.hashed_token
  const verificationType = data?.properties?.verification_type || 'magiclink'
  if (error || !hashedToken) {
    console.error('[magic-link] generateLink failed:', error?.message ?? 'no_token')
    return new Response(JSON.stringify({ error: UNAVAILABLE_MESSAGE, retryAfterSec: 60 }), {
      status: 503,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'retry-after': '60',
      },
    })
  }

  const loginUrl = new URL(redirectTo)
  loginUrl.searchParams.set('token_hash', hashedToken)
  loginUrl.searchParams.set('type', verificationType)

  const sent = await sendMagicLinkEmail(email, loginUrl.toString())
  if (!sent.ok) {
    console.error('[magic-link] resend failed:', sent.error)
    return new Response(JSON.stringify({ error: EMAIL_UNAVAILABLE_MESSAGE }), {
      status: 503,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    })
  }

  return jsonOk({ ok: true, sent: true })
}

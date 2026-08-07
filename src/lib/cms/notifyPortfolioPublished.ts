/**
 * Best-effort client notify after portfolio publish (HMAC → ops/n8n).
 */
import { createHmac } from 'node:crypto'
import { readEnvString } from '@/lib/runtimeEnv'

export async function notifyPortfolioPublished(input: {
  submissionId?: string
  siteSlug: string
  siteUrl: string
}): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const url = (
    readEnvString('PORTFOLIO_PUBLISH_NOTIFY_URL')
    || readEnvString('WF_PORTFOLIO_PUBLISH_NOTIFY_URL')
    || ''
  ).trim()
  const secret = (
    readEnvString('PORTFOLIO_PUBLISH_HMAC_SECRET')
    || readEnvString('WF_PORTFOLIO_PUBLISH_HMAC_SECRET')
    || readEnvString('WF_OPS_RUNNER_SECRET')
    || ''
  ).trim()

  if (!url || !secret) {
    return { ok: true, skipped: true, error: 'notify_url_or_secret_missing' }
  }

  const ts = String(Date.now())
  const submissionId = String(input.submissionId || '').trim()
  const siteSlug = String(input.siteSlug || '').trim().toLowerCase()
  const body = `${ts}.${submissionId}.${siteSlug}`
  const signature = createHmac('sha256', secret).update(body).digest('hex')

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        action: 'portfolio-published-notify',
        submissionId: submissionId || undefined,
        siteSlug,
        siteUrl: input.siteUrl,
        previewUrl: input.siteUrl,
        ts,
        signature,
      }),
    })
    if (!res.ok) {
      return { ok: false, error: `upstream_${res.status}` }
    }
    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'notify_failed',
    }
  }
}

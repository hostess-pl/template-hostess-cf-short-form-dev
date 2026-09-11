import { createHmac } from 'node:crypto'
import { readEnvString } from '@/lib/runtimeEnv'

export type AccountDeletionRequest = {
  userId: string
  siteId: string
  siteSlug: string
  submissionId?: string
}

export async function requestAccountDeletion(input: AccountDeletionRequest): Promise<{ ok: boolean; error?: string }> {
  const publishUrl = (readEnvString('PORTFOLIO_PUBLISH_NOTIFY_URL') || readEnvString('WF_PORTFOLIO_PUBLISH_NOTIFY_URL') || '').trim()
  const url = (readEnvString('ACCOUNT_DELETE_URL') || publishUrl.replace(/portfolio-published-notify\/?$/, 'hostess-account-delete')).trim()
  const secret = (readEnvString('ACCOUNT_DELETE_HMAC_SECRET') || readEnvString('PORTFOLIO_PUBLISH_HMAC_SECRET') || readEnvString('WF_PORTFOLIO_PUBLISH_HMAC_SECRET') || '').trim()
  if (!url || !secret) return { ok: false, error: 'account_deletion_not_configured' }

  const ts = String(Date.now())
  const submissionId = String(input.submissionId || '').trim()
  const siteSlug = String(input.siteSlug || '').trim().toLowerCase()
  const body = `${ts}.${input.userId}.${input.siteId}.${siteSlug}.${submissionId}`
  const signature = createHmac('sha256', secret).update(body).digest('hex')
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...input, siteSlug, submissionId: submissionId || undefined, ts, signature }),
      signal: AbortSignal.timeout(120_000),
    })
    if (!response.ok) return { ok: false, error: `upstream_${response.status}` }
    const result = await response.json().catch(() => ({})) as { ok?: boolean; result?: { ok?: boolean; error?: string }; error?: string }
    if (result.ok === false || result.result?.ok === false) return { ok: false, error: result.result?.error || result.error || 'account_deletion_failed' }
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'account_deletion_failed' }
  }
}

export const prerender = false

import type { APIRoute } from 'astro'
import { getSessionUser } from '@/lib/supabaseAuth'
import { jsonError, jsonOk, requireCmsProMember } from '@/lib/cms/access'
import { isShortFormProductMode } from '@/lib/portfolioMode'
import { loadHostessJson } from '@/lib/hostess'
import { requestAccountDeletion } from '@/lib/cms/requestAccountDeletion'

const CONFIRMATIONS = new Set(['USUŃ NA ZAWSZE', 'DELETE FOREVER'])

export const POST: APIRoute = async ({ cookies, request }) => {
  if (!isShortFormProductMode()) return jsonError(404, 'Not found')
  const origin = request.headers.get('origin')
  if (origin && origin !== new URL(request.url).origin) return jsonError(403, 'Invalid request origin')
  if (!request.headers.get('content-type')?.toLowerCase().includes('application/json')) {
    return jsonError(415, 'JSON required')
  }

  const { supabase, user } = await getSessionUser(cookies, request.headers.get('cookie') ?? undefined)
  if (!supabase || !user) return jsonError(401, 'Sign in required')
  const member = await requireCmsProMember(supabase, user)
  if (member instanceof Response) return member
  if (member.role !== 'owner') return jsonError(403, 'Only the portfolio owner can delete the account')

  const payload = await request.json().catch(() => ({})) as { confirmation?: unknown }
  if (!CONFIRMATIONS.has(String(payload.confirmation || '').trim())) {
    return jsonError(400, 'Confirmation phrase does not match')
  }

  let submissionId = ''
  try {
    const hostess = loadHostessJson() as { submissionId?: string }
    submissionId = String(hostess.submissionId || '').trim()
  } catch {
    submissionId = ''
  }

  const deletion = await requestAccountDeletion({
    userId: user.id,
    siteId: member.site.id,
    siteSlug: member.site.slug,
    submissionId,
  })
  if (!deletion.ok) return jsonError(502, deletion.error || 'Account deletion failed')
  return jsonOk({ ok: true })
}

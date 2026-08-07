export const prerender = false

import type { APIRoute } from 'astro'
import { getSessionUser } from '@/lib/supabaseAuth'
import { jsonError, jsonOk, requireCmsProMember } from '@/lib/cms/access'
import { getCmsSupabaseAdmin } from '@/lib/cms/supabaseAdmin'
import { cmsCacheInvalidatePrefix } from '@/lib/cms/cache'
import { isShortFormProductMode } from '@/lib/portfolioMode'
import { notifyPortfolioPublished } from '@/lib/cms/notifyPortfolioPublished'
import { getCmsSiteSlug } from '@/lib/cms/env'
import { loadHostessJson } from '@/lib/hostess'
import { readEnvString } from '@/lib/runtimeEnv'

export const POST: APIRoute = async ({ cookies, request }) => {
  if (!isShortFormProductMode()) {
    return jsonError(404, 'Not found')
  }

  const { supabase, user } = await getSessionUser(
    cookies,
    request.headers.get('cookie') ?? undefined,
  )
  if (!supabase || !user) return jsonError(401, 'Sign in required')
  const member = await requireCmsProMember(supabase, user)
  if (member instanceof Response) return member

  const admin = getCmsSupabaseAdmin()
  if (!admin) return jsonError(503, 'Database unavailable')

  const publishedAt = new Date().toISOString()
  const { data, error } = await admin
    .from('cms_sites')
    .update({
      portfolio_status: 'published',
      published_at: publishedAt,
    })
    .eq('id', member.site.id)
    .select('id, portfolio_status, published_at, slug')
    .single()

  if (error) return jsonError(500, error.message)

  cmsCacheInvalidatePrefix('')

  const siteUrl = (
    readEnvString('SITE_URL')
    || new URL(request.url).origin
  ).replace(/\/$/, '')
  const slug = String(data?.slug || getCmsSiteSlug() || member.site.slug || '').trim()
  let submissionId = ''
  try {
    const hostess = loadHostessJson() as { submissionId?: string }
    submissionId = String(hostess.submissionId || '').trim()
  } catch {
    submissionId = ''
  }

  const notify = await notifyPortfolioPublished({
    submissionId,
    siteSlug: slug,
    siteUrl,
  })

  return jsonOk({
    ok: true,
    portfolio_status: data?.portfolio_status ?? 'published',
    published_at: data?.published_at ?? publishedAt,
    notify,
  })
}

export const GET: APIRoute = async ({ cookies, request }) => {
  if (!isShortFormProductMode()) {
    return jsonError(404, 'Not found')
  }
  const { supabase, user } = await getSessionUser(
    cookies,
    request.headers.get('cookie') ?? undefined,
  )
  if (!supabase || !user) return jsonError(401, 'Sign in required')
  const member = await requireCmsProMember(supabase, user)
  if (member instanceof Response) return member
  return jsonOk({
    portfolio_status: member.site.portfolio_status ?? 'published',
    published_at: member.site.published_at ?? null,
  })
}

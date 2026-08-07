import type { APIRoute } from 'astro'
import { jsonError, jsonOk, requireCmsProMember } from '@/lib/cms/access'
import { getCmsSupabaseAdmin } from '@/lib/cms/supabaseAdmin'
import { getSessionUser } from '@/lib/supabaseAuth'

export const prerender = false

type EventRow = {
  created_at: string
  event_type: string
  user_hash: string
  locale: string
  device_type: string
  utm_source: string
  page_path: string
  metadata: Record<string, unknown> | null
}

function countBy(rows: EventRow[], keyFn: (r: EventRow) => string): Record<string, number> {
  const out: Record<string, number> = {}
  for (const row of rows) {
    const key = keyFn(row) || 'unknown'
    out[key] = (out[key] ?? 0) + 1
  }
  return out
}

export const GET: APIRoute = async ({ cookies, request }) => {
  const { supabase, user } = await getSessionUser(cookies, request.headers.get('cookie') ?? undefined)
  if (!supabase || !user) return jsonError(401, 'Sign in required')

  const member = await requireCmsProMember(supabase, user)
  if (member instanceof Response) return member
  if (member.site.plan !== 'pro') {
    return jsonError(403, 'Analytics is available on the Pro plan')
  }

  const admin = getCmsSupabaseAdmin()
  if (!admin) return jsonError(503, 'Database unavailable')

  const slug = member.site.slug
  const sinceParam = new URL(request.url).searchParams.get('since')
  const since = sinceParam
    ? new Date(sinceParam)
    : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  if (Number.isNaN(since.getTime())) return jsonError(400, 'Invalid since')

  const { data, error } = await admin
    .from('analytics_events')
    .select(
      'created_at, event_type, user_hash, locale, device_type, utm_source, page_path, metadata',
    )
    .gte('created_at', since.toISOString())
    .like('site_id', `${slug}:%`)
    .order('created_at', { ascending: false })
    .limit(5000)

  if (error) return jsonError(500, error.message)

  const rows = (data ?? []) as EventRow[]
  const pageViews = rows.filter((r) => r.event_type === 'page_view')
  const leads = rows.filter((r) => r.event_type === 'lead_captured')
  const uniqueVisitors = new Set(pageViews.map((r) => r.user_hash)).size
  const uniqueSessions = new Set(
    pageViews
      .map((r) => (typeof r.metadata?.session_id === 'string' ? r.metadata.session_id : ''))
      .filter(Boolean),
  ).size

  return jsonOk({
    plan: member.site.plan,
    subprojectId: slug,
    since: since.toISOString(),
    summary: {
      page_views: pageViews.length,
      unique_visitors: uniqueVisitors,
      sessions: uniqueSessions,
      leads: leads.length,
    },
    devices: countBy(pageViews, (r) => r.device_type),
    locales: countBy(pageViews, (r) => r.locale),
    utm_sources: countBy(pageViews, (r) => r.utm_source || 'direct'),
    pages: countBy(pageViews, (r) => r.page_path || '/'),
    latest: rows.slice(0, 25).map((r) => ({
      created_at: r.created_at,
      event_type: r.event_type,
      locale: r.locale,
      device_type: r.device_type,
      utm_source: r.utm_source,
      page_path: r.page_path,
    })),
  })
}

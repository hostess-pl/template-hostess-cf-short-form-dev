import type { APIRoute } from 'astro'
import { getSessionUser } from '@/lib/supabaseAuth'
import { jsonError, jsonOk, requireCmsProMember, saveDocument } from '@/lib/cms/access'
import { getCmsSupabaseAdmin } from '@/lib/cms/supabaseAdmin'
import { migrateCopyByLocale } from '@/lib/cms/i18n'

export const prerender = false

async function loadFallbackDocument(): Promise<Record<string, unknown>> {
  try {
    const mod = await import('@/content/hostess.json')
    return (mod.default ?? mod) as Record<string, unknown>
  } catch {
    return {}
  }
}

/** Ensure short-form provisioned hero is visible to the completion wizard. */
function normalizeDocumentAssets(doc: Record<string, unknown>): Record<string, unknown> {
  const assets =
    doc.assets && typeof doc.assets === 'object' && !Array.isArray(doc.assets)
      ? { ...(doc.assets as Record<string, unknown>) }
      : {}
  if (!String(assets.hero || '').trim()) {
    assets.hero = 'hero.jpg'
  }
  return { ...doc, assets }
}

function prepareDocument(doc: Record<string, unknown>): Record<string, unknown> {
  const withAssets = normalizeDocumentAssets(doc)
  const { doc: migrated } = migrateCopyByLocale(withAssets)
  return migrated
}

export const GET: APIRoute = async ({ cookies, request }) => {
  const { supabase, user } = await getSessionUser(cookies, request.headers.get('cookie') ?? undefined)
  if (!supabase || !user) return jsonError(401, 'Sign in required')
  const member = await requireCmsProMember(supabase, user)
  if (member instanceof Response) return member

  const admin = getCmsSupabaseAdmin()
  if (!admin) return jsonError(503, 'Database unavailable')

  const { data } = await admin
    .from('cms_content')
    .select('data')
    .eq('site_id', member.site.id)
    .eq('locale', '_')
    .eq('section', 'document')
    .maybeSingle()

  if (data?.data && typeof data.data === 'object') {
    const raw = data.data as Record<string, unknown>
    const { doc: migrated, changed } = migrateCopyByLocale(normalizeDocumentAssets(raw))
    if (changed) {
      await saveDocument(member.site, user.id, migrated)
    }
    return jsonOk({ data: migrated })
  }

  const fallback = prepareDocument(await loadFallbackDocument())
  return jsonOk({ data: fallback })
}

export const PUT: APIRoute = async ({ cookies, request }) => {
  const { supabase, user } = await getSessionUser(cookies, request.headers.get('cookie') ?? undefined)
  if (!supabase || !user) return jsonError(401, 'Sign in required')
  const member = await requireCmsProMember(supabase, user)
  if (member instanceof Response) return member

  let body: { data?: unknown }
  try {
    body = (await request.json()) as { data?: unknown }
  } catch {
    return jsonError(400, 'Invalid JSON')
  }
  if (!body.data || typeof body.data !== 'object') return jsonError(400, 'Missing data')
  const { doc: migrated } = migrateCopyByLocale(body.data as Record<string, unknown>)
  return saveDocument(member.site, user.id, migrated)
}

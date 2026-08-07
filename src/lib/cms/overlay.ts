import { getCmsSupabaseAdmin } from '@/lib/cms/supabaseAdmin'
import { getCmsSiteSlug } from '@/lib/cms/env'
import { resolveCmsSite } from '@/lib/cms/site'
import { cmsCacheGet, cmsCacheSet } from '@/lib/cms/cache'

/** Fetch CMS overlay document (full hostess.json shape) or null. */
export async function fetchCmsDocumentOverlay(): Promise<Record<string, unknown> | null> {
  const slug = getCmsSiteSlug()
  const site = await resolveCmsSite()
  if (!site) {
    console.warn('[cms] overlay skipped: no cms site', slug || '(empty slug)')
    return null
  }
  const cacheKey = `doc:${site.id}:${site.content_version}`
  const cached = cmsCacheGet<Record<string, unknown>>(cacheKey, site.content_version)
  if (cached) return cached

  const admin = getCmsSupabaseAdmin()
  if (!admin) {
    console.warn('[cms] overlay skipped: no admin client', slug)
    return null
  }
  const { data, error } = await admin
    .from('cms_content')
    .select('data')
    .eq('site_id', site.id)
    .eq('locale', '_')
    .eq('section', 'document')
    .maybeSingle()
  if (error || !data?.data || typeof data.data !== 'object') {
    console.warn(
      '[cms] overlay skipped: no document',
      slug,
      error?.message ?? 'empty or missing row',
    )
    return null
  }
  const doc = data.data as Record<string, unknown>
  cmsCacheSet(cacheKey, site.content_version, doc)
  return doc
}

export function deepMergeHostess(
  base: Record<string, unknown>,
  overlay: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base }
  for (const [key, value] of Object.entries(overlay)) {
    if (value === null || value === undefined) continue
    const prev = out[key]
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      prev &&
      typeof prev === 'object' &&
      !Array.isArray(prev)
    ) {
      out[key] = deepMergeHostess(prev as Record<string, unknown>, value as Record<string, unknown>)
    } else {
      out[key] = value
    }
  }
  return out
}

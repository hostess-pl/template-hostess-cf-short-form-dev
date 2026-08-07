import { getCmsSupabaseAdmin } from '@/lib/cms/supabaseAdmin'
import { getCmsSiteSlug } from '@/lib/cms/env'
import { cmsCacheGet, cmsCacheSet, cmsCacheInvalidatePrefix } from '@/lib/cms/cache'

export type CmsSiteRow = {
  id: string
  slug: string
  name: string
  plan: 'free' | 'pro'
  content_version: number
  portfolio_status?: 'draft' | 'published' | 'awaiting_payment' | 'suspended'
  published_at?: string | null
}

let sitePromise: Promise<CmsSiteRow | null> | null = null

export async function resolveCmsSite(): Promise<CmsSiteRow | null> {
  const slug = getCmsSiteSlug()
  const cached = cmsCacheGet<CmsSiteRow>(`site:${slug}`, 0)
  if (cached) return cached

  if (!sitePromise) {
    sitePromise = (async () => {
      const admin = getCmsSupabaseAdmin()
      if (!admin) return null
      const { data, error } = await admin
        .from('cms_sites')
        .select('id, slug, name, plan, content_version, portfolio_status, published_at')
        .eq('slug', slug)
        .maybeSingle()
      if (error || !data) return null
      const row = {
        ...(data as CmsSiteRow),
        portfolio_status: (data as CmsSiteRow).portfolio_status || 'published',
      }
      cmsCacheSet(`site:${slug}`, 0, row)
      return row
    })().finally(() => {
      sitePromise = null
    })
  }
  return sitePromise
}

export async function bumpCmsContentVersion(siteId: string): Promise<number> {
  const admin = getCmsSupabaseAdmin()
  if (!admin) return 0
  const site = await resolveCmsSite()
  const next = (site?.content_version ?? 0) + 1
  const { error } = await admin.from('cms_sites').update({ content_version: next }).eq('id', siteId)
  if (error) throw new Error(error.message)
  cmsCacheInvalidatePrefix('')
  cmsCacheSet(`site:${getCmsSiteSlug()}`, 0, {
    id: siteId,
    slug: site?.slug ?? getCmsSiteSlug(),
    name: site?.name ?? 'Hostess site',
    plan: site?.plan ?? 'pro',
    content_version: next,
    portfolio_status: site?.portfolio_status ?? 'published',
    published_at: site?.published_at ?? null,
  })
  return next
}

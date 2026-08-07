import type { SupabaseClient, User } from '@supabase/supabase-js'
import { resolveCmsSite, bumpCmsContentVersion, type CmsSiteRow } from '@/lib/cms/site'
import { cmsCacheInvalidatePrefix } from '@/lib/cms/cache'

export async function requireCmsMember(
  supabase: SupabaseClient,
  user: User,
): Promise<{ site: CmsSiteRow; role: 'owner' | 'editor' } | Response> {
  const site = await resolveCmsSite()
  if (!site) return jsonError(503, 'CMS site is not configured')
  const { data, error } = await supabase
    .from('cms_site_members')
    .select('role')
    .eq('site_id', site.id)
    .eq('user_id', user.id)
    .maybeSingle()
  if (error) return jsonError(500, error.message)
  if (!data) return jsonError(403, 'You are signed in but not invited to edit this site')
  return { site, role: data.role as 'owner' | 'editor' }
}

/** CMS editor + write APIs require Pro hosting plan. */
export async function requireCmsProMember(
  supabase: SupabaseClient,
  user: User,
): Promise<{ site: CmsSiteRow; role: 'owner' | 'editor' } | Response> {
  const member = await requireCmsMember(supabase, user)
  if (member instanceof Response) return member
  if (member.site.plan !== 'pro') {
    return jsonError(403, 'CMS editing is available on the Pro plan')
  }
  return member
}

/** Service-role check: is this email a member of the current CMS site? */
export async function isEmailSiteMember(email: string): Promise<boolean> {
  const admin = (await import('@/lib/cms/supabaseAdmin')).getCmsSupabaseAdmin()
  if (!admin) return false
  const site = await resolveCmsSite()
  if (!site) return false

  const listed = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
  if (listed.error) return false
  const user = listed.data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
  if (!user) return false

  const { data } = await admin
    .from('cms_site_members')
    .select('user_id')
    .eq('site_id', site.id)
    .eq('user_id', user.id)
    .maybeSingle()
  return Boolean(data)
}

export function jsonError(status: number, error: string): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}

export function jsonOk(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}

export async function saveDocument(
  site: CmsSiteRow,
  userId: string,
  data: unknown,
): Promise<Response> {
  const admin = (await import('@/lib/cms/supabaseAdmin')).getCmsSupabaseAdmin()
  if (!admin) return jsonError(503, 'Database unavailable')
  if (!data || typeof data !== 'object') return jsonError(400, 'Invalid document')

  const { error } = await admin.from('cms_content').upsert(
    {
      site_id: site.id,
      locale: '_',
      section: 'document',
      data,
      updated_at: new Date().toISOString(),
      updated_by: userId,
    },
    { onConflict: 'site_id,locale,section' },
  )
  if (error) return jsonError(500, error.message)
  await bumpCmsContentVersion(site.id)
  cmsCacheInvalidatePrefix('')
  return jsonOk({ ok: true })
}

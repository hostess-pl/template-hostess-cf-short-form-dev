/**
 * Shared CMS owner invites for hostess email + ops (CMS_OPS_OWNER_EMAILS).
 */
import { createClient } from '@supabase/supabase-js'

export function parseOpsOwnerEmails(raw = process.env.CMS_OPS_OWNER_EMAILS) {
  return String(raw || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.includes('@'))
}

export function parseOwnerEmails({ hostessEmail, includeHostess = true, opsEmails } = {}) {
  const emails = []
  const seen = new Set()
  const push = (email) => {
    const e = String(email || '').trim().toLowerCase()
    if (!e.includes('@') || seen.has(e)) return
    seen.add(e)
    emails.push(e)
  }
  if (includeHostess) push(hostessEmail)
  for (const e of opsEmails ?? parseOpsOwnerEmails()) push(e)
  return emails
}

/**
 * Ensure auth user + cms_site_members row for each email.
 * @returns {{ invited: string[], failed: Array<{ email: string, error: string }> }}
 */
export async function inviteEmailsAsOwners(admin, siteId, emails, role = 'owner') {
  const invited = []
  const failed = []
  if (!siteId || !emails?.length) return { invited, failed }

  const listed = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
  if (listed.error) {
    return {
      invited,
      failed: emails.map((email) => ({ email, error: listed.error.message })),
    }
  }

  for (const email of emails) {
    try {
      let user = listed.data.users.find((u) => u.email?.toLowerCase() === email)
      if (!user) {
        const created = await admin.auth.admin.createUser({ email, email_confirm: true })
        if (created.error || !created.data.user) {
          failed.push({ email, error: created.error?.message || 'createUser failed' })
          continue
        }
        user = created.data.user
        listed.data.users.push(user)
      }

      const { error: memberError } = await admin.from('cms_site_members').upsert(
        { site_id: siteId, user_id: user.id, role },
        { onConflict: 'site_id,user_id' },
      )
      if (memberError) {
        failed.push({ email, error: memberError.message })
        continue
      }
      invited.push(email)
    } catch (error) {
      failed.push({ email, error: error?.message || String(error) })
    }
  }

  return { invited, failed }
}

/**
 * Upsert cms_sites (and optionally cms_content) then invite owners.
 * For normal/ops-only: pass seedContent=false and plan='normal'.
 */
export async function ensureCmsSiteAndInviteOwners({
  supabaseUrl,
  serviceKey,
  slug,
  name,
  plan = 'pro',
  hostess = null,
  seedContent = true,
  ownerEmails = [],
}) {
  if (!supabaseUrl || !serviceKey || !slug) {
    return { ok: false, reason: 'missing_env', siteId: null, invited: [], failed: [] }
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const siteName = name || (hostess?.profile?.displayName ? `${hostess.profile.displayName} (${slug})` : slug)
  const { data: site, error: siteError } = await admin
    .from('cms_sites')
    .upsert({ slug, name: siteName, plan }, { onConflict: 'slug' })
    .select('id, slug')
    .single()

  if (siteError || !site) {
    return {
      ok: false,
      reason: 'site_error',
      error: siteError?.message || 'unknown',
      siteId: null,
      invited: [],
      failed: [],
    }
  }

  if (seedContent && hostess && typeof hostess === 'object') {
    const { error: contentError } = await admin.from('cms_content').upsert(
      {
        site_id: site.id,
        locale: '_',
        section: 'document',
        data: hostess,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'site_id,locale,section' },
    )
    if (contentError) {
      return {
        ok: false,
        reason: 'content_error',
        error: contentError.message,
        siteId: site.id,
        invited: [],
        failed: [],
      }
    }
  }

  const { invited, failed } = await inviteEmailsAsOwners(admin, site.id, ownerEmails)
  return { ok: true, reason: 'ok', siteId: site.id, invited, failed }
}

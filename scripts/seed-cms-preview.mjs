/**
 * Non-destructive Pro preview seed: upsert cms_sites (plan=pro) and insert
 * cms_content from hostess.json only when no document exists, or the row has
 * never been saved by an editor (updated_by is null).
 * Invites CMS_OPS_OWNER_EMAILS and (by default) hostess profile.email as owners.
 *
 * Env: SUPABASE_URL / WF_SUPABASE_URL_HOSTESSWEBS_TEST,
 *      SUPABASE_SERVICE_ROLE_KEY / SUPABASE_SERVICE_ROLE_KEY_HOSTESSWEBS_TEST,
 *      PUBLIC_CMS_SITE_SLUG / CMS_SITE_SLUG (or cms.site.json),
 *      CMS_OPS_OWNER_EMAILS (comma-separated)
 */
import { createClient } from '@supabase/supabase-js'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { inviteEmailsAsOwners, parseOwnerEmails } from './lib/cms-ops-invite.mjs'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return {}
  const vars = {}
  for (const line of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const t = line.trim()
    if (!t || t.startsWith('#') || !t.includes('=')) continue
    const i = t.indexOf('=')
    const k = t.slice(0, i).trim()
    let v = t.slice(i + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1)
    }
    vars[k] = v
  }
  return vars
}

function env(key, fileVars = {}) {
  return String(process.env[key] || fileVars[key] || '').trim()
}

export async function seedCmsPreviewIfNeeded(options = {}) {
  const fileVars = {
    ...loadEnvFile('/opt/iluro-core-ops/.env'),
    ...loadEnvFile(resolve(projectRoot, '.env')),
  }

  let siteMeta = {}
  try {
    siteMeta = JSON.parse(readFileSync(resolve(projectRoot, 'cms.site.json'), 'utf8'))
  } catch {
    // optional
  }

  const slug =
    options.slug ||
    env('PUBLIC_CMS_SITE_SLUG', fileVars) ||
    env('CMS_SITE_SLUG', fileVars) ||
    String(siteMeta.siteSlug || '').trim()

  const supabaseUrl =
    options.supabaseUrl ||
    env('SUPABASE_URL', fileVars) ||
    env('PUBLIC_SUPABASE_URL', fileVars) ||
    env('WF_SUPABASE_URL_HOSTESSWEBS_TEST', fileVars)

  const serviceKey =
    options.serviceKey ||
    env('SUPABASE_SERVICE_ROLE_KEY', fileVars) ||
    env('SUPABASE_SERVICE_ROLE_KEY_HOSTESSWEBS_TEST', fileVars)

  const hostess =
    options.hostess ||
    (() => {
      try {
        return JSON.parse(readFileSync(resolve(projectRoot, 'src/content/hostess.json'), 'utf8'))
      } catch {
        return null
      }
    })()

  const includeHostess = options.includeHostess !== false

  if (!slug || !supabaseUrl || !serviceKey) {
    console.warn(
      '[cms:seed-preview] Skipping — need slug + SUPABASE_URL + SERVICE_ROLE (Hostesswebs Test)',
    )
    return { seeded: false, reason: 'missing_env', invited: [] }
  }
  if (!hostess || typeof hostess !== 'object') {
    console.warn('[cms:seed-preview] Skipping — hostess.json missing')
    return { seeded: false, reason: 'missing_hostess', invited: [] }
  }

  // Never seed tip stub / invalid docs — empty location crashes Worker Zod at import.
  const seedLocation = String(hostess?.profile?.location || '').trim()
  const seedName = String(hostess?.profile?.displayName || '').trim()
  const seedEmail = String(hostess?.profile?.email || '').trim().toLowerCase()
  const looksLikeTemplateStub =
    !seedLocation
    || (seedName === 'Hostess' && seedEmail === 'ops@hostesswebs.pl')
  if (looksLikeTemplateStub && !String(slug).startsWith('tpl-')) {
    console.warn(
      `[cms:seed-preview] Skipping — refusing template stub hostess.json for client slug=${slug}`,
    )
    return { seeded: false, reason: 'template_stub', invited: [] }
  }

  if (!process.env.CMS_OPS_OWNER_EMAILS && fileVars.CMS_OPS_OWNER_EMAILS) {
    process.env.CMS_OPS_OWNER_EMAILS = fileVars.CMS_OPS_OWNER_EMAILS
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const name = hostess?.profile?.displayName
    ? `${hostess.profile.displayName} (${slug})`
    : slug

  // Short-form MVP: new sites start as draft (auth-gated). Existing editor-owned
  // rows keep portfolio_status unless explicitly forced via options.portfolioStatus.
  const portfolioStatus =
    options.portfolioStatus ||
    env('PORTFOLIO_STATUS', fileVars) ||
    'draft'

  const sitePayload = {
    slug,
    name,
    plan: 'pro',
  }
  const { data: existingSite } = await admin
    .from('cms_sites')
    .select('id, portfolio_status')
    .eq('slug', slug)
    .maybeSingle()

  if (!existingSite) {
    sitePayload.portfolio_status = portfolioStatus === 'published' ? 'published' : 'draft'
    if (sitePayload.portfolio_status === 'published') {
      sitePayload.published_at = new Date().toISOString()
    }
  } else if (options.forcePortfolioStatus) {
    sitePayload.portfolio_status = portfolioStatus === 'published' ? 'published' : 'draft'
    sitePayload.published_at =
      sitePayload.portfolio_status === 'published' ? new Date().toISOString() : null
  }

  const { data: site, error: siteError } = await admin
    .from('cms_sites')
    .upsert(sitePayload, { onConflict: 'slug' })
    .select('id, slug, portfolio_status')
    .single()

  if (siteError || !site) {
    console.error('[cms:seed-preview] cms_sites upsert failed:', siteError?.message || 'unknown')
    return { seeded: false, reason: 'site_error', invited: [] }
  }
  console.log(
    `[cms:seed-preview] cms_sites ok slug=${slug} portfolio_status=${site.portfolio_status || existingSite?.portfolio_status || 'n/a'}`,
  )

  const { data: existing, error: existingError } = await admin
    .from('cms_content')
    .select('updated_by')
    .eq('site_id', site.id)
    .eq('locale', '_')
    .eq('section', 'document')
    .maybeSingle()

  if (existingError) {
    console.error('[cms:seed-preview] cms_content lookup failed:', existingError.message)
    return { seeded: false, reason: 'lookup_error', invited: [] }
  }

  let seeded = false
  let reason = 'skipped'

  if (existing && existing.updated_by) {
    console.log(`[cms:seed-preview] Skip content seed — editor has saved (slug=${slug})`)
    reason = 'editor_owned'
  } else {
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
      console.error('[cms:seed-preview] cms_content upsert failed:', contentError.message)
      return { seeded: false, reason: 'content_error', invited: [] }
    }
    seeded = true
    reason = existing ? 'refreshed' : 'inserted'
    console.log(`[cms:seed-preview] Seeded cms_content from hostess.json (slug=${slug})`)
  }

  const invited = await inviteSiteOwners(admin, site.id, hostess, includeHostess)
  return { seeded, reason, invited }
}

async function inviteSiteOwners(admin, siteId, hostess, includeHostess) {
  const hostessEmail = String(hostess?.profile?.email || '').trim().toLowerCase()
  const emails = parseOwnerEmails({ hostessEmail, includeHostess })
  if (!emails.length) return []
  const inviteResult = await inviteEmailsAsOwners(admin, siteId, emails)
  for (const fail of inviteResult.failed) {
    console.error(`[cms:seed-preview] invite failed for ${fail.email}:`, fail.error)
  }
  if (inviteResult.invited.length) {
    console.log(`[cms:seed-preview] CMS owners invited: ${inviteResult.invited.join(', ')}`)
  }
  return inviteResult.invited
}

/**
 * Minimal cms_sites row + ops owners for normal (non-Pro) previews.
 * Prefer seedCmsPreviewIfNeeded for short-form / complimentary Pro CMS runtime.
 */
export async function ensureOpsCmsMembership(options = {}) {
  const fileVars = {
    ...loadEnvFile('/opt/iluro-core-ops/.env'),
    ...loadEnvFile(resolve(projectRoot, '.env')),
  }

  const slug =
    options.slug ||
    env('PUBLIC_CMS_SITE_SLUG', fileVars) ||
    env('CMS_SITE_SLUG', fileVars)

  const supabaseUrl =
    options.supabaseUrl ||
    env('SUPABASE_URL', fileVars) ||
    env('PUBLIC_SUPABASE_URL', fileVars) ||
    env('WF_SUPABASE_URL_HOSTESSWEBS_TEST', fileVars)

  const serviceKey =
    options.serviceKey ||
    env('SUPABASE_SERVICE_ROLE_KEY', fileVars) ||
    env('SUPABASE_SERVICE_ROLE_KEY_HOSTESSWEBS_TEST', fileVars)

  if (!slug || !supabaseUrl || !serviceKey) {
    return { ok: false, reason: 'missing_env', invited: [] }
  }

  const { ensureCmsSiteAndInviteOwners, parseOwnerEmails: parseOwners } = await import(
    './lib/cms-ops-invite.mjs'
  )
  if (!process.env.CMS_OPS_OWNER_EMAILS && fileVars.CMS_OPS_OWNER_EMAILS) {
    process.env.CMS_OPS_OWNER_EMAILS = fileVars.CMS_OPS_OWNER_EMAILS
  }
  const hostess = options.hostess || null
  const includeHostess = options.includeHostess === true
  const ownerEmails = parseOwners({
    hostessEmail: hostess?.profile?.email,
    includeHostess,
  })
  if (!ownerEmails.length) {
    return { ok: false, reason: 'no_ops_emails', invited: [] }
  }

  const result = await ensureCmsSiteAndInviteOwners({
    supabaseUrl,
    serviceKey,
    slug,
    plan: options.plan || 'free',
    hostess,
    seedContent: Boolean(options.seedContent),
    ownerEmails,
  })
  if (!result.ok) {
    console.warn(`[cms:ops-membership] failed (${result.reason}):`, result.error || 'unknown')
    return { ok: false, reason: result.reason, invited: [] }
  }
  for (const fail of result.failed) {
    console.error(`[cms:ops-membership] invite failed for ${fail.email}:`, fail.error)
  }
  if (result.invited.length) {
    console.log(`[cms:ops-membership] CMS owners invited: ${result.invited.join(', ')}`)
  }
  return { ok: true, reason: 'ok', invited: result.invited }
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])
if (isMain) {
  const result = await seedCmsPreviewIfNeeded()
  if (result.reason === 'site_error' || result.reason === 'content_error' || result.reason === 'lookup_error') {
    process.exit(1)
  }
}

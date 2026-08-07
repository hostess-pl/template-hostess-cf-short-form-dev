/**
 * Invite email as owner/editor for PUBLIC_CMS_SITE_SLUG
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return
  for (const line of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const t = line.trim()
    if (!t || t.startsWith('#') || !t.includes('=')) continue
    const i = t.indexOf('=')
    const k = t.slice(0, i).trim()
    if (process.env[k]) continue
    let v = t.slice(i + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1)
    }
    process.env[k] = v
  }
}

const email = process.argv[2]?.trim().toLowerCase()
const role = process.argv[3]?.trim() || 'owner'
const root = process.cwd()
loadEnvFile(resolve(root, '../hostesswebs/.env'))
loadEnvFile(resolve(root, '.env'))

const siteMeta = existsSync(resolve(root, 'cms.site.json'))
  ? JSON.parse(readFileSync(resolve(root, 'cms.site.json'), 'utf8'))
  : {}
const slug = process.env.PUBLIC_CMS_SITE_SLUG || process.env.CMS_SITE_SLUG || siteMeta.siteSlug
const url =
  process.env.SUPABASE_URL ||
  process.env.PUBLIC_SUPABASE_URL ||
  process.env.WF_SUPABASE_URL_HOSTESSWEBS_TEST
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY_HOSTESSWEBS_TEST

if (!email?.includes('@') || !slug || !url || !key) {
  console.error('Usage: node scripts/invite-cms-owner.mjs email@x.com [owner|editor]')
  process.exit(1)
}

const admin = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const { data: site, error: siteError } = await admin
  .from('cms_sites')
  .select('id')
  .eq('slug', slug)
  .single()
if (siteError || !site) {
  console.error(siteError?.message || 'Site not found — run cms:seed first')
  process.exit(1)
}

const listed = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
if (listed.error) {
  console.error(listed.error.message)
  process.exit(1)
}
let user = listed.data.users.find((u) => u.email?.toLowerCase() === email)
if (!user) {
  const created = await admin.auth.admin.createUser({ email, email_confirm: true })
  if (created.error || !created.data.user) {
    console.error(created.error?.message || 'createUser failed')
    process.exit(1)
  }
  user = created.data.user
  console.log(`Created auth user ${user.id}`)
}

const { error: memberError } = await admin.from('cms_site_members').upsert(
  { site_id: site.id, user_id: user.id, role },
  { onConflict: 'site_id,user_id' },
)
if (memberError) {
  console.error(memberError.message)
  process.exit(1)
}
console.log(`OK ${email} → ${role} on ${slug}`)

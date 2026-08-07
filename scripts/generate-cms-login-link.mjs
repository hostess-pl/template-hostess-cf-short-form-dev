/**
 * Generate a one-click CMS login URL (bypasses Supabase free SMTP rate limits).
 * Usage: pnpm cms:login-link you@email.com
 * Open the printed URL in the browser — no email required.
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
const root = process.cwd()
loadEnvFile(resolve(root, '../hostesswebs/.env'))
loadEnvFile(resolve(root, '.env'))

const siteMeta = existsSync(resolve(root, 'cms.site.json'))
  ? JSON.parse(readFileSync(resolve(root, 'cms.site.json'), 'utf8'))
  : {}
const wrangler = existsSync(resolve(root, 'wrangler.cms-verify.jsonc'))
  ? JSON.parse(readFileSync(resolve(root, 'wrangler.cms-verify.jsonc'), 'utf8'))
  : { vars: {} }

const slug = process.env.PUBLIC_CMS_SITE_SLUG || process.env.CMS_SITE_SLUG || siteMeta.siteSlug
/** Prefer cms-verify Worker URL over any local/dev SITE_URL in .env */
const siteUrl = (
  wrangler.vars?.SITE_URL ||
  (siteMeta.workerName ? `https://${siteMeta.workerName}.hostesspl.workers.dev` : '') ||
  process.env.SITE_URL ||
  ''
).replace(/\/$/, '')

const url =
  process.env.SUPABASE_URL ||
  process.env.PUBLIC_SUPABASE_URL ||
  process.env.WF_SUPABASE_URL_HOSTESSWEBS_TEST
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY_HOSTESSWEBS_TEST

if (!email?.includes('@') || !slug || !url || !key || !siteUrl) {
  console.error('Usage: node scripts/generate-cms-login-link.mjs email@x.com')
  console.error('Need email, cms.site.json / SITE_URL, and Supabase service role.')
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

const { data: member } = await admin
  .from('cms_site_members')
  .select('user_id')
  .eq('site_id', site.id)
  .limit(500)

const listed = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
if (listed.error) {
  console.error(listed.error.message)
  process.exit(1)
}
const user = listed.data.users.find((u) => u.email?.toLowerCase() === email)
if (!user) {
  console.error(`No auth user for ${email} — run cms:invite first`)
  process.exit(1)
}

const isMember = (member || []).some((m) => m.user_id === user.id)
if (!isMember) {
  console.error(`${email} is not a member of ${slug} — run cms:invite first`)
  process.exit(1)
}

const redirectTo = `${siteUrl}/edit/auth/callback`
const { data, error } = await admin.auth.admin.generateLink({
  type: 'magiclink',
  email,
  options: { redirectTo },
})

if (error || !data?.properties?.action_link) {
  console.error(error?.message || 'generateLink failed')
  process.exit(1)
}

let actionLink = data.properties.action_link
// Force redirect_to onto our Worker callback (Supabase may use Site URL otherwise)
try {
  const u = new URL(actionLink)
  u.searchParams.set('redirect_to', redirectTo)
  actionLink = u.toString()
} catch {
  // keep original
}

console.log(`OK ${email} on ${slug}`)
console.log(`Open this URL (same browser is fine; no email sent):`)
console.log(actionLink)

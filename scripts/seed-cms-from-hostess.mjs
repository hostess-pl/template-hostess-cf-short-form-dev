/**
 * Seed cms_sites + cms_content.document from src/content/hostess.json
 * Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, PUBLIC_CMS_SITE_SLUG (or cms.site.json)
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

if (!slug || !url || !key) {
  console.error('Need PUBLIC_CMS_SITE_SLUG, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const hostessPath = resolve(root, 'src/content/hostess.json')
if (!existsSync(hostessPath)) {
  console.error('Missing src/content/hostess.json')
  process.exit(1)
}
const document = JSON.parse(readFileSync(hostessPath, 'utf8'))
const name = document?.profile?.displayName
  ? `${document.profile.displayName} (${slug})`
  : slug

const admin = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const { data: site, error: siteError } = await admin
  .from('cms_sites')
  .upsert({ slug, name, plan: 'pro' }, { onConflict: 'slug' })
  .select('id, slug')
  .single()

if (siteError || !site) {
  console.error(siteError?.message || 'Failed to upsert site')
  process.exit(1)
}

const { error: contentError } = await admin.from('cms_content').upsert(
  {
    site_id: site.id,
    locale: '_',
    section: 'document',
    data: document,
    updated_at: new Date().toISOString(),
  },
  { onConflict: 'site_id,locale,section' },
)

if (contentError) {
  console.error(contentError.message)
  process.exit(1)
}

console.log(`OK seeded ${slug} → ${site.id}`)

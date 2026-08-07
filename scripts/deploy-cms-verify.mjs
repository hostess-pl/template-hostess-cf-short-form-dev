/**
 * Deploy CMS verify Worker without clobbering factory demo names.
 * Builds with Astro CF adapter, patches dist/server/wrangler.json, deploys.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const meta = JSON.parse(readFileSync(resolve(root, 'cms.site.json'), 'utf8'))
const workerName = meta.workerName
const siteSlug = meta.siteSlug
const sessionTitle = `${workerName}-session`

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return {}
  const out = {}
  for (const line of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i === -1) continue
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, '')
  }
  return out
}

function run(cmd, opts = {}) {
  console.log('>', cmd)
  const r = spawnSync(cmd, {
    shell: true,
    cwd: root,
    encoding: 'utf8',
    env: process.env,
    ...opts,
  })
  if ((r.status ?? 1) !== 0) {
    if (r.stderr) process.stderr.write(r.stderr)
    if (r.stdout) process.stdout.write(r.stdout)
    process.exit(r.status ?? 1)
  }
  return r
}

const fileEnv = {
  ...loadEnvFile(resolve(root, '../hostesswebs/.env')),
  ...loadEnvFile(resolve(root, '.env')),
}

const supabaseUrl =
  process.env.SUPABASE_URL ||
  fileEnv.SUPABASE_URL ||
  fileEnv.WF_SUPABASE_URL_HOSTESSWEBS_TEST ||
  ''
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  fileEnv.SUPABASE_SERVICE_ROLE_KEY ||
  fileEnv.SUPABASE_SERVICE_ROLE_KEY_HOSTESSWEBS_TEST ||
  ''

const verifyCfg = existsSync(resolve(root, 'wrangler.cms-verify.jsonc'))
  ? JSON.parse(readFileSync(resolve(root, 'wrangler.cms-verify.jsonc'), 'utf8'))
  : { vars: {} }

const siteUrl = verifyCfg.vars?.SITE_URL || `https://${workerName}.hostesspl.workers.dev`
const publicUrl = verifyCfg.vars?.PUBLIC_SUPABASE_URL || ''
const publicAnon = verifyCfg.vars?.PUBLIC_SUPABASE_ANON_KEY || ''

run('pnpm run build', { stdio: 'inherit' })

const list = run('pnpm exec wrangler kv namespace list')
const namespaces = JSON.parse(list.stdout || '[]')
let sessionId =
  verifyCfg.kv_namespaces?.find((n) => n.binding === 'SESSION')?.id ||
  namespaces.find((n) => n.title === sessionTitle)?.id ||
  ''

if (!sessionId) {
  console.log(`[deploy:cms-verify] Creating KV ${sessionTitle}`)
  const created = run(`pnpm exec wrangler kv namespace create ${JSON.stringify(sessionTitle)}`)
  const match = (created.stdout || '').match(/id\s*=\s*"([^"]+)"/i) || (created.stdout || '').match(/"id"\s*:\s*"([^"]+)"/)
  sessionId = match?.[1] || ''
  if (!sessionId) {
    const refreshed = JSON.parse(run('pnpm exec wrangler kv namespace list').stdout || '[]')
    sessionId = refreshed.find((n) => n.title === sessionTitle)?.id || ''
  }
}
if (!sessionId) {
  console.error(`[deploy:cms-verify] Could not resolve SESSION KV for ${sessionTitle}`)
  process.exit(1)
}

const generatedPath = resolve(root, 'dist/server/wrangler.json')
if (!existsSync(generatedPath)) {
  console.error('Missing dist/server/wrangler.json — Astro build failed?')
  process.exit(1)
}

const generated = JSON.parse(readFileSync(generatedPath, 'utf8'))
generated.name = workerName
generated.topLevelName = workerName
generated.vars = {
  ...(generated.vars || {}),
  SITE_URL: siteUrl,
  PUBLIC_CMS_SITE_SLUG: siteSlug,
  CMS_SITE_SLUG: siteSlug,
  CHECK_ORIGIN: 'true',
  SUPABASE_TRACKING_ENABLED: 'false',
  ANALYTICS_ENV: 'cms-verify',
  PUBLIC_CONSENT_ENABLED: 'false',
  PUBLIC_ANALYTICS_ENABLED: 'false',
  ...(publicUrl ? { PUBLIC_SUPABASE_URL: publicUrl } : {}),
  ...(publicAnon ? { PUBLIC_SUPABASE_ANON_KEY: publicAnon } : {}),
}
generated.kv_namespaces = [{ binding: 'SESSION', id: sessionId }]
if (generated.previews?.kv_namespaces) {
  generated.previews.kv_namespaces = [{ binding: 'SESSION', id: sessionId }]
}
writeFileSync(generatedPath, JSON.stringify(generated, null, 2))

run(`pnpm exec wrangler deploy -c dist/server/wrangler.json`, { stdio: 'inherit' })

if (supabaseUrl && serviceKey) {
  for (const [name, value] of [
    ['SUPABASE_URL', supabaseUrl],
    ['SUPABASE_SERVICE_ROLE_KEY', serviceKey],
  ]) {
    const r = spawnSync(`pnpm exec wrangler secret put ${name} --name ${workerName}`, {
      shell: true,
      cwd: root,
      input: value,
      stdio: ['pipe', 'inherit', 'inherit'],
      env: process.env,
    })
    if ((r.status ?? 1) !== 0) process.exit(r.status ?? 1)
  }
} else {
  console.warn('[deploy:cms-verify] Skipping secrets — SUPABASE_URL / SERVICE_ROLE_KEY missing')
}

console.log(`Deployed https://${workerName}.hostesspl.workers.dev (SITE_URL=${siteUrl})`)

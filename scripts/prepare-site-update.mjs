#!/usr/bin/env node
/**
 * Build-only preparation for an existing site update.
 * Reads the authoritative CMS document and reconstructs any legacy baked media
 * from the currently deployed site. It never writes to Supabase or Storage.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { basename, dirname, extname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const MAX_IMAGE_BYTES = 12 * 1024 * 1024
const MAX_VIDEO_BYTES = 55 * 1024 * 1024
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif'])
const VIDEO_EXTENSIONS = new Set(['.mp4', '.webm', '.m4v', '.mov'])

function required(name) {
  const value = String(process.env[name] || '').trim()
  if (!value) throw new Error(`${name}_required`)
  return value
}

function assertSiteUrl(value) {
  const url = new URL(value)
  if (url.protocol !== 'https:' || !url.hostname.endsWith('.hostesswebs.pl')) {
    throw new Error('SITE_URL_must_be_hostesswebs_https')
  }
  return url
}

async function supabaseGet(path, query) {
  const base = required('SUPABASE_URL').replace(/\/$/, '')
  const key = required('SUPABASE_SERVICE_ROLE_KEY')
  const url = new URL(`${base}/rest/v1/${path}`)
  for (const [name, value] of Object.entries(query)) url.searchParams.set(name, value)
  const response = await fetch(url, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json' },
  })
  if (!response.ok) throw new Error(`supabase_read_${path}_${response.status}`)
  return response.json()
}

function collectLegacyMedia(document) {
  const result = new Map()
  const add = (value, kind) => {
    const raw = String(value || '').trim()
    if (!raw || /^https?:\/\//i.test(raw) || raw.startsWith('/')) return
    const name = basename(raw)
    if (name !== raw || !name || name.startsWith('.')) throw new Error(`unsafe_media_reference:${raw}`)
    const ext = extname(name).toLowerCase()
    if (kind === 'video' ? !VIDEO_EXTENSIONS.has(ext) : !IMAGE_EXTENSIONS.has(ext)) {
      throw new Error(`unsupported_media_reference:${raw}`)
    }
    result.set(`${kind}:${name}`, { name, kind })
  }

  add(document?.assets?.hero, 'image')
  for (const event of Array.isArray(document?.events) ? document.events : []) {
    add(event?.imageFile, 'image')
    for (const image of Array.isArray(event?.imageFiles) ? event.imageFiles : []) add(image, 'image')
    add(event?.videoFile, 'video')
  }
  return [...result.values()]
}

async function restoreLegacyMedia(siteUrl, media) {
  for (const item of media) {
    const pathname = item.kind === 'video' ? `/videos/${encodeURIComponent(item.name)}` : `/cms-assets/${encodeURIComponent(item.name)}`
    const source = new URL(pathname, siteUrl)
    const response = await fetch(source, { redirect: 'error' })
    if (!response.ok) throw new Error(`legacy_media_unavailable:${item.name}:${response.status}`)
    const contentLength = Number(response.headers.get('content-length') || 0)
    const limit = item.kind === 'video' ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES
    if (contentLength > limit) throw new Error(`legacy_media_too_large:${item.name}`)
    const bytes = new Uint8Array(await response.arrayBuffer())
    if (!bytes.length || bytes.length > limit) throw new Error(`legacy_media_invalid_size:${item.name}`)
    const contentType = String(response.headers.get('content-type') || '').toLowerCase()
    if (item.kind === 'video' ? !contentType.startsWith('video/') : !contentType.startsWith('image/')) {
      throw new Error(`legacy_media_invalid_type:${item.name}`)
    }
    const destination = item.kind === 'video'
      ? resolve(root, 'public/videos', item.name)
      : resolve(root, 'src/assets/images', item.name)
    await mkdir(dirname(destination), { recursive: true })
    await writeFile(destination, bytes)
  }
}

async function main() {
  const slug = required('CMS_SITE_SLUG').toLowerCase()
  if (!/^[a-z0-9][a-z0-9-]{1,62}$/.test(slug)) throw new Error('invalid_CMS_SITE_SLUG')
  const siteUrl = assertSiteUrl(required('SITE_URL'))
  const sites = await supabaseGet('cms_sites', { select: 'id,slug', slug: `eq.${slug}`, limit: '1' })
  const site = Array.isArray(sites) ? sites[0] : null
  if (!site) throw new Error('cms_site_not_found')
  const rows = await supabaseGet('cms_content', {
    select: 'data,updated_at,updated_by',
    site_id: `eq.${site.id}`,
    locale: 'eq._',
    section: 'eq.document',
    limit: '1',
  })
  const row = Array.isArray(rows) ? rows[0] : null
  if (!row?.data || typeof row.data !== 'object') throw new Error('cms_document_not_found')

  await restoreLegacyMedia(siteUrl, collectLegacyMedia(row.data))
  await writeFile(resolve(root, 'src/content/hostess.json'), `${JSON.stringify(row.data, null, 2)}\n`, 'utf8')

  const currentCmsSite = JSON.parse(await readFile(resolve(root, 'cms.site.json'), 'utf8').catch(() => '{}'))
  await writeFile(
    resolve(root, 'cms.site.json'),
    `${JSON.stringify({ ...currentCmsSite, siteSlug: slug, workerName: required('WORKER_NAME') }, null, 2)}\n`,
    'utf8',
  )
  process.stdout.write(`${JSON.stringify({ ok: true, slug, legacyMediaRestored: collectLegacyMedia(row.data).length })}\n`)
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
  process.exit(1)
})

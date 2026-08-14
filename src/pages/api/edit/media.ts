import staticManifest from '@/generated/static-media-assets.json'
import type { APIRoute } from 'astro'
import { getSessionUser } from '@/lib/supabaseAuth'
import { jsonError, jsonOk, requireCmsProMember } from '@/lib/cms/access'
import { getPublicSupabaseUrl } from '@/lib/cms/env'
import { getCmsSupabaseAdmin } from '@/lib/cms/supabaseAdmin'
import { guessContentTypeFromPath, type MediaAsset } from '@/lib/cms/media'

export const prerender = false

const IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
])
const VIDEO_TYPES = new Set(['video/mp4', 'video/webm'])
const OTHER_TYPES = new Set(['application/pdf'])
const IMAGE_MAX = 10 * 1024 * 1024
const VIDEO_MAX = 50 * 1024 * 1024

/** Bake placeholders that should not appear in Assets unless the CMS document references them. */
const BAKE_PLACEHOLDER_RE = /^(event-\d+|hero)\.(jpe?g|png|webp|gif)$/i

function publicStorageUrl(path: string): string {
  const base = getPublicSupabaseUrl().replace(/\/$/, '')
  return `${base}/storage/v1/object/public/site-media/${path}`
}

function basenameOfRef(ref: string): string {
  const raw = String(ref || '').trim()
  if (!raw) return ''
  try {
    if (/^https?:\/\//i.test(raw)) {
      const u = new URL(raw)
      return decodeURIComponent(u.pathname.split('/').pop() || '')
    }
  } catch {
    // fall through
  }
  return raw.split('/').pop() || raw
}

function siteAssets(): MediaAsset[] {
  const items = (staticManifest as { items?: MediaAsset[] }).items ?? []
  return items.map((item) => ({ ...item, source: item.source ?? 'site' }))
}

async function loadReferencedBasenames(siteId: string): Promise<Set<string>> {
  const refs = new Set<string>()
  const admin = getCmsSupabaseAdmin()
  if (!admin) return refs
  const { data } = await admin
    .from('cms_content')
    .select('data')
    .eq('site_id', siteId)
    .eq('locale', '_')
    .eq('section', 'document')
    .maybeSingle()
  const doc = (data?.data && typeof data.data === 'object' ? data.data : {}) as Record<
    string,
    unknown
  >
  const assets = (doc.assets && typeof doc.assets === 'object' ? doc.assets : {}) as Record<
    string,
    unknown
  >
  const hero = basenameOfRef(String(assets.hero || ''))
  if (hero) refs.add(hero)
  for (const event of Array.isArray(doc.events) ? doc.events : []) {
    if (!event || typeof event !== 'object') continue
    const row = event as { imageFile?: string; imageFiles?: unknown; videoFile?: string }
    const imageFile = basenameOfRef(String(row.imageFile || ''))
    if (imageFile) refs.add(imageFile)
    if (Array.isArray(row.imageFiles)) {
      for (const extra of row.imageFiles) {
        const name = basenameOfRef(String(extra || ''))
        if (name) refs.add(name)
      }
    }
    const videoFile = basenameOfRef(String(row.videoFile || ''))
    if (videoFile) refs.add(videoFile)
  }
  return refs
}

function shouldIncludeSiteAsset(item: MediaAsset, referenced: Set<string>): boolean {
  const name = String(item.name || basenameOfRef(item.path || item.url || '')).trim()
  if (!name) return false
  // Always keep non-placeholder site files (favicon, custom uploads copied into public, etc.)
  if (!BAKE_PLACEHOLDER_RE.test(name)) return true
  // Hide unused bake event-N.jpg / hero.jpg ghosts
  return referenced.has(name)
}

/** Sanitize original upload basename for storage object keys. */
export function sanitizeUploadBasename(originalName: string): { base: string; ext: string } {
  const raw = String(originalName || 'upload').trim()
  const lastDot = raw.lastIndexOf('.')
  const extRaw = lastDot > 0 ? raw.slice(lastDot + 1) : 'bin'
  const stemRaw = lastDot > 0 ? raw.slice(0, lastDot) : raw
  const ext = extRaw.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12) || 'bin'
  let base = stemRaw
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[.-]+|[.-]+$/g, '')
    .slice(0, 80)
  if (!base) base = 'upload'
  return { base, ext }
}

export const GET: APIRoute = async ({ cookies, request }) => {
  const { supabase, user } = await getSessionUser(cookies, request.headers.get('cookie') ?? undefined)
  if (!supabase || !user) return jsonError(401, 'Sign in required')
  const member = await requireCmsProMember(supabase, user)
  if (member instanceof Response) return member

  const prefix = `${member.site.id}/`
  const { data, error } = await supabase.storage.from('site-media').list(member.site.id, {
    limit: 200,
    sortBy: { column: 'updated_at', order: 'desc' },
  })
  if (error) return jsonError(500, error.message)

  const uploaded: MediaAsset[] = (data ?? [])
    .filter((entry) => Boolean(entry.name) && !entry.name.endsWith('/'))
    .map((entry) => {
      const path = `${prefix}${entry.name}`
      const meta = entry.metadata as { mimetype?: string; size?: number } | null
      const contentType =
        meta?.mimetype || guessContentTypeFromPath(entry.name) || 'application/octet-stream'
      return {
        path,
        url: publicStorageUrl(path),
        contentType,
        size: typeof meta?.size === 'number' ? meta.size : 0,
        updatedAt: entry.updated_at ?? entry.created_at ?? null,
        name: entry.name,
        source: 'storage' as const,
      }
    })

  const referenced = await loadReferencedBasenames(member.site.id)
  const site = siteAssets().filter((item) => shouldIncludeSiteAsset(item, referenced))

  const byUrl = new Map<string, MediaAsset>()
  for (const item of [...uploaded, ...site]) {
    if (!byUrl.has(item.url)) byUrl.set(item.url, item)
  }
  return jsonOk({ items: [...byUrl.values()] })
}

export const POST: APIRoute = async ({ cookies, request }) => {
  const { supabase, user } = await getSessionUser(cookies, request.headers.get('cookie') ?? undefined)
  if (!supabase || !user) return jsonError(401, 'Sign in required')
  const member = await requireCmsProMember(supabase, user)
  if (member instanceof Response) return member

  const form = await request.formData()
  const file = form.get('file')
  if (!(file instanceof File)) return jsonError(400, 'Missing file')

  const type = file.type || guessContentTypeFromPath(file.name)
  const isImage = IMAGE_TYPES.has(type)
  const isVideo = VIDEO_TYPES.has(type)
  const isOther = OTHER_TYPES.has(type)
  if (!isImage && !isVideo && !isOther) return jsonError(400, 'Unsupported file type')

  const max = isVideo ? VIDEO_MAX : IMAGE_MAX
  if (file.size > max) {
    return jsonError(400, isVideo ? 'Video too large (max 50MB)' : 'File too large (max 10MB)')
  }

  const { base, ext } = sanitizeUploadBasename(file.name)
  let objectName = `${base}.${ext}`
  let path = `${member.site.id}/${objectName}`

  const buffer = new Uint8Array(await file.arrayBuffer())
  let { error } = await supabase.storage.from('site-media').upload(path, buffer, {
    contentType: type,
    upsert: false,
  })

  // Collision: keep original stem, append short suffix (not a random opaque name).
  if (error && /already exists|Duplicate|409/i.test(error.message)) {
    objectName = `${base}-${crypto.randomUUID().slice(0, 6)}.${ext}`
    path = `${member.site.id}/${objectName}`
    ;({ error } = await supabase.storage.from('site-media').upload(path, buffer, {
      contentType: type,
      upsert: false,
    }))
  }
  if (error) return jsonError(500, error.message)

  return jsonOk({
    url: publicStorageUrl(path),
    path,
    contentType: type,
    size: file.size,
    updatedAt: new Date().toISOString(),
    name: objectName,
    source: 'storage',
  })
}

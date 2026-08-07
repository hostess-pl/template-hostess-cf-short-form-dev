import staticManifest from '@/generated/static-media-assets.json'
import type { APIRoute } from 'astro'
import { getSessionUser } from '@/lib/supabaseAuth'
import { jsonError, jsonOk, requireCmsProMember } from '@/lib/cms/access'
import { getPublicSupabaseUrl } from '@/lib/cms/env'
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

function publicStorageUrl(path: string): string {
  const base = getPublicSupabaseUrl().replace(/\/$/, '')
  return `${base}/storage/v1/object/public/site-media/${path}`
}

function siteAssets(): MediaAsset[] {
  const items = (staticManifest as { items?: MediaAsset[] }).items ?? []
  return items.map((item) => ({ ...item, source: item.source ?? 'site' }))
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

  const byUrl = new Map<string, MediaAsset>()
  for (const item of [...uploaded, ...siteAssets()]) {
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

  const ext = file.name.split('.').pop()?.toLowerCase() || 'bin'
  const safeExt = ext.replace(/[^a-z0-9]/g, '') || 'bin'
  const path = `${member.site.id}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${safeExt}`

  const buffer = new Uint8Array(await file.arrayBuffer())
  const { error } = await supabase.storage.from('site-media').upload(path, buffer, {
    contentType: type,
    upsert: false,
  })
  if (error) return jsonError(500, error.message)

  return jsonOk({
    url: publicStorageUrl(path),
    path,
    contentType: type,
    size: file.size,
    updatedAt: new Date().toISOString(),
    name: path.split('/').pop() || file.name,
    source: 'storage',
  })
}

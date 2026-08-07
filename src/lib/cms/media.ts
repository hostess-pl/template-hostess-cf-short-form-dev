export type MediaAsset = {
  path: string
  url: string
  contentType: string
  size: number
  updatedAt: string | null
  name: string
  source?: 'site' | 'storage'
}

export function isImageContentType(type: string): boolean {
  return type.startsWith('image/')
}

export function isVideoContentType(type: string): boolean {
  return type.startsWith('video/')
}

export function guessContentTypeFromPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() ?? ''
  const map: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    mp4: 'video/mp4',
    webm: 'video/webm',
    pdf: 'application/pdf',
  }
  return map[ext] ?? 'application/octet-stream'
}

export function isMediaFieldKey(key: string): boolean {
  const k = key.toLowerCase()
  return (
    k === 'image' ||
    k === 'imageen' ||
    k.includes('image') ||
    k.includes('video') ||
    k.includes('poster') ||
    k.includes('thumbnail') ||
    k.endsWith('src') ||
    (k.endsWith('url') && (k.includes('media') || k.includes('asset') || k.includes('photo')))
  )
}

export function looksLikeMediaUrl(value: string): boolean {
  if (!value) return false
  const lower = value.toLowerCase()
  if (lower.includes('/storage/v1/object/public/site-media/')) return true
  return /\.(jpe?g|png|webp|gif|svg|mp4|webm)(\?|$)/i.test(lower)
}

export function isVideoUrl(value: string): boolean {
  return /\.(mp4|webm)(\?|$)/i.test(value) || value.includes('video/')
}

export async function fetchMediaAssets(): Promise<MediaAsset[]> {
  const res = await fetch('/api/edit/media')
  const json = (await res.json()) as { items?: MediaAsset[]; error?: string }
  if (!res.ok) throw new Error(json.error || 'Could not load assets')
  return json.items ?? []
}

export async function uploadMediaAsset(file: File): Promise<MediaAsset> {
  const form = new FormData()
  form.set('file', file)
  const res = await fetch('/api/edit/media', { method: 'POST', body: form })
  const json = (await res.json()) as MediaAsset & { error?: string }
  if (!res.ok || !json.url) throw new Error(json.error || 'Upload failed')
  return {
    path: json.path,
    url: json.url,
    contentType: json.contentType || file.type,
    size: json.size ?? file.size,
    updatedAt: json.updatedAt ?? new Date().toISOString(),
    name: json.name || file.name,
    source: json.source ?? 'storage',
  }
}

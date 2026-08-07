/**
 * Resolve hostess imageFile / videoFile values to previewable public URLs.
 */
export function resolveMediaPreviewUrl(value: string, kind: 'image' | 'video' | 'auto' = 'auto'): string {
  const raw = String(value || '').trim()
  if (!raw) return ''
  if (/^https?:\/\//i.test(raw) || raw.startsWith('/')) return raw

  const lower = raw.toLowerCase()
  const isVideo =
    kind === 'video' ||
    (kind === 'auto' && /\.(mp4|webm|m4v|mov)$/i.test(lower)) ||
    lower.includes('video')

  if (isVideo) {
    if (raw.startsWith('videos/')) return `/${raw}`
    return `/videos/${raw.replace(/^\/+/, '')}`
  }

  // Static images are copied to public/cms-assets at build time.
  return `/cms-assets/${raw.replace(/^\/+/, '')}`
}

export function filenameFromMediaUrl(url: string): string {
  const raw = String(url || '').trim()
  if (!raw) return ''
  try {
    const path = raw.startsWith('http') ? new URL(raw).pathname : raw
    const name = path.split('/').pop() || ''
    return name.split('?')[0] || name
  } catch {
    return raw.split('/').pop() || raw
  }
}

/** Prefer storing site filenames when picking from /cms-assets or /videos. */
export function normalizePickedMediaValue(url: string, field: 'imageFile' | 'videoFile' | string): string {
  const raw = String(url || '').trim()
  if (!raw) return ''
  if (field === 'imageFile' || field.toLowerCase().includes('image')) {
    if (raw.includes('/cms-assets/')) return filenameFromMediaUrl(raw)
    if (raw.startsWith('/assets/') || raw.startsWith('/_astro/')) return filenameFromMediaUrl(raw)
  }
  if (field === 'videoFile' || field.toLowerCase().includes('video')) {
    if (raw.includes('/videos/')) return filenameFromMediaUrl(raw)
  }
  return raw
}

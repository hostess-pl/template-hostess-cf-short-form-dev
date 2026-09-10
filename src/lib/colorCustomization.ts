export function normalizeHexColor(value: unknown): string | null {
  const raw = String(value || '').trim()
  if (!/^#[0-9a-f]{6}$/i.test(raw)) return null
  return raw.toUpperCase()
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255)
  const linear = channels.map((channel) =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  )
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]
}

export function colorContrast(foreground: unknown, background: unknown): number | null {
  const fg = normalizeHexColor(foreground)
  const bg = normalizeHexColor(background)
  if (!fg || !bg) return null
  const high = Math.max(luminance(fg), luminance(bg))
  const low = Math.min(luminance(fg), luminance(bg))
  return (high + 0.05) / (low + 0.05)
}

export function isReadableColor(foreground: unknown, background: unknown): boolean {
  return (colorContrast(foreground, background) || 0) >= 4.5
}

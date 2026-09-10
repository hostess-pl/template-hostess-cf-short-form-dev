export type PortfolioPaletteId = 'default' | 'rose' | 'sage' | 'blue' | 'gold'

export type PortfolioPalette = {
  id: PortfolioPaletteId
  labelPl: string
  labelEn: string
  light: string
  dark: string
}

export const PORTFOLIO_PALETTES: readonly PortfolioPalette[] = [
  { id: 'default', labelPl: 'Oryginalny', labelEn: 'Original', light: '#C4937E', dark: '#C9A84C' },
  { id: 'rose', labelPl: 'Różany', labelEn: 'Rose', light: '#985466', dark: '#F19AAA' },
  { id: 'sage', labelPl: 'Szałwiowy', labelEn: 'Sage', light: '#52705F', dark: '#9BC9AE' },
  { id: 'blue', labelPl: 'Niebieski', labelEn: 'Blue', light: '#42678F', dark: '#91BCE8' },
  { id: 'gold', labelPl: 'Złoty', labelEn: 'Gold', light: '#80621D', dark: '#E1C66C' },
] as const

export function normalizePortfolioPalette(value: unknown): PortfolioPaletteId {
  const raw = String(value || '').trim().toLowerCase()
  return PORTFOLIO_PALETTES.some((palette) => palette.id === raw)
    ? (raw as PortfolioPaletteId)
    : 'default'
}

export function isDarkPortfolioTemplate(templateKey: unknown): boolean {
  return templateKey === 'elegant' || templateKey === 'luxury'
}

export function portfolioPaletteAccent(
  paletteId: unknown,
  templateKey: unknown,
): string | null {
  const normalized = normalizePortfolioPalette(paletteId)
  if (normalized === 'default') return null
  const palette = PORTFOLIO_PALETTES.find((item) => item.id === normalized)
  if (!palette) return null
  return isDarkPortfolioTemplate(templateKey) ? palette.dark : palette.light
}

export function portfolioPaletteCss(paletteId: unknown, templateKey: unknown): string | undefined {
  const accent = portfolioPaletteAccent(paletteId, templateKey)
  if (!accent) return undefined
  const dark = isDarkPortfolioTemplate(templateKey)
  const mixTarget = dark ? 'white' : 'black'
  return [
    `--accent: ${accent}`,
    `--accent-hover: color-mix(in srgb, ${accent} 82%, ${mixTarget})`,
    `--hero-wash: ${accent}`,
    `--ring: ${accent}`,
    `--border: color-mix(in srgb, ${accent} 20%, var(--background))`,
    `--border-strong: color-mix(in srgb, ${accent} 42%, var(--foreground) 8%)`,
  ].join('; ')
}

import { useMemo, useState } from 'react'
import type { CmsChromeLocale } from '@/lib/cms/i18n'
import { colorContrast, isReadableColor, normalizeHexColor } from '@/lib/colorCustomization'
import {
  PORTFOLIO_PALETTES,
  isDarkPortfolioTemplate,
  normalizePortfolioPalette,
  portfolioPaletteAccent,
} from '@/lib/portfolioPalette'

type Props = {
  document: Record<string, unknown>
  locale: CmsChromeLocale
  onChange: (next: Record<string, unknown>) => void
}
type TextRole = 'heading' | 'body' | 'muted'

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function firstText(record: Record<string, unknown>, keys: string[], fallback: string): string {
  for (const key of keys) {
    const value = String(record[key] || '').trim()
    if (value) return value
  }
  return fallback
}

export function StyleEditor({ document, locale, onChange }: Props) {
  const isEn = locale === 'en'
  const branding = asRecord(document.branding)
  const templateKey = branding.templateKey || document.templateKey || ''
  const selected = normalizePortfolioPalette(branding.palette)
  const dark = isDarkPortfolioTemplate(templateKey)
  const [role, setRole] = useState<TextRole>('heading')
  const [colorError, setColorError] = useState('')
  const localeCopy = asRecord(asRecord(document.copyByLocale)[locale])
  const copy = Object.keys(localeCopy).length ? localeCopy : asRecord(document.copy)
  const defaults = dark
    ? { background: '#160608', heading: '#F5F0EB', body: '#F5F0EB', muted: '#C9BDB5' }
    : { background: '#F4EFE6', heading: '#1A1A1A', body: '#1A1A1A', muted: '#4A4540' }
  const background = normalizeHexColor(branding.customBackgroundColor) || defaults.background
  const roles = useMemo(() => ({
    heading: {
      label: isEn ? 'Headings' : 'Nagłówki',
      field: 'headingColor',
      value: normalizeHexColor(branding.headingColor) || defaults.heading,
      sample: firstText(copy, ['headline', 'aboutTitle', 'galleryTitle'], isEn ? 'Your portfolio headline' : 'Twój nagłówek portfolio'),
    },
    body: {
      label: isEn ? 'Main text' : 'Tekst główny',
      field: 'bodyColor',
      value: normalizeHexColor(branding.bodyColor) || defaults.body,
      sample: firstText(copy, ['aboutLead', 'experienceSummary', 'profile'], isEn ? 'A few sentences about your experience and strengths.' : 'Kilka zdań o Twoim doświadczeniu i mocnych stronach.'),
    },
    muted: {
      label: isEn ? 'Supporting text' : 'Tekst pomocniczy',
      field: 'mutedColor',
      value: normalizeHexColor(branding.mutedColor) || defaults.muted,
      sample: firstText(copy, ['aboutLabel', 'galleryLabel', 'contactLabel'], isEn ? 'About me · Experience · Contact' : 'O mnie · Doświadczenie · Kontakt'),
    },
  }), [branding.bodyColor, branding.headingColor, branding.mutedColor, copy, defaults.body, defaults.heading, defaults.muted, isEn])
  const selectedRole = roles[role]

  const updateBranding = (patch: Record<string, unknown>) => {
    onChange({ ...document, branding: { ...branding, ...patch } })
  }

  const setAccessibleTextColor = (raw: string) => {
    const normalized = normalizeHexColor(raw)
    if (!normalized) {
      setColorError(isEn ? 'Enter a full hex color, for example #1A1A1A.' : 'Wpisz pełny kolor HEX, np. #1A1A1A.')
      return
    }
    if (!isReadableColor(normalized, background)) {
      setColorError(isEn ? 'Choose a color with stronger contrast against the background.' : 'Wybierz kolor o większym kontraście względem tła.')
      return
    }
    setColorError('')
    updateBranding({ [selectedRole.field]: normalized })
  }

  const setAccessibleBackground = (raw: string) => {
    const normalized = normalizeHexColor(raw)
    if (!normalized) return
    if (Object.values(roles).some((item) => !isReadableColor(item.value, normalized))) {
      setColorError(isEn ? 'This background would make at least one text style hard to read.' : 'To tło zmniejszyłoby czytelność co najmniej jednego rodzaju tekstu.')
      return
    }
    setColorError('')
    updateBranding({ customBackgroundColor: normalized })
  }

  const ratio = colorContrast(selectedRole.value, background)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-[var(--cms-ink)]">{isEn ? 'Website style' : 'Styl strony'}</h2>
          <span className="cms-beta-badge">Beta</span>
        </div>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--cms-muted)]">{isEn ? 'Adjust colors without changing your content or the structure of the portfolio.' : 'Dopasuj kolory bez zmieniania treści ani układu portfolio.'}</p>
      </div>

      <section className="cms-style-section" aria-labelledby="accent-heading">
        <h3 id="accent-heading" className="cms-style-section__title">{isEn ? 'Accent color' : 'Kolor akcentu'}</h3>
        <p className="cms-style-section__hint">{isEn ? 'Used for buttons, links and decorative details.' : 'Używany w przyciskach, linkach i detalach dekoracyjnych.'}</p>
        <div className="cms-style-grid" role="radiogroup" aria-label={isEn ? 'Accent palette' : 'Kolorystyka strony'}>
          {PORTFOLIO_PALETTES.map((palette) => {
            const active = selected === palette.id
            const swatch = palette.id === 'default' ? (dark ? palette.dark : palette.light) : portfolioPaletteAccent(palette.id, templateKey) || palette.light
            return (
              <button key={palette.id} type="button" role="radio" aria-checked={active} data-active={active} className="cms-style-option" onClick={() => updateBranding({ palette: palette.id === 'default' ? '' : palette.id, ...(palette.id === 'default' ? {} : { themeColor: swatch }) })}>
                <span className="cms-style-option__swatch" style={{ backgroundColor: swatch }} aria-hidden="true" />
                <span className="cms-style-option__label">{isEn ? palette.labelEn : palette.labelPl}</span>
                <span className="cms-style-option__check" aria-hidden="true">{active ? <svg viewBox="0 0 24 24" fill="none"><path d="m5 12 4 4L19 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg> : null}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="cms-style-section" aria-labelledby="background-heading">
        <h3 id="background-heading" className="cms-style-section__title">{isEn ? 'Background' : 'Tło'}</h3>
        <label className="cms-color-control">
          <span>{isEn ? 'Portfolio background' : 'Tło portfolio'}</span>
          <span className="cms-color-control__inputs">
            <input type="color" value={background} onChange={(event) => setAccessibleBackground(event.target.value)} aria-label={isEn ? 'Choose background color' : 'Wybierz kolor tła'} />
            <input key={background} className="cms-input cms-color-control__hex" defaultValue={background} onBlur={(event) => setAccessibleBackground(event.target.value)} aria-label={isEn ? 'Background hex color' : 'Kolor HEX tła'} spellCheck={false} />
          </span>
        </label>
      </section>

      <section className="cms-style-section" aria-labelledby="text-heading">
        <h3 id="text-heading" className="cms-style-section__title">{isEn ? 'Text colors' : 'Kolory tekstu'}</h3>
        <label className="cms-label" htmlFor="text-role">{isEn ? 'Text style' : 'Rodzaj tekstu'}</label>
        <select id="text-role" className="cms-input" value={role} onChange={(event) => { setRole(event.target.value as TextRole); setColorError('') }}>
          {Object.entries(roles).map(([id, item]) => <option key={id} value={id}>{item.label}</option>)}
        </select>
        <label className="cms-color-control mt-4">
          <span>{isEn ? 'Color' : 'Kolor'}</span>
          <span className="cms-color-control__inputs">
            <input type="color" value={selectedRole.value} onChange={(event) => setAccessibleTextColor(event.target.value)} aria-label={`${selectedRole.label} — ${isEn ? 'choose color' : 'wybierz kolor'}`} />
            <input key={`${role}-${selectedRole.value}`} className="cms-input cms-color-control__hex" defaultValue={selectedRole.value} onBlur={(event) => setAccessibleTextColor(event.target.value)} aria-label={`${selectedRole.label} — HEX`} spellCheck={false} />
          </span>
        </label>
        <div className="cms-text-preview" style={{ backgroundColor: background, color: selectedRole.value }} data-role={role}>
          <span className="cms-text-preview__eyebrow">{isEn ? 'Preview' : 'Podgląd'}</span>
          <p>{selectedRole.sample}</p>
        </div>
        <p className="cms-style-contrast" aria-live="polite">{colorError || `${isEn ? 'Contrast' : 'Kontrast'}: ${ratio?.toFixed(1) || '—'}:1 · WCAG AA`}</p>
      </section>

      <p className="cms-style-note">{isEn ? 'Save your changes, then use “View site” to see them on your portfolio.' : 'Zapisz zmiany, a następnie kliknij „Zobacz stronę”, aby sprawdzić je w portfolio.'}</p>
    </div>
  )
}

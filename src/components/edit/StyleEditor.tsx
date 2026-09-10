import type { CmsChromeLocale } from '@/lib/cms/i18n'
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

export function StyleEditor({ document, locale, onChange }: Props) {
  const isEn = locale === 'en'
  const branding =
    document.branding && typeof document.branding === 'object'
      ? (document.branding as Record<string, unknown>)
      : {}
  const templateKey = branding.templateKey || document.templateKey || ''
  const selected = normalizePortfolioPalette(branding.palette)
  const dark = isDarkPortfolioTemplate(templateKey)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-[var(--cms-ink)]">
            {isEn ? 'Website style' : 'Styl strony'}
          </h2>
          <span className="cms-beta-badge">Beta</span>
        </div>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--cms-muted)]">
          {isEn
            ? 'Choose an accent palette for buttons, links and decorative details. Your content and page layout stay exactly the same.'
            : 'Wybierz kolorystykę przycisków, linków i dekoracyjnych detali. Treść oraz układ strony pozostaną bez zmian.'}
        </p>
      </div>

      <div className="cms-style-grid" role="radiogroup" aria-label={isEn ? 'Accent palette' : 'Kolorystyka strony'}>
        {PORTFOLIO_PALETTES.map((palette) => {
          const active = selected === palette.id
          const swatch =
            palette.id === 'default'
              ? dark ? palette.dark : palette.light
              : portfolioPaletteAccent(palette.id, templateKey) || palette.light
          return (
            <button
              key={palette.id}
              type="button"
              role="radio"
              aria-checked={active}
              data-active={active}
              className="cms-style-option"
              onClick={() =>
                onChange({
                  ...document,
                  branding: {
                    ...branding,
                    palette: palette.id === 'default' ? '' : palette.id,
                    ...(palette.id === 'default' ? {} : { themeColor: swatch }),
                  },
                })
              }
            >
              <span className="cms-style-option__swatch" style={{ backgroundColor: swatch }} aria-hidden="true" />
              <span className="cms-style-option__label">
                {isEn ? palette.labelEn : palette.labelPl}
              </span>
              <span className="cms-style-option__check" aria-hidden="true">
                {active ? (
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="m5 12 4 4L19 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : null}
              </span>
            </button>
          )
        })}
      </div>

      <p className="cms-style-note">
        {isEn
          ? 'Save your changes, then use “View site” to see the palette on your portfolio.'
          : 'Zapisz zmiany, a następnie kliknij „Zobacz stronę”, aby sprawdzić kolorystykę portfolio.'}
      </p>
    </div>
  )
}

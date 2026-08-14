import type { ContentLocale } from '@/lib/cms/i18n'
import { availableContentLocales, seedCopyLocaleIfMissing } from '@/lib/cms/i18n'

type Props = {
  document: Record<string, unknown>
  onChange: (next: Record<string, unknown>) => void
  chromeLocale: 'pl' | 'en'
}

/**
 * Enable EN / ES content locales — updates locales[] + extras.*Version.
 */
export function LocalesToggle({ document, onChange, chromeLocale }: Props) {
  const isEn = chromeLocale === 'en'
  const enabled = new Set(availableContentLocales(document))
  const enOn = enabled.has('en')
  const esOn = enabled.has('es')

  function apply(nextEn: boolean, nextEs: boolean) {
    const locales: ContentLocale[] = ['pl']
    if (nextEn) locales.push('en')
    if (nextEs) locales.push('es')
    const extras = {
      ...((document.extras && typeof document.extras === 'object' ? document.extras : {}) as Record<
        string,
        unknown
      >),
      englishVersion: nextEn,
      spanishVersion: nextEs,
    }
    let next: Record<string, unknown> = { ...document, locales, extras }
    if (nextEn) next = seedCopyLocaleIfMissing(next, 'en')
    if (nextEs) next = seedCopyLocaleIfMissing(next, 'es')
    onChange(next)
  }

  return (
    <section className="cms-card space-y-3 p-4">
      <div>
        <h3 className="text-sm font-semibold text-[var(--cms-ink)]">
          {isEn ? 'Translations' : 'Tłumaczenia'}
        </h3>
        <p className="mt-1 text-xs text-[var(--cms-muted)]">
          {isEn
            ? 'Turn on English / Spanish to show the language switcher and edit copy per language.'
            : 'Włącz angielski / hiszpański, aby pokazać przełącznik języka i edytować teksty osobno.'}
        </p>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={enOn}
          onChange={(e) => apply(e.target.checked, esOn)}
        />
        {isEn ? 'English (EN)' : 'Angielski (EN)'}
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={esOn}
          onChange={(e) => apply(enOn, e.target.checked)}
        />
        {isEn ? 'Spanish (ES)' : 'Hiszpański (ES)'}
      </label>
      <p className="text-[11px] text-[var(--cms-muted)]">
        {isEn
          ? 'Polish stays the default. Event photos stay shared. Titles and descriptions are per language.'
          : 'Polski pozostaje domyślny. Zdjęcia wydarzeń są wspólne. Tytuły i opisy edytujesz osobno dla każdego języka.'}
      </p>
    </section>
  )
}

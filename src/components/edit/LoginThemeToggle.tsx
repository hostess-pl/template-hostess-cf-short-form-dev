import { useCmsTheme, type CmsTheme } from '@/lib/cms/theme'
import type { CmsChromeStrings } from '@/lib/cms/i18n'
import { chromeStrings, readStoredChromeLocale } from '@/lib/cms/i18n'
import { useEffect, useMemo, useState } from 'react'
import '@/styles/edit-cms.css'

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M12 2v2.5M12 19.5V22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M2 12h2.5M19.5 12H22M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5 7 7 0 1 0 20.5 14.5Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  )
}

type ThemeButtonProps = {
  theme: CmsTheme
  onToggle: () => void
  t: CmsChromeStrings
  className?: string
}

function ThemeToggleButton({
  theme,
  onToggle,
  t,
  className = 'cms-btn cms-btn-ghost',
}: ThemeButtonProps) {
  return (
    <button
      type="button"
      className={className}
      onClick={onToggle}
      aria-label={theme === 'light' ? t.themeToDark : t.themeToLight}
      title={theme === 'light' ? t.themeDark : t.themeLight}
    >
      {theme === 'light' ? <MoonIcon /> : <SunIcon />}
    </button>
  )
}

/** Theme control that works even when LoginForm is gated by missing config. */
export function LoginThemeToggle() {
  const { theme, toggleTheme } = useCmsTheme()
  const [locale, setLocale] = useState(readStoredChromeLocale)
  useEffect(() => {
    setLocale(readStoredChromeLocale())
  }, [])
  const t = useMemo(() => chromeStrings(locale), [locale])
  return <ThemeToggleButton theme={theme} onToggle={toggleTheme} t={t} />
}

export function ThemeIconButton({
  theme,
  onToggle,
  t,
  className = 'cms-btn cms-btn-ghost',
}: ThemeButtonProps) {
  return <ThemeToggleButton theme={theme} onToggle={onToggle} t={t} className={className} />
}

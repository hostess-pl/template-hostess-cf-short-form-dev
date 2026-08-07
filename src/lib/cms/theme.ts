import { useEffect, useState } from 'react'

export type CmsTheme = 'light' | 'dark'

const STORAGE_KEY = 'hw-cms-theme'

export function readStoredCmsTheme(): CmsTheme {
  if (typeof window === 'undefined') return 'light'
  const raw = window.localStorage.getItem(STORAGE_KEY)
  return raw === 'dark' ? 'dark' : 'light'
}

export function applyCmsThemeToDom(theme: CmsTheme) {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.cmsTheme = theme
  document.body.dataset.cmsTheme = theme
  if (!document.body.classList.contains('cms-root')) {
    document.body.classList.add('cms-root')
  }
}

export function useCmsTheme() {
  const [theme, setThemeState] = useState<CmsTheme>(() =>
    typeof window === 'undefined' ? 'light' : readStoredCmsTheme(),
  )

  useEffect(() => {
    const stored = readStoredCmsTheme()
    setThemeState(stored)
    applyCmsThemeToDom(stored)
  }, [])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, theme)
    applyCmsThemeToDom(theme)
  }, [theme])

  function setTheme(next: CmsTheme) {
    setThemeState(next)
  }

  function toggleTheme() {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  return { theme, setTheme, toggleTheme }
}

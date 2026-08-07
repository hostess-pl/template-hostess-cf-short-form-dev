import { useEffect, useMemo, useState } from 'react'
import {
  chromeStrings,
  readStoredChromeLocale,
  storeChromeLocale,
  type CmsChromeLocale,
} from '@/lib/cms/i18n'
import { CMS_MARK_SRC, CMS_PRODUCT_NAME } from '@/cms/brand'
import '@/styles/edit-cms.css'

/** Non-Pro upgrade notice with panel language toggle. */
export function ProOnlyGate() {
  const [chromeLocale, setChromeLocale] = useState<CmsChromeLocale>('pl')
  const t = useMemo(() => chromeStrings(chromeLocale), [chromeLocale])

  useEffect(() => {
    setChromeLocale(readStoredChromeLocale())
  }, [])

  return (
    <div className="cms-login">
      <div className="cms-login__toolbar flex justify-end">
        <label className="flex items-center gap-1 text-xs text-[var(--cms-muted)]">
          {t.chromeLang}
          <select
            className="cms-input !w-auto !py-1"
            value={chromeLocale}
            onChange={(e) => {
              const next = e.target.value === 'en' ? 'en' : 'pl'
              setChromeLocale(next)
              storeChromeLocale(next)
            }}
          >
            <option value="pl">PL</option>
            <option value="en">EN</option>
          </select>
        </label>
      </div>
      <div className="cms-login__brand">
        <img src={CMS_MARK_SRC} alt={CMS_PRODUCT_NAME} width="56" height="56" />
        <p className="cms-brand">{CMS_PRODUCT_NAME}</p>
        <h1 className="cms-login__title">{t.proOnlyTitle}</h1>
        <p className="cms-login__lede">{t.proOnlyBody}</p>
        <p className="cms-login__lede" style={{ marginTop: '1rem' }}>
          <a href="/" className="cms-btn cms-btn-ghost">
            {t.viewSite}
          </a>
          <a href="/api/edit/auth/signout" className="cms-btn cms-btn-ghost">
            {t.signOut}
          </a>
        </p>
      </div>
    </div>
  )
}

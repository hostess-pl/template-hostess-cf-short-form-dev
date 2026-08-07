import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnalyticsDashboard } from '@/components/edit/AnalyticsDashboard'
import { AssetsLibrary } from '@/components/edit/AssetsLibrary'
import { EditDashboard } from '@/components/edit/EditDashboard'
import { SectionEditor } from '@/components/edit/SectionEditor'
import { SetPasswordGate } from '@/components/edit/SetPasswordGate'
import { ThemeIconButton } from '@/components/edit/LoginThemeToggle'
import { PublishConfirmModal } from '@/components/edit/PublishConfirmModal'
import { LocalesToggle } from '@/components/edit/LocalesToggle'
import { getCmsNav } from '@/cms/adapter'
import {
  availableContentLocales,
  chromeStrings,
  readStoredChromeLocale,
  readStoredContentLocale,
  storeChromeLocale,
  storeContentLocale,
  type CmsChromeLocale,
  type ContentLocale,
} from '@/lib/cms/i18n'
import { useCmsTheme } from '@/lib/cms/theme'
import { navGroupLabels, type CmsNavGroup, type CmsSectionId } from '@/lib/cms/nav'
import { CMS_MARK_SRC, CMS_PRODUCT_NAME, CMS_TEMPLATE_LABEL } from '@/cms/brand'
import '@/styles/edit-cms.css'

type Props = {
  email: string
  plan: 'free' | 'pro'
  needsPasswordSetup: boolean
  forcePasswordSetup?: boolean
  supabaseUrl: string
  supabaseAnonKey: string
  initialSection?: string
}

const CONTENT_SECTIONS = new Set<CmsSectionId>([
  'hero',
  'about',
  'experience',
  'gallery',
  'contact',
  'profile',
])

function MenuIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M6 6l12 12M18 6L6 18"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    )
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function EditApp({
  email,
  plan,
  needsPasswordSetup,
  forcePasswordSetup = false,
  supabaseUrl,
  supabaseAnonKey,
  initialSection = 'dashboard',
}: Props) {
  const { theme, toggleTheme } = useCmsTheme()
  const [chromeLocale, setChromeLocale] = useState<CmsChromeLocale>('pl')
  const [contentLocale, setContentLocale] = useState<ContentLocale>('pl')
  const t = useMemo(() => chromeStrings(chromeLocale), [chromeLocale])
  const includeAnalytics = plan === 'pro'
  const nav = useMemo(() => getCmsNav(chromeLocale, { includeAnalytics }), [chromeLocale, includeAnalytics])
  const groups = (['home', 'insights', 'media', 'content', 'account'] as CmsNavGroup[]).filter((g) =>
    nav.some((item) => item.group === g),
  )
  const groupLabels = navGroupLabels(t)

  const [section, setSection] = useState<CmsSectionId>(
    nav.some((n) => n.id === initialSection) ? (initialSection as CmsSectionId) : 'dashboard',
  )
  const [document, setDocument] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [dirty, setDirty] = useState(false)
  const [passwordGateOpen, setPasswordGateOpen] = useState(needsPasswordSetup || forcePasswordSetup)
  const [navOpen, setNavOpen] = useState(false)
  const [publishOpen, setPublishOpen] = useState(false)

  useEffect(() => {
    const chrome = readStoredChromeLocale()
    setChromeLocale(chrome)
  }, [])

  useEffect(() => {
    if (!document) return
    const available = availableContentLocales(document)
    setContentLocale(readStoredContentLocale(available))
  }, [document])

  useEffect(() => {
    if (!navOpen) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setNavOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navOpen])

  useEffect(() => {
    if (!navOpen) return
    const prev = window.document.body.style.overflow
    window.document.body.style.overflow = 'hidden'
    return () => {
      window.document.body.style.overflow = prev
    }
  }, [navOpen])

  const title = useMemo(
    () => nav.find((item) => item.id === section)?.label ?? section,
    [nav, section],
  )

  const showSaveBar = CONTENT_SECTIONS.has(section) || section === 'account'

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/edit/document')
      const json = (await res.json()) as { data?: Record<string, unknown>; error?: string }
      if (!res.ok) throw new Error(json.error || t.loadFailed)
      setDocument(json.data ?? {})
      setDirty(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : t.loadFailed)
      setDocument(null)
    } finally {
      setLoading(false)
    }
  }, [t.loadFailed])

  useEffect(() => {
    void load()
  }, [load])

  function navigate(next: string) {
    if (dirty && !confirm(t.discard)) return
    setSection(next as CmsSectionId)
    setOk('')
    setNavOpen(false)
  }

  async function save() {
    if (!document) return
    setSaving(true)
    setError('')
    setOk('')
    try {
      const res = await fetch('/api/edit/document', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ data: document }),
      })
      const json = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(json.error || t.saveFailed)
      setOk(t.saved)
      setDirty(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : t.saveFailed)
    } finally {
      setSaving(false)
    }
  }

  const contentLocales = availableContentLocales(document)

  function onContentLocaleChange(next: ContentLocale) {
    setContentLocale(next)
    storeContentLocale(next)
  }

  return (
    <div className="cms-root cms-shell" data-cms-theme={theme}>
      {passwordGateOpen ? (
        <SetPasswordGate
          supabaseUrl={supabaseUrl}
          supabaseAnonKey={supabaseAnonKey}
          t={t}
          onDone={() => setPasswordGateOpen(false)}
        />
      ) : null}

      <button
        type="button"
        className="cms-sidebar-backdrop"
        data-open={navOpen}
        aria-label={t.menuClose}
        onClick={() => setNavOpen(false)}
      />

      <aside id="cms-sidebar" className="cms-sidebar" data-open={navOpen}>
        <div className="border-b border-[var(--cms-line)] px-4 py-5">
          <div className="flex items-center gap-2.5">
            <img src={CMS_MARK_SRC} alt="" className="h-8 w-8 shrink-0" width="32" height="32" />
            <div className="min-w-0">
              <p className="cms-brand text-lg leading-tight">{CMS_PRODUCT_NAME}</p>
              <p className="mt-0.5 truncate text-xs text-[var(--cms-muted)]">
                {CMS_TEMPLATE_LABEL} · {t.editorBadge}
              </p>
            </div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 py-3 text-sm" aria-label={t.editorBadge}>
          {groups.map((group) => (
            <div key={group} className="mb-4">
              <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--cms-muted)]">
                {groupLabels[group]}
              </p>
              {nav
                .filter((item) => item.group === group)
                .map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    data-active={section === item.id}
                    className="cms-nav-item mb-0.5"
                    onClick={() => navigate(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
            </div>
          ))}
        </nav>
        <div className="space-y-2 border-t border-[var(--cms-line)] px-4 py-3 text-xs text-[var(--cms-muted)]">
          <p className="truncate text-[var(--cms-ink-soft)]">{email}</p>
          <a
            href="/api/edit/auth/signout"
            className="inline-block font-semibold text-[var(--cms-accent)] hover:underline"
          >
            {t.signOut}
          </a>
        </div>
      </aside>

      <main className="cms-shell__main">
        <header className="cms-shell__header">
          <div className="cms-shell__header-start">
            <button
              type="button"
              className="cms-menu-btn"
              aria-expanded={navOpen}
              aria-controls="cms-sidebar"
              aria-label={navOpen ? t.menuClose : t.menuOpen}
              onClick={() => setNavOpen((open) => !open)}
            >
              <MenuIcon open={navOpen} />
            </button>
            <h1 className="cms-shell__title">{title}</h1>
          </div>
          <div className="cms-shell__header-actions">
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
            <ThemeIconButton theme={theme} onToggle={toggleTheme} t={t} />
            <button
              type="button"
              className="cms-btn cms-btn-primary"
              onClick={() => setPublishOpen(true)}
            >
              {chromeLocale === 'en' ? 'Publish' : 'Opublikuj'}
            </button>
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="cms-btn cms-btn-view-site inline-flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
                <path
                  d="M3 12h18M12 3c2.5 2.8 3.8 5.8 3.8 9s-1.3 6.2-3.8 9c-2.5-2.8-3.8-5.8-3.8-9S9.5 5.8 12 3z"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinejoin="round"
                />
              </svg>
              <span>{t.viewSite}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M14 5h5v5M19 5l-9 9M10 5H5v14h14v-5"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </div>
        </header>

        <div className={`cms-shell__body${showSaveBar ? ' cms-shell__body--with-save' : ''}`}>
          {error ? (
            <p className="mb-4 rounded-[var(--radius-lg)] border border-[var(--cms-danger)] bg-[var(--cms-danger-bg)] px-3 py-2 text-sm text-[var(--cms-danger)]">
              {error}
            </p>
          ) : null}
          {ok ? (
            <p className="mb-4 rounded-[var(--radius-lg)] border border-[var(--cms-ok)] bg-[var(--cms-ok-bg)] px-3 py-2 text-sm text-[var(--cms-ok)]">
              {ok}
            </p>
          ) : null}

          {section === 'dashboard' ? (
            <EditDashboard onOpenSection={navigate} chromeLocale={chromeLocale} document={document} />
          ) : section === 'analytics' ? (
            <AnalyticsDashboard t={t} />
          ) : section === 'assets' ? (
            <AssetsLibrary t={t} />
          ) : section === 'account' ? (
            <div className="mx-auto flex max-w-md flex-col gap-6">
              {document ? (
                <LocalesToggle
                  document={document}
                  chromeLocale={chromeLocale}
                  onChange={(next) => {
                    setDocument(next)
                    setDirty(true)
                    setOk('')
                  }}
                />
              ) : null}
              <SetPasswordGate
                mode="change"
                supabaseUrl={supabaseUrl}
                supabaseAnonKey={supabaseAnonKey}
                t={t}
              />
            </div>
          ) : loading || !document ? (
            <p className="text-sm text-[var(--cms-muted)]">{t.loading}</p>
          ) : CONTENT_SECTIONS.has(section) ? (
            <SectionEditor
              section={section}
              document={document}
              contentLocale={contentLocale}
              contentLocales={contentLocales}
              onContentLocaleChange={onContentLocaleChange}
              t={t}
              onChange={(next) => {
                setDocument(next)
                setDirty(true)
              }}
            />
          ) : (
            <p className="text-sm text-[var(--cms-muted)]">{t.loading}</p>
          )}
        </div>

        {showSaveBar ? (
          <div className="cms-save-bar" role="region" aria-label={t.saveChanges}>
            <p className="cms-save-bar__status" data-dirty={dirty}>
              {dirty ? t.unsavedChanges : ok ? t.saved : '\u00a0'}
            </p>
            <button
              type="button"
              disabled={saving || loading || !dirty}
              onClick={() => void save()}
              className="cms-btn cms-btn-primary"
            >
              {saving ? t.saving : t.saveChanges}
            </button>
          </div>
        ) : null}
      </main>
      <PublishConfirmModal
        locale={chromeLocale}
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
      />
    </div>
  )
}

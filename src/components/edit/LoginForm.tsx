import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { createSupabaseBrowser } from '@/lib/supabaseAuth'
import { ThemeIconButton } from '@/components/edit/LoginThemeToggle'
import {
  chromeStrings,
  readStoredChromeLocale,
  storeChromeLocale,
  type CmsChromeLocale,
  type CmsChromeStrings,
} from '@/lib/cms/i18n'
import { useCmsTheme } from '@/lib/cms/theme'
import '@/styles/edit-cms.css'

type Props = {
  supabaseUrl: string
  supabaseAnonKey: string
  t: CmsChromeStrings
}

type Mode = 'magic' | 'password' | 'forgot'

export function LoginForm({ supabaseUrl, supabaseAnonKey, t }: Props) {
  const [mode, setMode] = useState<Mode>('magic')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function onMagicSubmit(event: FormEvent) {
    event.preventDefault()
    setStatus('loading')
    setMessage('')
    try {
      const res = await fetch('/api/edit/auth/magic-link', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        error?: string
        ok?: boolean
        redirectTo?: string
        retryAfterSec?: number
      }
      if (!res.ok) {
        if (res.status === 429) {
          const wait =
            typeof data.retryAfterSec === 'number' && data.retryAfterSec > 0
              ? ` (${Math.ceil(data.retryAfterSec / 60)} min)`
              : ''
          throw new Error((data.error || t.magicLinkWait) + wait)
        }
        throw new Error(data.error || t.couldNotSendLink)
      }

      const redirectTo = data.redirectTo || `${window.location.origin}/edit/auth/callback`
      const supabase = createSupabaseBrowser(supabaseUrl, supabaseAnonKey)
      if (!supabase) throw new Error(t.authNotConfigured)

      // PKCE: code_verifier stays in this browser — open the emailed link here.
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: redirectTo,
          shouldCreateUser: false,
        },
      })
      if (error) {
        const lower = error.message.toLowerCase()
        if (
          lower.includes('rate limit') ||
          lower.includes('over_email_send_rate_limit') ||
          lower.includes('only request this after') ||
          lower.includes('security purposes')
        ) {
          throw new Error(t.emailRateLimited)
        }
        throw error
      }

      setStatus('sent')
      setMessage(t.magicLinkSent)
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : t.somethingWentWrong)
    }
  }

  async function onPasswordSubmit(event: FormEvent) {
    event.preventDefault()
    setStatus('loading')
    setMessage('')
    try {
      const supabase = createSupabaseBrowser(supabaseUrl, supabaseAnonKey)
      if (!supabase) throw new Error(t.authNotConfigured)
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })
      if (error) throw error
      window.location.assign('/edit/app')
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : t.somethingWentWrong)
    }
  }

  async function onForgotSubmit(event: FormEvent) {
    event.preventDefault()
    setStatus('loading')
    setMessage('')
    try {
      const supabase = createSupabaseBrowser(supabaseUrl, supabaseAnonKey)
      if (!supabase) throw new Error(t.authNotConfigured)
      const redirectTo = `${window.location.origin}/edit/auth/callback?next=recovery`
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo,
      })
      if (error) throw error
      setStatus('sent')
      setMessage(t.resetSent)
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : t.somethingWentWrong)
    }
  }

  function setTab(next: Mode) {
    setMode(next)
    setStatus('idle')
    setMessage('')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label={t.signInMethod}>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'magic'}
          className={`cms-btn ${mode === 'magic' ? 'cms-btn-primary' : 'cms-btn-ghost'}`}
          onClick={() => setTab('magic')}
        >
          {t.magicLinkTab}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'password' || mode === 'forgot'}
          className={`cms-btn ${mode === 'password' || mode === 'forgot' ? 'cms-btn-primary' : 'cms-btn-ghost'}`}
          onClick={() => setTab('password')}
        >
          {t.passwordTab}
        </button>
      </div>

      <form
        onSubmit={
          mode === 'magic' ? onMagicSubmit : mode === 'forgot' ? onForgotSubmit : onPasswordSubmit
        }
        className="cms-login__form"
      >
        <div className="cms-login__field cms-field">
          <label htmlFor="email">{t.workEmail}</label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="cms-input"
            placeholder="you@hostesswebs.pl"
          />
        </div>
        {mode === 'password' ? (
          <div className="cms-login__field cms-field">
            <label htmlFor="password">{t.password}</label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="cms-input"
            />
          </div>
        ) : null}
        <button type="submit" disabled={status === 'loading'} className="cms-btn cms-btn-primary">
          {status === 'loading'
            ? '…'
            : mode === 'magic'
              ? t.emailMagicLink
              : mode === 'forgot'
                ? t.sendReset
                : t.signIn}
        </button>
        {mode === 'password' ? (
          <button type="button" className="cms-btn cms-btn-ghost" onClick={() => setTab('forgot')}>
            {t.forgotPassword}
          </button>
        ) : null}
        {mode === 'forgot' ? (
          <button type="button" className="cms-btn cms-btn-ghost" onClick={() => setTab('password')}>
            {t.backToSignIn}
          </button>
        ) : null}
        {message ? (
          <p className="cms-login__status" data-tone={status === 'error' ? 'error' : 'ok'} role="status">
            {message}
          </p>
        ) : null}
      </form>
    </div>
  )
}

type LoginShellProps = {
  supabaseUrl: string
  supabaseAnonKey: string
  productName: string
  templateLabel: string
  markSrc: string
  configError: boolean
  authError: boolean
  inviteError: boolean
}

/** Login page chrome: theme, panel language, brand copy, form. */
export function LoginShell({
  supabaseUrl,
  supabaseAnonKey,
  productName,
  templateLabel,
  markSrc,
  configError,
  authError,
  inviteError,
}: LoginShellProps) {
  const [chromeLocale, setChromeLocale] = useState<CmsChromeLocale>('pl')
  const t = useMemo(() => chromeStrings(chromeLocale), [chromeLocale])

  useEffect(() => {
    setChromeLocale(readStoredChromeLocale())
  }, [])

  return (
    <div className="cms-login">
      <div className="cms-login__toolbar flex flex-wrap items-center justify-end gap-2">
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
        <LoginThemeToggleWithLocale t={t} />
      </div>
      <div className="cms-login__brand">
        <img src={markSrc} alt={productName} width="56" height="56" />
        <p className="cms-brand">{productName}</p>
        <h1 className="cms-login__title">
          {templateLabel} · {t.loginTitle}
        </h1>
        <p className="cms-login__lede">{t.loginLede}</p>
      </div>
      {configError ? <p className="cms-login__alert">{t.loginConfigError}</p> : null}
      {authError ? <p className="cms-login__alert">{t.loginAuthError}</p> : null}
      {inviteError ? (
        <p className="cms-login__alert cms-login__alert--invite">{t.loginInviteError}</p>
      ) : null}
      {!configError && supabaseUrl && supabaseAnonKey ? (
        <LoginForm supabaseUrl={supabaseUrl} supabaseAnonKey={supabaseAnonKey} t={t} />
      ) : null}
    </div>
  )
}

function LoginThemeToggleWithLocale({ t }: { t: CmsChromeStrings }) {
  const { theme, toggleTheme } = useCmsTheme()
  return <ThemeIconButton theme={theme} onToggle={toggleTheme} t={t} />
}

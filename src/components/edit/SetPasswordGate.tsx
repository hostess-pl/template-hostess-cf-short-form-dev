import { useState, type FormEvent } from 'react'
import { createSupabaseBrowser } from '@/lib/supabaseAuth'
import type { CmsChromeStrings } from '@/lib/cms/i18n'

type Props = {
  supabaseUrl: string
  supabaseAnonKey: string
  t: CmsChromeStrings
  onDone?: () => void
  mode?: 'gate' | 'change'
}

export function SetPasswordGate({
  supabaseUrl,
  supabaseAnonKey,
  t,
  onDone,
  mode = 'gate',
}: Props) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'ok'>('idle')
  const [message, setMessage] = useState('')

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setMessage('')
    if (password.length < 8) {
      setStatus('error')
      setMessage(t.passwordMinLength)
      return
    }
    if (password !== confirm) {
      setStatus('error')
      setMessage(t.passwordsMismatch)
      return
    }

    setStatus('loading')
    try {
      const supabase = createSupabaseBrowser(supabaseUrl, supabaseAnonKey)
      if (!supabase) throw new Error(t.authNotConfigured)
      const { error } = await supabase.auth.updateUser({
        password,
        data: { cms_password_set: true },
      })
      if (error) throw error
      setStatus('ok')
      setMessage(t.passwordUpdated)
      setPassword('')
      setConfirm('')
      onDone?.()
    } catch (err) {
      setStatus('error')
      setMessage(err instanceof Error ? err.message : t.passwordSaveFailed)
    }
  }

  const inner = (
    <form onSubmit={onSubmit} className={mode === 'gate' ? 'cms-panel w-full max-w-md space-y-4 p-6 shadow-[var(--cms-shadow)]' : 'space-y-4'}>
      {mode === 'gate' ? (
        <div>
          <h2 className="font-display text-xl font-semibold text-[var(--cms-ink)]">
            {t.newPassword}
          </h2>
          <p className="mt-1 text-sm text-[var(--cms-muted)]">{t.setPasswordHint}</p>
        </div>
      ) : (
        <h3 className="font-display text-lg font-semibold text-[var(--cms-ink)]">{t.changePassword}</h3>
      )}
      <div className="cms-field">
        <label htmlFor="cms-new-password">{t.newPassword}</label>
        <input
          id="cms-new-password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="cms-input"
        />
      </div>
      <div className="cms-field">
        <label htmlFor="cms-confirm-password">{t.confirmPassword}</label>
        <input
          id="cms-confirm-password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="cms-input"
        />
      </div>
      <button type="submit" disabled={status === 'loading'} className="cms-btn cms-btn-primary w-full">
        {status === 'loading' ? '…' : t.updatePassword}
      </button>
      {message ? (
        <p
          className={`text-sm ${status === 'error' ? 'text-[var(--cms-danger)]' : 'text-[var(--cms-ok)]'}`}
          role="status"
        >
          {message}
        </p>
      ) : null}
    </form>
  )

  if (mode === 'change') return inner
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">{inner}</div>
  )
}

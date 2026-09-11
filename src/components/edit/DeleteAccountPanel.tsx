import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import type { CmsChromeLocale } from '@/lib/cms/i18n'
import { createSupabaseBrowser } from '@/lib/supabaseAuth'

type Props = { locale: CmsChromeLocale; supabaseUrl: string; supabaseAnonKey: string }

export function DeleteAccountPanel({ locale, supabaseUrl, supabaseAnonKey }: Props) {
  const isEn = locale === 'en'
  const phrase = isEn ? 'DELETE FOREVER' : 'USUŃ NA ZAWSZE'
  const [open, setOpen] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    inputRef.current?.focus()
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  const close = () => {
    if (pending) return
    setOpen(false)
    setConfirmation('')
    setError(false)
    window.setTimeout(() => triggerRef.current?.focus(), 0)
  }

  const handleDialogKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      close()
      return
    }
    if (event.key !== 'Tab') return
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled)')
    if (!focusable?.length) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  const remove = async () => {
    if (confirmation !== phrase || pending) return
    setPending(true)
    setError(false)
    try {
      const response = await fetch('/api/edit/account/delete', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ confirmation }),
      })
      const result = await response.json().catch(() => ({})) as { error?: string }
      if (!response.ok) throw new Error(result.error || 'delete_failed')
      const client = createSupabaseBrowser(supabaseUrl, supabaseAnonKey)
      await client?.auth.signOut({ scope: 'global' }).catch(() => null)
      window.location.replace('https://hostesswebs.pl/')
    } catch {
      setError(true)
      setPending(false)
    }
  }

  return (
    <section className="cms-danger-zone" aria-labelledby="delete-account-heading">
      <div>
        <h2 id="delete-account-heading">{isEn ? 'Delete account' : 'Usuń konto'}</h2>
        <p>{isEn ? 'Permanently remove your portfolio, uploaded files and login account.' : 'Trwale usuń portfolio, przesłane pliki i konto logowania.'}</p>
      </div>
      <button ref={triggerRef} type="button" className="cms-btn cms-btn-danger" onClick={() => setOpen(true)}>{isEn ? 'Delete account and portfolio' : 'Usuń konto i portfolio'}</button>

      {open ? (
        <div className="cms-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close() }}>
          <div ref={dialogRef} className="cms-modal cms-delete-modal" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title" aria-describedby="delete-modal-description" onKeyDown={handleDialogKey}>
            <div className="cms-delete-modal__header">
              <span className="cms-delete-modal__icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13M10 11v5m4-5v5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
              <div><h2 id="delete-modal-title">{isEn ? 'Delete everything permanently?' : 'Usunąć wszystko na zawsze?'}</h2><p id="delete-modal-description">{isEn ? 'This cannot be undone.' : 'Tej operacji nie można cofnąć.'}</p></div>
              <button type="button" className="cms-delete-modal__close" onClick={close} aria-label={isEn ? 'Close' : 'Zamknij'} disabled={pending}>×</button>
            </div>
            <p>{isEn ? 'Your portfolio, uploaded photos, login account and associated hosting will be permanently removed.' : 'Portfolio, przesłane zdjęcia, konto logowania i powiązany hosting zostaną trwale usunięte.'}</p>
            <label className="cms-label" htmlFor="delete-confirmation">{isEn ? 'To confirm, type:' : 'Aby potwierdzić, wpisz:'} <strong className="cms-delete-phrase">{phrase}</strong></label>
            <input ref={inputRef} id="delete-confirmation" className="cms-input" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" spellCheck={false} aria-describedby={error ? 'delete-error' : undefined} />
            {error ? <div id="delete-error" className="cms-delete-error" role="alert"><strong>{isEn ? 'Deletion could not be completed.' : 'Nie udało się dokończyć usuwania.'}</strong><span>{isEn ? 'Try again. If the problem returns, contact us at kontakt@hostesswebs.pl.' : 'Spróbuj ponownie. Jeśli problem się powtórzy, napisz do nas: kontakt@hostesswebs.pl.'}</span></div> : null}
            <div className="cms-modal__actions">
              <button type="button" className="cms-btn cms-btn-secondary" onClick={close} disabled={pending}>{isEn ? 'Cancel' : 'Anuluj'}</button>
              <button type="button" className="cms-btn cms-btn-danger" onClick={() => void remove()} disabled={confirmation !== phrase || pending}>{pending ? (isEn ? 'Deleting…' : 'Usuwanie…') : (isEn ? 'Delete forever' : 'Usuń na zawsze')}</button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

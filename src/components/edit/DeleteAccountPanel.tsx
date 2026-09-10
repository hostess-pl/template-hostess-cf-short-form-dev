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
  const [error, setError] = useState('')
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
    setError('')
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
    setError('')
    try {
      const response = await fetch('/api/edit/account/delete', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ confirmation }),
      })
      if (!response.ok) throw new Error('delete_failed')
      const client = createSupabaseBrowser(supabaseUrl, supabaseAnonKey)
      await client?.auth.signOut({ scope: 'global' }).catch(() => null)
      window.location.replace('https://hostesswebs.pl/')
    } catch {
      setError(isEn ? 'We could not delete the account. Nothing else will be removed until you try again.' : 'Nie udało się usunąć konta. Spróbuj ponownie za chwilę.')
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
          <div ref={dialogRef} className="cms-modal cms-delete-modal" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title" onKeyDown={handleDialogKey}>
            <h2 id="delete-modal-title">{isEn ? 'Delete everything permanently?' : 'Usunąć wszystko na zawsze?'}</h2>
            <p>{isEn ? 'This action cannot be undone. Your portfolio, photos, account and associated hosting will be permanently removed.' : 'Tej operacji nie można cofnąć. Portfolio, zdjęcia, konto oraz powiązany hosting zostaną trwale usunięte.'}</p>
            <label className="cms-label" htmlFor="delete-confirmation">{isEn ? `To confirm, type ${phrase}` : `Aby potwierdzić, wpisz ${phrase}`}</label>
            <input ref={inputRef} id="delete-confirmation" className="cms-input" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" spellCheck={false} aria-describedby={error ? 'delete-error' : undefined} />
            {error ? <p id="delete-error" className="cms-delete-error" role="alert">{error}</p> : null}
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

import { useState } from 'react'
import {
  buildPublishModalCopy,
  requestPortfolioPublish,
} from '@/lib/cms/publishConfirm'

type Props = {
  locale: string
  open: boolean
  onClose: () => void
}

export function PublishConfirmModal({ locale, open, onClose }: Props) {
  const copy = buildPublishModalCopy(locale, '/edit')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (!open) return null

  async function onConfirm() {
    setBusy(true)
    setError('')
    try {
      const res = await requestPortfolioPublish()
      if (!res.ok) throw new Error('publish_failed')
      window.location.href = '/'
    } catch {
      setError(copy.error)
      setBusy(false)
    }
  }

  return (
    <div className="cms-publish-modal" role="presentation">
      <button type="button" className="cms-publish-modal__backdrop" aria-label={copy.cancel} onClick={onClose} />
      <div
        className="cms-publish-modal__card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cms-publish-title"
      >
        <h2 id="cms-publish-title" className="cms-publish-modal__title">
          {copy.title}
        </h2>
        <p className="cms-publish-modal__body">{copy.body}</p>
        <p className="cms-publish-modal__note">{copy.editNote}</p>
        {error ? <p className="cms-publish-modal__error">{error}</p> : null}
        <div className="cms-publish-modal__actions">
          <button type="button" className="cms-btn" onClick={onClose} disabled={busy}>
            {copy.cancel}
          </button>
          <button type="button" className="cms-btn cms-btn-primary" onClick={onConfirm} disabled={busy}>
            {busy ? copy.publishing : copy.confirm}
          </button>
        </div>
      </div>
    </div>
  )
}

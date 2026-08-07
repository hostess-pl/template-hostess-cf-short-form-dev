import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AssetsLibrary } from '@/components/edit/AssetsLibrary'
import type { MediaAsset } from '@/lib/cms/media'
import type { CmsChromeStrings } from '@/lib/cms/i18n'

type Props = {
  open: boolean
  accept: 'image' | 'video' | 'all'
  t: CmsChromeStrings
  onClose: () => void
  onSelect: (url: string) => void
}

/**
 * Full-screen asset dialog. Portals to document.body so sticky CMS chrome
 * (header / save bar) cannot cover Upload new on mobile.
 */
export function AssetPicker({ open, accept, t, onClose, onSelect }: Props) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    const root = document.querySelector('.cms-root')
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    root?.setAttribute('data-cms-modal-open', 'true')
    return () => {
      document.body.style.overflow = previousOverflow
      root?.removeAttribute('data-cms-modal-open')
    }
  }, [open])

  if (!open || !mounted || typeof document === 'undefined') return null

  function handleSelect(asset: MediaAsset) {
    onSelect(asset.url)
    onClose()
  }

  const acceptLabel =
    accept === 'video' ? t.videosOnly : accept === 'image' ? t.imagesOnly : t.imagesAndVideos
  const theme =
    document.querySelector('.cms-root')?.getAttribute('data-cms-theme') || undefined

  return createPortal(
    <div
      className="cms-modal-backdrop"
      data-cms-theme={theme}
      role="dialog"
      aria-modal="true"
      aria-label={t.chooseAsset}
    >
      <div className="cms-modal">
        <div className="cms-modal__header flex items-center justify-between border-b border-[var(--cms-line)] px-4 py-3">
          <div>
            <p className="font-display text-lg font-semibold text-[var(--cms-ink)]">{t.chooseAsset}</p>
            <p className="text-xs text-[var(--cms-muted)]">{acceptLabel}</p>
          </div>
          <button type="button" className="cms-btn cms-btn-ghost" onClick={onClose}>
            {t.close}
          </button>
        </div>
        <div className="cms-modal__body px-4 py-4">
          <AssetsLibrary compact accept={accept} t={t} onSelect={handleSelect} />
        </div>
      </div>
    </div>,
    document.body,
  )
}

import { useCallback, useEffect, useState } from 'react'
import {
  fetchMediaAssets,
  isImageContentType,
  isVideoContentType,
  uploadMediaAsset,
  type MediaAsset,
} from '@/lib/cms/media'
import type { CmsChromeStrings } from '@/lib/cms/i18n'

type Props = {
  t: CmsChromeStrings
  onSelect?: (asset: MediaAsset) => void
  accept?: 'image' | 'video' | 'all'
  compact?: boolean
}

function matchesAccept(asset: MediaAsset, accept: Props['accept']): boolean {
  if (!accept || accept === 'all') return true
  if (accept === 'image') return isImageContentType(asset.contentType)
  return isVideoContentType(asset.contentType)
}

export function AssetsLibrary({ t, onSelect, accept = 'all', compact = false }: Props) {
  const [items, setItems] = useState<MediaAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const list = await fetchMediaAssets()
      setItems(list.filter((item) => matchesAccept(item, accept)))
    } catch (err) {
      setError(err instanceof Error ? err.message : t.loadFailed)
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [accept, t.loadFailed])

  useEffect(() => {
    void load()
  }, [load])

  async function onUpload(file: File) {
    setUploading(true)
    setError('')
    try {
      const asset = await uploadMediaAsset(file)
      setItems((prev) => [asset, ...prev.filter((item) => item.path !== asset.path)])
      onSelect?.(asset)
    } catch (err) {
      setError(err instanceof Error ? err.message : t.uploadFailed)
    } finally {
      setUploading(false)
    }
  }

  function copyUrl(url: string) {
    void navigator.clipboard.writeText(url).then(() => {
      setCopied(url)
      window.setTimeout(() => setCopied(''), 1500)
    })
  }

  return (
    <div className={compact ? 'space-y-4' : 'mx-auto max-w-5xl space-y-5'}>
      {!compact ? (
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-[var(--cms-ink)]">
              {t.assetsTitle}
            </h2>
            <p className="mt-1 text-sm text-[var(--cms-muted)]">{t.assetsLede}</p>
          </div>
          <label className="cms-btn cms-btn-primary cursor-pointer">
            {uploading ? t.uploading : t.upload}
            <input
              type="file"
              className="sr-only"
              accept={
                accept === 'image'
                  ? 'image/*'
                  : accept === 'video'
                    ? 'video/mp4,video/webm'
                    : 'image/*,video/mp4,video/webm'
              }
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0]
                e.target.value = ''
                if (file) void onUpload(file)
              }}
            />
          </label>
        </div>
      ) : (
        <div className="cms-assets-library__upload flex justify-end">
          <label className="cms-btn cms-btn-primary cursor-pointer">
            {uploading ? t.uploading : t.uploadNew}
            <input
              type="file"
              className="sr-only"
              accept={
                accept === 'image'
                  ? 'image/*'
                  : accept === 'video'
                    ? 'video/mp4,video/webm'
                    : 'image/*,video/mp4,video/webm'
              }
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0]
                e.target.value = ''
                if (file) void onUpload(file)
              }}
            />
          </label>
        </div>
      )}

      {error ? (
        <p className="rounded-[var(--radius-lg)] border border-[var(--cms-danger)] bg-[var(--cms-danger-bg)] px-3 py-2 text-sm text-[var(--cms-danger)]">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-[var(--cms-muted)]">{t.assetsLoading}</p>
      ) : items.length === 0 ? (
        <div className="cms-panel px-4 py-10 text-center text-sm text-[var(--cms-muted)]">
          {t.assetsEmpty}
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((asset) => {
            const image = isImageContentType(asset.contentType)
            const video = isVideoContentType(asset.contentType)
            return (
              <li key={asset.path} className="cms-panel overflow-hidden">
                <button
                  type="button"
                  className="block w-full text-left"
                  onClick={() => onSelect?.(asset)}
                >
                  <div className="flex aspect-square items-center justify-center bg-[var(--cms-bg)]">
                    {image ? (
                      <img src={asset.url} alt="" className="h-full w-full object-cover" />
                    ) : video ? (
                      <video
                        src={asset.url}
                        className="h-full w-full object-cover"
                        muted
                        playsInline
                        preload="metadata"
                      />
                    ) : (
                      <span className="px-2 text-center text-xs text-[var(--cms-muted)]">
                        {asset.name}
                      </span>
                    )}
                  </div>
                </button>
                <div className="space-y-1 border-t border-[var(--cms-line)] px-2.5 py-2">
                  <p className="truncate text-xs font-medium text-[var(--cms-ink)]">{asset.name}</p>
                  <p className="text-[10px] text-[var(--cms-muted)]">
                    {(asset.size / 1024).toFixed(0)} KB · {asset.contentType.split('/')[1] || 'file'}
                    {asset.source === 'site'
                      ? ` · ${t.siteSource}`
                      : asset.source === 'storage'
                        ? ` · ${t.uploadedSource}`
                        : ''}
                  </p>
                  <div className="flex gap-2 pt-1">
                    {onSelect ? (
                      <button
                        type="button"
                        className="text-[10px] font-semibold text-[var(--cms-accent)] hover:underline"
                        onClick={() => onSelect(asset)}
                      >
                        {t.useAsset}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="text-[10px] font-semibold text-[var(--cms-muted)] hover:text-[var(--cms-ink)]"
                      onClick={() => copyUrl(asset.url)}
                    >
                      {copied === asset.url ? t.copied : t.copyUrl}
                    </button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

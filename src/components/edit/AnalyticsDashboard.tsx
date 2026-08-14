import { useEffect, useState } from 'react'
import type { CmsChromeStrings } from '@/lib/cms/i18n'

type SummaryResponse = {
  portfolioStatus?: string
  summary: {
    page_views: number
    unique_visitors: number
    sessions: number
    leads: number
  }
  daily?: Array<{ date: string; count: number }>
  devices: Record<string, number>
  locales: Record<string, number>
  utm_sources: Record<string, number>
  pages: Record<string, number>
  latest: Array<{
    created_at: string
    event_type: string
    locale: string
    device_type: string
    utm_source: string
    page_path: string
  }>
  error?: string
}

function Breakdown({
  title,
  data,
  emptyLabel,
}: {
  title: string
  data: Record<string, number>
  emptyLabel: string
}) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 8)
  const max = entries[0]?.[1] ?? 1
  return (
    <div className="cms-panel p-4">
      <h3 className="font-display text-sm font-semibold text-[var(--cms-ink)]">{title}</h3>
      {entries.length === 0 ? (
        <p className="mt-2 text-xs text-[var(--cms-muted)]">{emptyLabel}</p>
      ) : (
        <ul className="mt-3 space-y-2 text-sm">
          {entries.map(([key, count]) => (
            <li key={key}>
              <div className="mb-1 flex items-center justify-between gap-3">
                <span className="truncate text-[var(--cms-ink-soft)]">{key}</span>
                <span className="font-medium tabular-nums text-[var(--cms-ink)]">{count}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[var(--cms-line)]">
                <div
                  className="h-full rounded-full bg-[var(--cms-ink)] transition-[width] duration-500"
                  style={{ width: `${Math.max(8, (count / max) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function DailyActivity({
  title,
  daily,
  emptyLabel,
}: {
  title: string
  daily: Array<{ date: string; count: number }>
  emptyLabel: string
}) {
  const max = Math.max(1, ...daily.map((d) => d.count))
  return (
    <div className="cms-panel p-4">
      <h3 className="font-display text-sm font-semibold text-[var(--cms-ink)]">{title}</h3>
      {daily.every((d) => d.count === 0) ? (
        <p className="mt-2 text-xs text-[var(--cms-muted)]">{emptyLabel}</p>
      ) : (
        <div className="mt-4 flex items-end gap-2" style={{ minHeight: '7rem' }}>
          {daily.map((day) => (
            <div key={day.date} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <span className="text-[10px] font-medium tabular-nums text-[var(--cms-ink)]">
                {day.count > 0 ? day.count : ''}
              </span>
              <div
                className="w-full max-w-[2.5rem] rounded-t-md bg-[var(--cms-ink)] transition-[height] duration-500"
                style={{ height: `${Math.max(day.count > 0 ? 12 : 4, (day.count / max) * 96)}px` }}
              />
              <span className="text-[10px] text-[var(--cms-muted)]">
                {day.date.slice(5).replace('-', '/')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function AnalyticsDashboard({ t }: { t: CmsChromeStrings }) {
  const [data, setData] = useState<SummaryResponse | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const res = await fetch('/api/edit/analytics/summary')
        const json = (await res.json()) as SummaryResponse & { error?: string }
        if (!res.ok) throw new Error(json.error || t.analyticsLoadFailed)
        if (!cancelled) setData(json)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : t.analyticsLoadFailed)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [t.analyticsLoadFailed])

  if (loading) {
    return <p className="text-sm text-[var(--cms-muted)]">{t.analyticsLoading}</p>
  }

  if (error) {
    return (
      <p className="rounded-[var(--radius-lg)] border border-[var(--cms-danger)] bg-[var(--cms-danger-bg)] px-3 py-2 text-sm text-[var(--cms-danger)]">
        {error}
      </p>
    )
  }

  if (!data) return null

  const isDraft = data.portfolioStatus === 'draft' || data.portfolioStatus === 'suspended'
  const hasMetrics = data.summary.page_views > 0 || data.summary.leads > 0

  if (isDraft && !hasMetrics) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-[var(--cms-ink)]">
            {t.analyticsTitle}
          </h2>
          <p className="mt-1 text-sm text-[var(--cms-muted)]">{t.analyticsLede}</p>
        </div>
        <div className="cms-panel border-dashed p-6 text-center">
          <p className="font-display text-lg font-semibold text-[var(--cms-ink)]">
            {t.analyticsDraftTitle}
          </p>
          <p className="mt-2 text-sm text-[var(--cms-muted)]">{t.analyticsDraftHint}</p>
        </div>
      </div>
    )
  }

  const cards = [
    { label: t.pageViews, value: data.summary.page_views, accent: false },
    { label: t.uniqueVisitors, value: data.summary.unique_visitors, accent: false },
    { label: t.sessions, value: data.summary.sessions, accent: false },
    { label: t.leads, value: data.summary.leads, accent: true },
  ]

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold tracking-tight text-[var(--cms-ink)]">
          {t.analyticsTitle}
        </h2>
        <p className="mt-1 text-sm text-[var(--cms-muted)]">{t.analyticsLede}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`cms-panel p-4 ${card.accent ? 'ring-1 ring-[var(--cms-ink)]/15' : ''}`}
          >
            <p className="text-xs uppercase tracking-wide text-[var(--cms-muted)]">{card.label}</p>
            <p
              className={`mt-1 font-display text-2xl font-semibold tabular-nums ${
                card.accent ? 'text-[var(--cms-ink)]' : 'text-[var(--cms-ink)]'
              }`}
            >
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <DailyActivity
        title={t.analyticsDailyTitle}
        daily={data.daily ?? []}
        emptyLabel={t.noDataYet}
      />

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Breakdown title={t.pages} data={data.pages ?? {}} emptyLabel={t.noDataYet} />
        <Breakdown title={t.devices} data={data.devices} emptyLabel={t.noDataYet} />
        <Breakdown title={t.locales} data={data.locales} emptyLabel={t.noDataYet} />
        <Breakdown title={t.trafficSources} data={data.utm_sources} emptyLabel={t.noDataYet} />
      </div>

      <div className="cms-panel overflow-hidden">
        <div className="border-b border-[var(--cms-line)] px-4 py-3">
          <h3 className="font-display text-sm font-semibold text-[var(--cms-ink)]">{t.latestEvents}</h3>
        </div>
        {data.latest.length === 0 ? (
          <p className="px-4 py-6 text-sm text-[var(--cms-muted)]">{t.noEventsYet}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[var(--cms-bg-elevated)] text-xs uppercase tracking-wide text-[var(--cms-muted)]">
                <tr>
                  <th className="px-4 py-2 font-medium">{t.when}</th>
                  <th className="px-4 py-2 font-medium">{t.type}</th>
                  <th className="px-4 py-2 font-medium">{t.path}</th>
                  <th className="px-4 py-2 font-medium">{t.device}</th>
                  <th className="px-4 py-2 font-medium">{t.source}</th>
                </tr>
              </thead>
              <tbody>
                {data.latest.map((row) => (
                  <tr
                    key={`${row.created_at}-${row.event_type}-${row.page_path}`}
                    className="border-t border-[var(--cms-line)]"
                  >
                    <td className="whitespace-nowrap px-4 py-2 text-[var(--cms-muted)]">
                      {new Date(row.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-[var(--cms-ink-soft)]">{row.event_type}</td>
                    <td className="max-w-[12rem] truncate px-4 py-2 text-[var(--cms-ink)]">
                      {row.page_path}
                    </td>
                    <td className="px-4 py-2 text-[var(--cms-ink-soft)]">{row.device_type}</td>
                    <td className="px-4 py-2 text-[var(--cms-ink-soft)]">
                      {row.utm_source || t.direct}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

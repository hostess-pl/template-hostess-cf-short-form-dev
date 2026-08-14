import { useEffect, useState } from 'react'
import {
  computePortfolioCompletion,
  shortFormHasBakedHeroDefault,
  type PortfolioMilestone,
} from '@/lib/cms/portfolioCompletion'
import { getDashboardBlocks } from '@/cms/adapter'
import type { CmsChromeLocale } from '@/lib/cms/i18n'
import { chromeStrings } from '@/lib/cms/i18n'

type Props = {
  onOpenSection: (sectionId: string) => void
  chromeLocale?: CmsChromeLocale
  document?: Record<string, unknown> | null
}

const HEIGHT_CLASS = {
  xs: 'min-h-12',
  sm: 'min-h-24',
  md: 'min-h-36',
  lg: 'min-h-52',
} as const

function MilestoneRow({
  task,
  isEn,
  onOpen,
}: {
  task: PortfolioMilestone
  isEn: boolean
  onOpen: (id: string) => void
}) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(task.sectionId)}
        className="flex w-full items-center gap-3 rounded-md px-1 py-1.5 text-left text-sm text-[var(--cms-ink)] hover:bg-[var(--cms-soft)]"
      >
        <span
          className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] ${
            task.done
              ? 'border-emerald-600 bg-emerald-600 text-white'
              : 'border-[var(--cms-line)] text-[var(--cms-muted)]'
          }`}
          aria-hidden
        >
          {task.done ? '✓' : ''}
        </span>
        <span className={`min-w-0 flex-1 ${task.done ? 'text-[var(--cms-muted)] line-through' : ''}`}>
          {isEn ? task.labelEn : task.labelPl}
        </span>
        {!task.done ? (
          <span className="shrink-0 text-[11px] font-semibold text-[var(--cms-muted)]">+{task.weight}</span>
        ) : null}
      </button>
    </li>
  )
}

function InsightsTeaser({
  t,
  isEn,
  onOpenAnalytics,
}: {
  t: ReturnType<typeof chromeStrings>
  isEn: boolean
  onOpenAnalytics: () => void
}) {
  const [views, setViews] = useState<number | null>(null)
  const [draft, setDraft] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/edit/analytics/summary')
        const json = (await res.json()) as {
          summary?: { page_views?: number }
          portfolioStatus?: string
        }
        if (!res.ok || cancelled) return
        setDraft(json.portfolioStatus === 'draft' || json.portfolioStatus === 'suspended')
        setViews(json.summary?.page_views ?? 0)
      } catch {
        if (!cancelled) setViews(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (views === null) return null

  return (
    <button
      type="button"
      onClick={onOpenAnalytics}
      className="mb-6 flex w-full cursor-pointer items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--cms-line)] bg-[var(--cms-bg-elevated)] p-4 text-left transition hover:border-[var(--cms-ink)]/20 hover:bg-[var(--cms-soft)]"
    >
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--cms-muted)]">
          {isEn ? 'Insights' : 'Statystyki'}
        </p>
        <p className="mt-1 font-display text-xl font-semibold text-[var(--cms-ink)]">
          {draft && views === 0
            ? t.insightsTeaserDraft
            : `${views} · ${t.insightsTeaser}`}
        </p>
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0 text-[var(--cms-muted)]">
        <path
          d="M9 5l7 7-7 7"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}

export function EditDashboard({ onOpenSection, chromeLocale = 'pl', document = null }: Props) {
  const t = chromeStrings(chromeLocale)
  const blocks = getDashboardBlocks(chromeLocale)
  const completion = computePortfolioCompletion(document, {
    hasBakedHero: shortFormHasBakedHeroDefault(),
  })
  const { pct, doneCount, taskCount, milestones, next } = completion
  const core = milestones.filter((m) => m.tier === 'core')
  const boost = milestones.filter((m) => m.tier === 'boost')
  const isEn = chromeLocale === 'en'

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-[var(--cms-ink)]">
          {t.dashboard}
        </h2>
        <p className="mt-1 text-sm text-[var(--cms-muted)]">{t.dashboardHint}</p>
      </div>

      <InsightsTeaser t={t} isEn={isEn} onOpenAnalytics={() => onOpenSection('analytics')} />

      <div className="mb-8 rounded-[var(--radius-lg)] border border-[var(--cms-line)] bg-[var(--cms-bg)] p-4 shadow-[var(--cms-shadow)] sm:p-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--cms-muted)]">
              {isEn ? 'Portfolio strength' : 'Siła portfolio'}
            </p>
            <p className="mt-1 font-display text-3xl font-semibold text-[var(--cms-ink)]">{pct}%</p>
          </div>
          <p className="text-sm text-[var(--cms-muted)]">
            {doneCount}/{taskCount} {isEn ? 'done' : 'gotowe'}
          </p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--cms-line)]">
          <div
            className="h-full rounded-full bg-[var(--cms-ink)] transition-[width] duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
        {next ? (
          <button
            type="button"
            onClick={() => onOpenSection(next.sectionId)}
            className="mt-4 w-full rounded-[var(--radius-md)] border border-[var(--cms-line)] px-4 py-3 text-left transition hover:bg-[var(--cms-soft)]"
          >
            <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--cms-muted)]">
              {isEn ? 'Next recommended step' : 'Następny krok'} · +{next.weight}
            </span>
            <span className="mt-1 block font-display text-sm font-semibold text-[var(--cms-ink)]">
              {isEn ? next.labelEn : next.labelPl}
            </span>
          </button>
        ) : (
          <p className="mt-4 text-sm text-[var(--cms-muted)]">
            {isEn
              ? 'Great — basics look complete. Preview your draft, then publish when ready.'
              : 'Świetnie — podstawy gotowe. Sprawdź podgląd i opublikuj, gdy będziesz gotowa.'}
          </p>
        )}

        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--cms-muted)]">
          {isEn ? 'Core' : 'Fundament'}
        </p>
        <ul className="mt-2 space-y-1">
          {core.map((task) => (
            <MilestoneRow key={task.id} task={task} isEn={isEn} onOpen={onOpenSection} />
          ))}
        </ul>

        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--cms-muted)]">
          {isEn ? 'Boost your profile' : 'Wzmocnij profil'}
        </p>
        <p className="mt-1 text-xs text-[var(--cms-muted)]">
          {isEn
            ? 'Optional polish — small lifts that still help clients trust you.'
            : 'Opcjonalne dopracowanie — małe kroki, które budują zaufanie klientów.'}
        </p>
        <ul className="mt-2 space-y-1">
          {boost.map((task) => (
            <MilestoneRow key={task.id} task={task} isEn={isEn} onOpen={onOpenSection} />
          ))}
        </ul>
      </div>

      <div
        className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--cms-line)] bg-[var(--cms-bg)] shadow-[var(--cms-shadow)]"
        aria-label={t.dashboardAria}
      >
        <div className="space-y-3 p-4 sm:p-6">
          {blocks.map((block) => (
            <button
              key={block.id}
              type="button"
              onClick={() => onOpenSection(block.id)}
              className={`cms-wireframe-block flex w-full flex-col items-start justify-center px-4 py-3 text-left ${HEIGHT_CLASS[block.height]}`}
            >
              <span className="font-display text-sm font-semibold tracking-tight text-[var(--cms-ink)] sm:text-base">
                {block.label}
              </span>
              <span className="mt-1 text-xs text-[var(--cms-muted)]">{block.hint}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

import {
  computePortfolioCompletion,
  shortFormHasBakedHeroDefault,
  type PortfolioMilestone,
} from '@/lib/cms/portfolioCompletion'
import { getDashboardBlocks } from '@/cms/adapter'
import type { CmsChromeLocale } from '@/lib/cms/i18n'

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
        className={`flex min-h-11 w-full items-center gap-3 rounded-[var(--radius)] border px-3 py-2.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cms-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--cms-bg)] ${
          task.done
            ? 'border-transparent text-[var(--cms-muted)] hover:bg-[var(--cms-soft)]'
            : 'cursor-pointer border-[var(--cms-line)] bg-[var(--cms-bg-elevated)] text-[var(--cms-ink)] shadow-sm hover:border-[var(--cms-ink)]/25 hover:bg-[var(--cms-soft)] active:bg-[var(--cms-soft)]'
        }`}
      >
        <span
          className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] ${
            task.done
              ? 'border-emerald-600 bg-emerald-600 text-white'
              : 'border-[var(--cms-line)] text-[var(--cms-muted)]'
          }`}
          aria-hidden
        >
          {task.done ? <CheckIcon /> : null}
        </span>
        <span className={`min-w-0 flex-1 ${task.done ? 'text-[var(--cms-muted)] line-through' : ''}`}>
          {isEn ? task.labelEn : task.labelPl}
        </span>
        {!task.done ? <ChevronRightIcon /> : null}
      </button>
    </li>
  )
}

function ChevronRightIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="shrink-0 text-[var(--cms-muted)]"
    >
      <path
        d="M9 5l7 7-7 7"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="m5 12 4 4L19 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function EditDashboard({ onOpenSection, chromeLocale = 'pl', document = null }: Props) {
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
      <div
        className="mb-8 rounded-[var(--radius-lg)] border border-[var(--cms-line)] bg-[var(--cms-bg)] p-4 shadow-[var(--cms-shadow)] sm:p-6"
        data-tour="progress"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--cms-muted)]">
              {isEn ? 'Complete your portfolio' : 'Dokończ swoje portfolio'}
            </p>
            <p className="mt-1 font-display text-3xl font-semibold text-[var(--cms-ink)]">
              {pct}% {isEn ? 'complete' : 'gotowe'}
            </p>
          </div>
          <p className="text-sm text-[var(--cms-muted)]">
            {isEn
              ? `${doneCount} of ${taskCount} steps completed`
              : `${doneCount} z ${taskCount} kroków ukończonych`}
          </p>
        </div>
        <div
          className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--cms-line)]"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          aria-label={isEn ? 'Portfolio completion' : 'Postęp uzupełniania portfolio'}
        >
          <div
            className="h-full rounded-full bg-[var(--cms-ink)] transition-[width] duration-300 motion-reduce:transition-none"
            style={{ width: `${pct}%` }}
          />
        </div>
        {next ? (
          <button
            type="button"
            onClick={() => onOpenSection(next.sectionId)}
            className="mt-5 flex min-h-16 w-full cursor-pointer items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--cms-line)] bg-[var(--cms-bg-elevated)] p-4 text-left shadow-sm transition-colors hover:border-[var(--cms-ink)]/25 hover:bg-[var(--cms-soft)] active:bg-[var(--cms-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cms-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--cms-bg)]"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--cms-muted)]">
                {isEn ? 'Your next step' : 'Twój następny krok'}
              </span>
              <span className="mt-1 block font-display text-base font-semibold text-[var(--cms-ink)]">
                {isEn ? next.labelEn : next.labelPl}
              </span>
            </span>
            <ChevronRightIcon />
          </button>
        ) : (
          <p className="mt-4 text-sm text-[var(--cms-muted)]">
            {isEn
              ? 'Great — your portfolio is complete. Preview it and publish when you are ready.'
              : 'Świetnie — Twoje portfolio jest kompletne. Sprawdź podgląd i opublikuj, gdy będziesz gotowa.'}
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
            ? 'This information is not required to publish, but it will help present you better to employers.'
            : 'Te informacje nie są wymagane do publikacji, ale pomogą lepiej zaprezentować Cię pracodawcom.'}
        </p>
        <ul className="mt-2 space-y-1">
          {boost.map((task) => (
            <MilestoneRow key={task.id} task={task} isEn={isEn} onOpen={onOpenSection} />
          ))}
        </ul>
      </div>

      <div
        className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--cms-line)] bg-[var(--cms-bg)] shadow-[var(--cms-shadow)]"
        aria-label={isEn ? 'Portfolio sections' : 'Sekcje portfolio'}
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

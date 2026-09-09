import { useEffect, useMemo, useRef, useState } from 'react'
import type { CmsChromeLocale } from '@/lib/cms/i18n'

export type TourEarlyAdopter = {
  ok: boolean
  eligible: boolean
  remaining: number
  cap: number
}

type Props = {
  step: number
  locale: CmsChromeLocale
  editUrl: string
  earlyAdopter: TourEarlyAdopter | null
  onBack: () => void
  onNext: () => void
  onSkip: () => void
}

type SpotlightRect = {
  top: number
  left: number
  width: number
  height: number
}

type TourStep = {
  title: string
  body: string
  note?: string
}

const TARGETS = ['progress', 'nav-hero', 'hero-content', 'save', 'preview', 'publish'] as const

export function CmsOnboardingTour({
  step,
  locale,
  editUrl,
  earlyAdopter,
  onBack,
  onNext,
  onSkip,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null)
  const isEn = locale === 'en'
  const steps = useMemo<TourStep[]>(() => {
    const promo = earlyAdopter?.ok && earlyAdopter.eligible
      ? isEn
        ? `Want your portfolio for free? Don't wait — ${earlyAdopter.remaining} of ${earlyAdopter.cap} spots are left.`
        : `Chcesz otrzymać portfolio za darmo? Nie zwlekaj — zostało ${earlyAdopter.remaining} z ${earlyAdopter.cap} miejsc.`
      : ''

    return isEn
      ? [
          {
            title: 'Your completion plan',
            body: 'Here you can see what is still missing from your portfolio. You can publish before reaching 100%, but a more complete profile makes it easier for recruiters to understand your experience and contact you.',
          },
          {
            title: 'Your website sections',
            body: 'Each menu item represents a different part of your portfolio. Choose a section to open its editor.',
          },
          {
            title: 'Edit your content',
            body: 'This is where you update the text and photos for the selected section. Start with a short headline and a few sentences about yourself.',
          },
          {
            title: 'Save your changes',
            body: 'Click “Save changes” to update the content on your website. The button becomes active after you make a change.',
          },
          {
            title: 'Preview your website',
            body: 'This button opens your portfolio in a new tab. If the latest changes are not visible, refresh that tab.',
          },
          {
            title: 'Publish your portfolio',
            body: `After publishing, your website becomes public and anyone with the link can view it. You can edit it later at ${editUrl}.`,
            note: promo,
          },
        ]
      : [
          {
            title: 'Twój plan uzupełniania',
            body: 'Tutaj widzisz, czego jeszcze brakuje w portfolio. Możesz opublikować je przed osiągnięciem 100%, ale im pełniejszy profil, tym łatwiej rekruterom ocenić Twoje doświadczenie i skontaktować się z Tobą.',
          },
          {
            title: 'Sekcje Twojej strony',
            body: 'Każda pozycja w menu odpowiada innej części portfolio. Wybierz sekcję, aby przejść do jej edycji.',
          },
          {
            title: 'Edytuj treść',
            body: 'W tym miejscu zmieniasz teksty i zdjęcia wybranej sekcji. Zacznij od krótkiego nagłówka i kilku zdań o sobie.',
          },
          {
            title: 'Zapisuj zmiany',
            body: 'Kliknij „Zapisz zmiany”, aby zaktualizować treść na swojej stronie. Przycisk stanie się aktywny, gdy coś zmienisz.',
          },
          {
            title: 'Sprawdź swoją stronę',
            body: 'Ten przycisk otwiera portfolio w nowej karcie. Jeśli nie widzisz ostatnich zmian, odśwież tę kartę.',
          },
          {
            title: 'Opublikuj portfolio',
            body: `Po publikacji Twoja strona staje się publiczna i może ją zobaczyć każdy, kto ma link. Później możesz wrócić do edycji pod adresem ${editUrl}.`,
            note: promo,
          },
        ]
  }, [earlyAdopter, editUrl, isEn])

  const current = steps[step] ?? steps[0]
  const target = TARGETS[step] ?? TARGETS[0]

  useEffect(() => {
    let frame = 0
    let delayed = 0
    let observer: ResizeObserver | null = null

    const measure = () => {
      const element = document.querySelector<HTMLElement>(`[data-tour="${target}"]`)
      if (!element) {
        setSpotlight(null)
        return
      }
      const rect = element.getBoundingClientRect()
      const gap = 6
      const left = Math.max(8, rect.left - gap)
      const top = Math.max(8, rect.top - gap)
      setSpotlight({
        top,
        left,
        width: Math.max(0, Math.min(window.innerWidth - left - 8, rect.width + gap * 2)),
        height: Math.max(0, Math.min(window.innerHeight - top - 8, rect.height + gap * 2)),
      })
    }

    const reveal = () => {
      const element = document.querySelector<HTMLElement>(`[data-tour="${target}"]`)
      element?.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'auto' })
      measure()
      if (element && typeof ResizeObserver !== 'undefined') {
        observer = new ResizeObserver(measure)
        observer.observe(element)
      }
    }

    frame = window.requestAnimationFrame(reveal)
    delayed = window.setTimeout(reveal, 260)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(delayed)
      observer?.disconnect()
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [target])

  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    panel.querySelector<HTMLElement>('[data-tour-heading]')?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onSkip()
        return
      }
      if (event.key !== 'Tab') return
      const focusable = [...panel.querySelectorAll<HTMLElement>('[data-tour-heading], button:not([disabled])')]
      if (!focusable.length) return
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
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onSkip, step])

  const targetIsLow = Boolean(
    spotlight &&
      typeof window !== 'undefined' &&
      spotlight.top + spotlight.height / 2 > window.innerHeight / 2,
  )

  return (
    <>
      <div className="cms-tour-backdrop" aria-hidden="true" />
      {spotlight ? (
        <div
          className="cms-tour-spotlight"
          aria-hidden="true"
          style={spotlight}
        />
      ) : null}
      <div
        ref={panelRef}
        className="cms-tour-card"
        data-placement={targetIsLow ? 'top' : 'bottom'}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cms-tour-title"
        aria-describedby="cms-tour-body"
      >
        <div className="cms-tour-card__meta">
          <span>{isEn ? `Step ${step + 1} of ${steps.length}` : `Krok ${step + 1} z ${steps.length}`}</span>
          <button type="button" className="cms-tour-skip" onClick={onSkip}>
            {isEn ? 'Skip tour' : 'Pomiń przewodnik'}
          </button>
        </div>
        <h2 id="cms-tour-title" data-tour-heading tabIndex={-1} className="cms-tour-card__title">
          {current.title}
        </h2>
        <p id="cms-tour-body" className="cms-tour-card__body">{current.body}</p>
        {current.note ? <p className="cms-tour-card__note">{current.note}</p> : null}
        <div className="cms-tour-card__footer">
          <div className="cms-tour-dots" aria-hidden="true">
            {steps.map((_, index) => (
              <span key={index} data-active={index === step} />
            ))}
          </div>
          <div className="cms-tour-card__actions">
            {step > 0 ? (
              <button type="button" className="cms-btn cms-btn-ghost" onClick={onBack}>
                {isEn ? 'Back' : 'Wstecz'}
              </button>
            ) : null}
            <button type="button" className="cms-btn cms-btn-primary" onClick={onNext}>
              {step === steps.length - 1
                ? isEn ? 'Start editing' : 'Zaczynam'
                : isEn ? 'Next' : 'Dalej'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

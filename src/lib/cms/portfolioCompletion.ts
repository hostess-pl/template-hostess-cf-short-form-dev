/**
 * Weighted portfolio completion for short-form MVP onboarding.
 * Pure helpers — safe for Astro (server) and React (client).
 */
import type { CmsSectionId } from '@/lib/cms/nav'

export type CompletionTier = 'core' | 'boost'

export type PortfolioMilestone = {
  id: string
  weight: number
  done: boolean
  sectionId: CmsSectionId
  labelPl: string
  labelEn: string
  tier: CompletionTier
}

export type PortfolioCompletion = {
  pct: number
  earned: number
  total: number
  milestones: PortfolioMilestone[]
  next: PortfolioMilestone | null
  doneCount: number
  taskCount: number
}

type Options = {
  /** Provision always bakes form hero to hero.jpg on this tip. */
  hasBakedHero?: boolean
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function textLen(value: unknown): number {
  return String(value ?? '').trim().length
}

function nonEmpty(value: unknown): boolean {
  return textLen(value) > 0
}

function eventImage(row: Record<string, unknown>): string {
  return String(row.imageFile || row.image || '').trim()
}

function eventHasTitle(row: Record<string, unknown>): boolean {
  return nonEmpty(row.title)
}

function countAssetPhotos(assets: Record<string, unknown> | null): number {
  if (!assets) return 0
  let n = 0
  if (nonEmpty(assets.hero)) n += 1
  const events = assets.events
  if (Array.isArray(events)) {
    for (const item of events) {
      if (typeof item === 'string' && item.trim()) n += 1
      else if (asRecord(item) && nonEmpty(asRecord(item)?.url || asRecord(item)?.path)) n += 1
    }
  }
  for (const [key, value] of Object.entries(assets)) {
    if (key === 'hero' || key === 'events' || key === 'videos') continue
    if (typeof value === 'string' && /\.(jpe?g|png|webp|heic)$/i.test(value)) n += 1
  }
  return n
}

/**
 * Score a hostess / cms_content document for onboarding UI.
 * Heavier weights = more visual payoff on the public portfolio.
 */
export function computePortfolioCompletion(
  doc: Record<string, unknown> | null | undefined,
  options: Options = {},
): PortfolioCompletion {
  const profile = asRecord(doc?.profile)
  const copy = asRecord(doc?.copy)
  const bio = asRecord(doc?.bio)
  const assets = asRecord(doc?.assets)
  const appearance = asRecord(doc?.appearance)
  const mobility = asRecord(doc?.mobility)
  const education = asRecord(doc?.education)
  const socials = asRecord(profile?.socials) || asRecord(doc?.socials)
  const events = Array.isArray(doc?.events) ? doc!.events : []
  const languages = Array.isArray(doc?.languages) ? doc!.languages : []
  const employment = Array.isArray(doc?.employment) ? doc!.employment : []
  const studyEntries = Array.isArray(education?.entries) ? education!.entries : []

  const heroRef = String(assets?.hero || profile?.heroImage || '').trim()
  const hasHero =
    Boolean(options.hasBakedHero)
    || (Boolean(heroRef) && !/placeholder|event-1\.jpg$/i.test(heroRef))

  const titledEvents = events.filter((e) => {
    const row = asRecord(e)
    return Boolean(row && eventHasTitle(row))
  })
  const imagedEvents = events.filter((e) => {
    const row = asRecord(e)
    return Boolean(row && eventImage(row))
  })

  const bioText = String(bio?.short || copy?.aboutLead || copy?.profile || '').trim()
  const langOk = languages.some((l) => nonEmpty(asRecord(l)?.name))
  const jobOk = employment.some((j) => {
    const row = asRecord(j)
    return Boolean(row && (nonEmpty(row.title) || nonEmpty(row.company)))
  })
  const studyOk = studyEntries.some((s) => {
    const row = asRecord(s)
    return Boolean(
      row && (nonEmpty(row.university) || nonEmpty(row.school) || nonEmpty(row.field) || nonEmpty(row.fieldOfStudy)),
    )
  })
  const socialOk = Boolean(
    socials
    && (nonEmpty(socials.instagram)
      || nonEmpty(socials.tiktok)
      || nonEmpty(socials.linkedin)
      || nonEmpty(socials.facebook)),
  )
  const appearanceOk = Boolean(
    appearance
    && (nonEmpty(appearance.height)
      || nonEmpty(appearance.dressSize)
      || nonEmpty(appearance.hairColor)
      || nonEmpty(appearance.eyeColor)),
  )
  const mobilityOk = Boolean(
    mobility && (nonEmpty(mobility.drivingLicense) || Boolean(mobility.hasCar)),
  )

  const assetPhotoCount = countAssetPhotos(assets)
  const galleryDepthOk = imagedEvents.length >= 2 || assetPhotoCount >= 3

  const milestones: PortfolioMilestone[] = [
    {
      id: 'hero',
      weight: 12,
      done: hasHero,
      sectionId: 'hero',
      labelPl: 'Zdjęcie główne',
      labelEn: 'Hero photo',
      tier: 'core',
    },
    {
      id: 'event_story',
      weight: 22,
      done: titledEvents.length >= 1,
      sectionId: 'gallery',
      labelPl: 'Opisz pierwsze wydarzenie',
      labelEn: 'Describe your first event',
      tier: 'core',
    },
    {
      id: 'gallery_depth',
      weight: 18,
      done: galleryDepthOk,
      sectionId: 'assets',
      labelPl: 'Dodaj więcej zdjęć',
      labelEn: 'Add more photos',
      tier: 'core',
    },
    {
      id: 'bio',
      weight: 14,
      done: bioText.length >= 40,
      sectionId: 'about',
      labelPl: 'Napisz krótkie bio',
      labelEn: 'Write a short bio',
      tier: 'core',
    },
    {
      id: 'languages',
      weight: 10,
      done: langOk,
      sectionId: 'about',
      labelPl: 'Dodaj języki',
      labelEn: 'Add languages',
      tier: 'core',
    },
    {
      id: 'experience',
      weight: 10,
      done: jobOk,
      sectionId: 'experience',
      labelPl: 'Dodaj doświadczenie',
      labelEn: 'Add work experience',
      tier: 'core',
    },
    {
      id: 'studies',
      weight: 6,
      done: studyOk,
      sectionId: 'about',
      labelPl: 'Dodaj studia',
      labelEn: 'Add studies',
      tier: 'boost',
    },
    {
      id: 'socials',
      weight: 3,
      done: socialOk,
      sectionId: 'profile',
      labelPl: 'Dodaj social media',
      labelEn: 'Add social links',
      tier: 'boost',
    },
    {
      id: 'appearance',
      weight: 3,
      done: appearanceOk,
      sectionId: 'about',
      labelPl: 'Uzupełnij dane wyglądu',
      labelEn: 'Add physical stats',
      tier: 'boost',
    },
    {
      id: 'mobility',
      weight: 2,
      done: mobilityOk,
      sectionId: 'about',
      labelPl: 'Prawo jazdy / auto',
      labelEn: 'License / car',
      tier: 'boost',
    },
  ]

  const total = milestones.reduce((sum, m) => sum + m.weight, 0)
  const earned = milestones.filter((m) => m.done).reduce((sum, m) => sum + m.weight, 0)
  const pct = total > 0 ? Math.round((100 * earned) / total) : 0
  const incomplete = milestones.filter((m) => !m.done)
  const nextCore = incomplete.find((m) => m.tier === 'core')
  const next =
    nextCore
    || [...incomplete].sort((a, b) => b.weight - a.weight)[0]
    || null

  return {
    pct,
    earned,
    total,
    milestones,
    next,
    doneCount: milestones.filter((m) => m.done).length,
    taskCount: milestones.length,
  }
}

/** Short-form tip always provisions a form hero → treat as baked unless overridden. */
export function shortFormHasBakedHeroDefault(): boolean {
  return true
}

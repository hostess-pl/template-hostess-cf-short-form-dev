import type { ReactNode } from 'react'
import { useId, useState } from 'react'
import { AssetPicker } from '@/components/edit/AssetPicker'
import type { CmsChromeStrings, ContentLocale, CopyFields } from '@/lib/cms/i18n'
import {
  getCopyFieldPlaceholder,
  getCopyFieldsRaw,
  setCopyForLocale,
} from '@/lib/cms/i18n'
import { HIDDEN_DOC_KEYS, type CmsSectionId } from '@/lib/cms/nav'
import {
  filenameFromMediaUrl,
  normalizePickedMediaValue,
  resolveMediaPreviewUrl,
} from '@/lib/cms/mediaResolve'
import { isVideoUrl } from '@/lib/cms/media'

type Props = {
  section: CmsSectionId
  document: Record<string, unknown>
  contentLocale: ContentLocale
  contentLocales: ContentLocale[]
  onContentLocaleChange: (locale: ContentLocale) => void
  t: CmsChromeStrings
  onChange: (next: Record<string, unknown>) => void
}

function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-[var(--cms-muted)]">
        {label}
      </span>
      {children}
    </label>
  )
}

/** Checkbox must not wrap list-card actions; use explicit htmlFor to avoid focus stealing. */
function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (next: boolean) => void
}) {
  const id = useId()
  return (
    <div className="flex items-center gap-2 pt-1">
      <input
        id={id}
        type="checkbox"
        className="cms-checkbox h-4 w-4 shrink-0 rounded border-[var(--cms-border)]"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        onClick={(e) => e.stopPropagation()}
      />
      <label htmlFor={id} className="text-sm text-[var(--cms-ink)]">
        {label}
      </label>
    </div>
  )
}

function TextInput({
  value,
  onChange,
  multiline,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  multiline?: boolean
  placeholder?: string
}) {
  if (multiline) {
    return (
      <textarea
        value={value}
        rows={4}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="cms-input"
      />
    )
  }
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="cms-input"
    />
  )
}

function ContentLocaleToolbar({
  contentLocale,
  contentLocales,
  onContentLocaleChange,
  t,
}: {
  contentLocale: ContentLocale
  contentLocales: ContentLocale[]
  onContentLocaleChange: (locale: ContentLocale) => void
  t: CmsChromeStrings
}) {
  if (contentLocales.length <= 1) {
    return (
      <p className="text-xs text-[var(--cms-muted)]">
        {t.contentLang}: {contentLocale.toUpperCase()}
      </p>
    )
  }
  return (
    <label className="mb-2 flex items-center gap-2 text-xs text-[var(--cms-muted)]">
      {t.contentLang}
      <select
        className="cms-input !w-auto !py-1"
        value={contentLocale}
        onChange={(e) => onContentLocaleChange(e.target.value as ContentLocale)}
      >
        {contentLocales.map((loc) => (
          <option key={loc} value={loc}>
            {loc.toUpperCase()}
          </option>
        ))}
      </select>
    </label>
  )
}

function MediaEditor({
  value,
  field,
  t,
  onChange,
}: {
  value: string
  field: 'imageFile' | 'videoFile'
  t: CmsChromeStrings
  onChange: (v: string) => void
}) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [showUrl, setShowUrl] = useState(false)
  const kind = field === 'videoFile' ? 'video' : 'image'
  const preview = resolveMediaPreviewUrl(value, kind)
  const video = kind === 'video' || isVideoUrl(preview)

  return (
    <div className="space-y-2">
      {preview ? (
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--cms-line)] bg-[var(--cms-bg)]">
          {video ? (
            <video src={preview} className="max-h-40 w-full object-contain" controls preload="metadata" />
          ) : (
            <img src={preview} alt="" className="max-h-40 w-auto object-contain" />
          )}
        </div>
      ) : (
        <div className="cms-panel flex h-28 items-center justify-center text-xs text-[var(--cms-muted)]">
          {t.noAsset}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="button" className="cms-btn cms-btn-primary" onClick={() => setPickerOpen(true)}>
          {t.chooseAsset}
        </button>
        {value ? (
          <button type="button" className="cms-btn cms-btn-ghost" onClick={() => onChange('')}>
            {t.clear}
          </button>
        ) : null}
        <button type="button" className="cms-btn cms-btn-ghost" onClick={() => setShowUrl((p) => !p)}>
          {showUrl ? t.hideUrl : t.pasteUrl}
        </button>
      </div>
      {showUrl ? (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="cms-input"
          placeholder={t.mediaUrlPlaceholder}
        />
      ) : null}
      <AssetPicker
        open={pickerOpen}
        accept={kind}
        t={t}
        onClose={() => setPickerOpen(false)}
        onSelect={(url) => onChange(normalizePickedMediaValue(url, field) || filenameFromMediaUrl(url))}
      />
    </div>
  )
}

function moveItem<T>(list: T[], index: number, dir: -1 | 1): T[] {
  const next = index + dir
  if (next < 0 || next >= list.length) return list
  const copy = [...list]
  const tmp = copy[index]
  copy[index] = copy[next]
  copy[next] = tmp
  return copy
}

function ListCard({
  title,
  t,
  index,
  total,
  onRemove,
  onMove,
  children,
}: {
  title: string
  t: CmsChromeStrings
  index: number
  total: number
  onRemove: () => void
  onMove: (dir: -1 | 1) => void
  children: ReactNode
}) {
  return (
    <div className="cms-panel space-y-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-display text-sm font-semibold text-[var(--cms-ink)]">{title}</p>
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            className="cms-btn cms-btn-ghost"
            disabled={index === 0}
            onClick={() => onMove(-1)}
          >
            {t.reorderUp}
          </button>
          <button
            type="button"
            className="cms-btn cms-btn-ghost"
            disabled={index >= total - 1}
            onClick={() => onMove(1)}
          >
            {t.reorderDown}
          </button>
          <button
            type="button"
            className="cms-btn cms-btn-ghost text-[var(--cms-danger)]"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onRemove()
            }}
          >
            {t.remove}
          </button>
        </div>
      </div>
      {children}
    </div>
  )
}

function patchProfile(
  doc: Record<string, unknown>,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  const profile = { ...((doc.profile as Record<string, unknown>) || {}), ...patch }
  return { ...doc, profile }
}

function copyEditorHelpers(
  document: Record<string, unknown>,
  contentLocale: ContentLocale,
  onChange: (next: Record<string, unknown>) => void,
) {
  const displayName = String(
    (document.profile as Record<string, unknown> | undefined)?.displayName || '',
  ).trim()
  const raw = getCopyFieldsRaw(document, contentLocale)
  const patch = (fields: Partial<CopyFields>) => {
    onChange(setCopyForLocale(document, contentLocale, { ...raw, ...fields }))
  }
  const ph = (key: keyof CopyFields, fallback: string) =>
    getCopyFieldPlaceholder(contentLocale, key, displayName) || fallback
  return { raw, patch, ph }
}

export function SectionEditor({
  section,
  document,
  contentLocale,
  contentLocales,
  onContentLocaleChange,
  t,
  onChange,
}: Props) {
  const localeBar = (
    <ContentLocaleToolbar
      contentLocale={contentLocale}
      contentLocales={contentLocales}
      onContentLocaleChange={onContentLocaleChange}
      t={t}
    />
  )

  if (section === 'hero') {
    const { raw, patch, ph } = copyEditorHelpers(document, contentLocale, onChange)
    const assets = (document.assets as Record<string, unknown> | undefined) || {}
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        {localeBar}
        <Field label={t.fieldHeroPhoto || t.fieldPhoto}>
          <MediaEditor
            field="imageFile"
            t={t}
            value={String(assets.hero || '')}
            onChange={(hero) =>
              onChange({
                ...document,
                assets: { ...assets, hero },
              })
            }
          />
        </Field>
        <Field label={t.fieldHeadline}>
          <TextInput
            placeholder={ph('headline', t.phHeadline)}
            value={raw.headline || ''}
            onChange={(headline) => patch({ headline })}
          />
        </Field>
        <Field label={t.fieldGreeting}>
          <TextInput
            placeholder={ph('greeting', t.phGreeting)}
            value={raw.greeting || ''}
            onChange={(greeting) => patch({ greeting })}
          />
        </Field>
        <Field label={t.fieldProfileHero}>
          <TextInput
            multiline
            placeholder={ph('profile', t.phProfileHero)}
            value={raw.profile || ''}
            onChange={(profile) => patch({ profile })}
          />
        </Field>
      </div>
    )
  }

  if (section === 'about') {
    const { raw, patch, ph } = copyEditorHelpers(document, contentLocale, onChange)
    const education = (document.education as Record<string, unknown>) || {}
    const entries = Array.isArray(education.entries) ? [...(education.entries as Record<string, unknown>[])] : []
    const languages = Array.isArray(document.languages)
      ? [...(document.languages as Record<string, unknown>[])]
      : []
    const traits = Array.isArray(document.traits) ? [...(document.traits as string[])] : []
    const skills = Array.isArray(document.skills) ? [...(document.skills as string[])] : []
    const appearance = (document.appearance as Record<string, unknown>) || {}
    const appearanceLabels = {
      height: t.fieldHeight,
      dressSize: t.fieldDressSize,
      hairColor: t.fieldHairColor,
      eyeColor: t.fieldEyeColor,
    } as const

    return (
      <div className="mx-auto max-w-2xl space-y-8">
        {localeBar}
        <section className="space-y-4">
          <h3 className="font-display text-lg font-semibold text-[var(--cms-ink)]">
            {t.subsectionSectionLabels}
          </h3>
          <Field label={t.fieldAboutLabel}>
            <TextInput
              placeholder={ph('aboutLabel', t.phAboutLabel)}
              value={raw.aboutLabel || ''}
              onChange={(aboutLabel) => patch({ aboutLabel })}
            />
          </Field>
          <Field label={t.fieldAboutTitle}>
            <TextInput
              placeholder={ph('aboutTitle', t.phAboutTitle)}
              value={raw.aboutTitle || ''}
              onChange={(aboutTitle) => patch({ aboutTitle })}
            />
          </Field>
        </section>
        <section className="space-y-4">
          <h3 className="font-display text-lg font-semibold text-[var(--cms-ink)]">{t.subsectionAboutCopy}</h3>
          <Field label={t.fieldAboutLead}>
            <TextInput
              multiline
              placeholder={ph('aboutLead', t.phAboutLead)}
              value={raw.aboutLead || ''}
              onChange={(aboutLead) => patch({ aboutLead })}
            />
          </Field>
          <Field label={t.fieldMainText}>
            <TextInput
              multiline
              placeholder={ph('experienceSummary', t.phMainText)}
              value={raw.experienceSummary || ''}
              onChange={(experienceSummary) => patch({ experienceSummary })}
            />
          </Field>
        </section>

        <section className="space-y-3">
          <h3 className="font-display text-lg font-semibold text-[var(--cms-ink)]">{t.subsectionStudies}</h3>
          {entries.map((entry, index) => (
            <ListCard
              key={String(entry.id || index)}
              title={String(entry.field || entry.university || t.untitledEntry)}
              t={t}
              index={index}
              total={entries.length}
              onRemove={() => {
                const next = entries.filter((_, i) => i !== index)
                onChange({ ...document, education: { ...education, entries: next } })
              }}
              onMove={(dir) =>
                onChange({
                  ...document,
                  education: { ...education, entries: moveItem(entries, index, dir) },
                })
              }
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={t.fieldField}>
                  <TextInput
                    placeholder={t.phField}
                    value={String(entry.field || '')}
                    onChange={(field) => {
                      const next = [...entries]
                      next[index] = { ...entry, field }
                      onChange({ ...document, education: { ...education, entries: next } })
                    }}
                  />
                </Field>
                <Field label={t.fieldUniversity}>
                  <TextInput
                    placeholder={t.phUniversity}
                    value={String(entry.university || '')}
                    onChange={(university) => {
                      const next = [...entries]
                      next[index] = { ...entry, university }
                      onChange({ ...document, education: { ...education, entries: next } })
                    }}
                  />
                </Field>
                <Field label={t.fieldStart}>
                  <TextInput
                    placeholder={t.phStart}
                    value={String(entry.startDate || '')}
                    onChange={(startDate) => {
                      const next = [...entries]
                      next[index] = { ...entry, startDate }
                      onChange({ ...document, education: { ...education, entries: next } })
                    }}
                  />
                </Field>
                <Field label={t.fieldEnd}>
                  <TextInput
                    placeholder={t.phEnd}
                    value={String(entry.endDate || '')}
                    onChange={(endDate) => {
                      const next = [...entries]
                      next[index] = { ...entry, endDate }
                      onChange({ ...document, education: { ...education, entries: next } })
                    }}
                  />
                </Field>
              </div>
              <CheckboxField
                label={t.fieldOngoing}
                checked={Boolean(entry.isOngoing)}
                onChange={(isOngoing) => {
                  const next = [...entries]
                  next[index] = { ...entry, isOngoing }
                  onChange({ ...document, education: { ...education, entries: next } })
                }}
              />
            </ListCard>
          ))}
          <button
            type="button"
            className="cms-btn cms-btn-ghost"
            onClick={() =>
              onChange({
                ...document,
                education: {
                  ...education,
                  entries: [
                    ...entries,
                    {
                      id: `edu-${Date.now()}`,
                      field: '',
                      university: '',
                      startDate: '',
                      endDate: '',
                      isOngoing: false,
                    },
                  ],
                },
              })
            }
          >
            {t.addItem}
          </button>
        </section>

        <section className="space-y-3">
          <h3 className="font-display text-lg font-semibold text-[var(--cms-ink)]">{t.subsectionLanguages}</h3>
          {languages.map((lang, index) => (
            <ListCard
              key={`language-${index}`}
              title={String(lang.name || t.untitledEntry)}
              t={t}
              index={index}
              total={languages.length}
              onRemove={() =>
                onChange({ ...document, languages: languages.filter((_, i) => i !== index) })
              }
              onMove={(dir) => onChange({ ...document, languages: moveItem(languages, index, dir) })}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={t.fieldName}>
                  <TextInput
                    placeholder={t.phName}
                    value={String(lang.name || '')}
                    onChange={(name) => {
                      const next = [...languages]
                      next[index] = { ...lang, name }
                      onChange({ ...document, languages: next })
                    }}
                  />
                </Field>
                <Field label={t.fieldLevel}>
                  <TextInput
                    placeholder={t.phLevel}
                    value={String(lang.level || '')}
                    onChange={(level) => {
                      const next = [...languages]
                      next[index] = { ...lang, level }
                      onChange({ ...document, languages: next })
                    }}
                  />
                </Field>
              </div>
            </ListCard>
          ))}
          <button
            type="button"
            className="cms-btn cms-btn-ghost"
            onClick={() =>
              onChange({ ...document, languages: [...languages, { name: '', level: '' }] })
            }
          >
            {t.addItem}
          </button>
        </section>

        <section className="space-y-3">
          <h3 className="font-display text-lg font-semibold text-[var(--cms-ink)]">{t.subsectionTraits}</h3>
          <Field label={t.fieldTraits}>
            <TextInput
              placeholder={t.phTraits}
              value={traits.join(', ')}
              onChange={(v) =>
                onChange({
                  ...document,
                  traits: v
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
            />
          </Field>
          <Field label={t.fieldSkills}>
            <TextInput
              placeholder={t.phSkills}
              value={skills.join(', ')}
              onChange={(v) =>
                onChange({
                  ...document,
                  skills: v
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
            />
          </Field>
          <Field label={t.fieldLanguageCompetencies}>
            <TextInput
              placeholder={t.fieldLanguageCompetencies}
              value={(Array.isArray(document.languageCompetencies)
                ? (document.languageCompetencies as string[])
                : []
              ).join(', ')}
              onChange={(v) =>
                onChange({
                  ...document,
                  languageCompetencies: v
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
            />
          </Field>
        </section>

        <section className="space-y-3">
          <h3 className="font-display text-lg font-semibold text-[var(--cms-ink)]">{t.subsectionPhysical}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {(['height', 'dressSize', 'hairColor', 'eyeColor'] as const).map((key) => (
              <Field key={key} label={appearanceLabels[key]}>
                <TextInput
                  placeholder={
                    key === 'height'
                      ? t.phHeight
                      : key === 'dressSize'
                        ? t.phDressSize
                        : key === 'hairColor'
                          ? t.phHairColor
                          : t.phEyeColor
                  }
                  value={String(appearance[key] || '')}
                  onChange={(v) =>
                    onChange({ ...document, appearance: { ...appearance, [key]: v } })
                  }
                />
              </Field>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="font-display text-lg font-semibold text-[var(--cms-ink)]">{t.subsectionMobility}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <CheckboxField
              label={t.fieldDrivingLicense}
              checked={
                String(((document.mobility as Record<string, unknown>) || {}).drivingLicense || '')
                  .trim()
                  .toLowerCase() === 'yes'
              }
              onChange={(hasLicense) =>
                onChange({
                  ...document,
                  mobility: {
                    ...((document.mobility as Record<string, unknown>) || {}),
                    drivingLicense: hasLicense ? 'yes' : '',
                    hasCar: Boolean(((document.mobility as Record<string, unknown>) || {}).hasCar),
                  },
                })
              }
            />
            <CheckboxField
              label={t.fieldHasCar}
              checked={Boolean(((document.mobility as Record<string, unknown>) || {}).hasCar)}
              onChange={(hasCar) =>
                onChange({
                  ...document,
                  mobility: {
                    ...((document.mobility as Record<string, unknown>) || {}),
                    drivingLicense: String(
                      ((document.mobility as Record<string, unknown>) || {}).drivingLicense || '',
                    ),
                    hasCar,
                  },
                })
              }
            />
          </div>
        </section>
      </div>
    )
  }

  if (section === 'experience') {
    const { raw, patch, ph } = copyEditorHelpers(document, contentLocale, onChange)
    const experience = (document.experience as Record<string, unknown>) || {}
    const employment = Array.isArray(document.employment)
      ? [...(document.employment as Record<string, unknown>[])]
      : []
    const jobLabels = {
      title: t.fieldTitle,
      company: t.fieldCompany,
      startDate: t.fieldStart,
      endDate: t.fieldEnd,
    } as const
    return (
      <div className="mx-auto max-w-2xl space-y-8">
        {localeBar}
        <section className="space-y-4">
          <h3 className="font-display text-lg font-semibold text-[var(--cms-ink)]">
            {t.subsectionSectionLabels}
          </h3>
          <Field label={t.fieldExperienceLabel}>
            <TextInput
              placeholder={ph('experienceLabel', t.phExperienceLabel)}
              value={raw.experienceLabel || ''}
              onChange={(experienceLabel) => patch({ experienceLabel })}
            />
          </Field>
          <Field label={t.fieldExperienceTitle}>
            <TextInput
              placeholder={ph('experienceTitle', t.phExperienceTitle)}
              value={raw.experienceTitle || ''}
              onChange={(experienceTitle) => patch({ experienceTitle })}
            />
          </Field>
        </section>
        <section className="space-y-3">
          <h3 className="font-display text-lg font-semibold text-[var(--cms-ink)]">
            {t.subsectionExperienceMeta}
          </h3>
          <Field label={t.fieldSince}>
            <TextInput
              placeholder={t.phSince}
              value={String(experience.since || '')}
              onChange={(since) => onChange({ ...document, experience: { ...experience, since } })}
            />
          </Field>
          <Field label={t.fieldBrands}>
            <TextInput
              multiline
              placeholder={t.phBrands}
              value={String(experience.brands || '')}
              onChange={(brands) => onChange({ ...document, experience: { ...experience, brands } })}
            />
          </Field>
          <Field label={t.fieldEventTypes}>
            <TextInput
              multiline
              placeholder={t.phEventTypes}
              value={String(experience.eventTypes || '')}
              onChange={(eventTypes) =>
                onChange({ ...document, experience: { ...experience, eventTypes } })
              }
            />
          </Field>
        </section>
        <section className="space-y-3">
          <h3 className="font-display text-lg font-semibold text-[var(--cms-ink)]">
            {t.subsectionEmployment}
          </h3>
          {employment.map((job, index) => (
            <ListCard
              key={String(job.id || index)}
              title={String(job.title || job.company || t.untitledEntry)}
              t={t}
              index={index}
              total={employment.length}
              onRemove={() =>
                onChange({ ...document, employment: employment.filter((_, i) => i !== index) })
              }
              onMove={(dir) => onChange({ ...document, employment: moveItem(employment, index, dir) })}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {(['title', 'company', 'startDate', 'endDate'] as const).map((key) => (
                  <Field key={key} label={jobLabels[key]}>
                    <TextInput
                      placeholder={
                        key === 'title'
                          ? t.phTitle
                          : key === 'company'
                            ? t.phCompany
                            : key === 'startDate'
                              ? t.phStart
                              : t.phEnd
                      }
                      value={String(job[key] || '')}
                      onChange={(v) => {
                        const next = [...employment]
                        next[index] = { ...job, [key]: v }
                        onChange({ ...document, employment: next })
                      }}
                    />
                  </Field>
                ))}
              </div>
              <Field label={t.fieldDescription}>
                <TextInput
                  multiline
                  placeholder={t.phDescription}
                  value={String(job.description || '')}
                  onChange={(description) => {
                    const next = [...employment]
                    next[index] = { ...job, description }
                    onChange({ ...document, employment: next })
                  }}
                />
              </Field>
              <CheckboxField
                label={t.fieldOngoing}
                checked={Boolean(job.isOngoing)}
                onChange={(isOngoing) => {
                  const next = [...employment]
                  next[index] = { ...job, isOngoing }
                  onChange({ ...document, employment: next })
                }}
              />
            </ListCard>
          ))}
          <button
            type="button"
            className="cms-btn cms-btn-ghost"
            onClick={() =>
              onChange({
                ...document,
                employment: [
                  ...employment,
                  {
                    id: `job-${Date.now()}`,
                    title: '',
                    company: '',
                    startDate: '',
                    endDate: '',
                    description: '',
                    isOngoing: false,
                  },
                ],
              })
            }
          >
            {t.addItem}
          </button>
        </section>
      </div>
    )
  }

  if (section === 'gallery') {
    const { raw, patch, ph } = copyEditorHelpers(document, contentLocale, onChange)
    const events = Array.isArray(document.events)
      ? [...(document.events as Record<string, unknown>[])]
      : []
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        {localeBar}
        <section className="space-y-4">
          <h3 className="font-display text-lg font-semibold text-[var(--cms-ink)]">
            {t.subsectionSectionLabels}
          </h3>
          <Field label={t.fieldGalleryLabel}>
            <TextInput
              placeholder={ph('galleryLabel', t.phGalleryLabel)}
              value={raw.galleryLabel || ''}
              onChange={(galleryLabel) => patch({ galleryLabel })}
            />
          </Field>
          <Field label={t.fieldGalleryTitle}>
            <TextInput
              placeholder={ph('galleryTitle', t.phGalleryTitle)}
              value={raw.galleryTitle || ''}
              onChange={(galleryTitle) => patch({ galleryTitle })}
            />
          </Field>
        </section>
        {events.map((event, index) => (
          <ListCard
            key={String(event.id || index)}
            title={
              [String(event.title || t.untitledEvent), String(event.date || '')]
                .filter(Boolean)
                .join(' — ')
            }
            t={t}
            index={index}
            total={events.length}
            onRemove={() => onChange({ ...document, events: events.filter((_, i) => i !== index) })}
            onMove={(dir) => onChange({ ...document, events: moveItem(events, index, dir) })}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t.fieldTitle}>
                <TextInput
                  placeholder={t.phTitle}
                  value={String(event.title || '')}
                  onChange={(title) => {
                    const next = [...events]
                    next[index] = { ...event, title }
                    onChange({ ...document, events: next })
                  }}
                />
              </Field>
              <Field label={t.fieldDate}>
                <TextInput
                  placeholder={t.phDate}
                  value={String(event.date || '')}
                  onChange={(date) => {
                    const next = [...events]
                    next[index] = { ...event, date }
                    onChange({ ...document, events: next })
                  }}
                />
              </Field>
              <Field label={t.fieldBrand}>
                <TextInput
                  placeholder={t.phBrand}
                  value={String(event.brand || '')}
                  onChange={(brand) => {
                    const next = [...events]
                    next[index] = { ...event, brand }
                    onChange({ ...document, events: next })
                  }}
                />
              </Field>
            </div>
            <Field label={t.fieldDescription}>
              <TextInput
                multiline
                placeholder={t.phDescription}
                value={String(event.description || '')}
                onChange={(description) => {
                  const next = [...events]
                  next[index] = { ...event, description }
                  onChange({ ...document, events: next })
                }}
              />
            </Field>
            <Field label={t.fieldPhoto}>
              <MediaEditor
                field="imageFile"
                t={t}
                value={String(event.imageFile || '')}
                onChange={(imageFile) => {
                  const next = [...events]
                  next[index] = { ...event, imageFile }
                  onChange({ ...document, events: next })
                }}
              />
            </Field>
            <Field label={t.fieldExtraPhotos}>
              <div className="space-y-3">
                {(Array.isArray(event.imageFiles) ? event.imageFiles : []).map(
                  (extra: string, extraIndex: number) => (
                    <div key={`extra-${index}-${extraIndex}`} className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <MediaEditor
                          field="imageFile"
                          t={t}
                          value={String(extra || '')}
                          onChange={(value) => {
                            const extras = [...(Array.isArray(event.imageFiles) ? event.imageFiles : [])]
                            extras[extraIndex] = value
                            const next = [...events]
                            next[index] = { ...event, imageFiles: extras.filter(Boolean) }
                            onChange({ ...document, events: next })
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        className="cms-btn cms-btn-ghost shrink-0"
                        onClick={() => {
                          const extras = [...(Array.isArray(event.imageFiles) ? event.imageFiles : [])]
                          extras.splice(extraIndex, 1)
                          const next = [...events]
                          next[index] = { ...event, imageFiles: extras }
                          onChange({ ...document, events: next })
                        }}
                      >
                        {t.remove}
                      </button>
                    </div>
                  ),
                )}
                {(Array.isArray(event.imageFiles) ? event.imageFiles : []).length < 8 ? (
                  <button
                    type="button"
                    className="cms-btn cms-btn-ghost"
                    onClick={() => {
                      const extras = [...(Array.isArray(event.imageFiles) ? event.imageFiles : []), '']
                      const next = [...events]
                      next[index] = { ...event, imageFiles: extras }
                      onChange({ ...document, events: next })
                    }}
                  >
                    {t.fieldAddExtraPhoto}
                  </button>
                ) : null}
              </div>
            </Field>
            <Field label={t.fieldVideoOptional}>
              <MediaEditor
                field="videoFile"
                t={t}
                value={String(event.videoFile || '')}
                onChange={(videoFile) => {
                  const next = [...events]
                  next[index] = { ...event, videoFile: videoFile || undefined }
                  onChange({ ...document, events: next })
                }}
              />
            </Field>
          </ListCard>
        ))}
        <button
          type="button"
          className="cms-btn cms-btn-ghost"
          onClick={() =>
            onChange({
              ...document,
              events: [
                ...events,
                {
                  id: `event-${events.length + 1}`,
                  title: '',
                  description: '',
                  date: '',
                  imageFile: '', // set after upload — never default to demo event-1.jpg
                  brand: '',
                },
              ],
            })
          }
        >
          {t.addItem}
        </button>
      </div>
    )
  }

  if (section === 'profile') {
    const profile = (document.profile as Record<string, unknown>) || {}
    const socials = (profile.socials as Record<string, unknown>) || {}
    const profileLabels = {
      displayName: t.fieldDisplayName,
      legalName: t.fieldLegalName,
      email: t.fieldEmail,
      phone: t.fieldPhone,
      location: t.fieldLocation,
      professionalStatus: t.fieldProfessionalStatus,
    } as const
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        {localeBar}
        {(['displayName', 'legalName', 'email', 'phone', 'location', 'professionalStatus'] as const).map(
          (key) => (
            <Field key={key} label={profileLabels[key]}>
              <TextInput
                placeholder={
                  key === 'displayName'
                    ? t.phDisplayName
                    : key === 'legalName'
                      ? t.phLegalName
                      : key === 'email'
                        ? t.phEmail
                        : key === 'phone'
                          ? t.phPhone
                          : key === 'location'
                            ? t.phLocation
                            : t.phProfessionalStatus
                }
                value={String(profile[key] || '')}
                onChange={(v) => onChange(patchProfile(document, { [key]: v }))}
              />
            </Field>
          ),
        )}
        <Field label={t.fieldWorkCities}>
          <TextInput
            placeholder={t.phWorkCities}
            value={Array.isArray(profile.workCities) ? (profile.workCities as string[]).join(', ') : ''}
            onChange={(v) =>
              onChange(
                patchProfile(document, {
                  workCities: v
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                }),
              )
            }
          />
        </Field>
        <h3 className="font-display text-lg font-semibold text-[var(--cms-ink)]">{t.socialsHeading}</h3>
        {(['instagram', 'tiktok', 'linkedin', 'facebook'] as const).map((key) => (
          <Field key={key} label={key}>
            <TextInput
              placeholder={
                key === 'instagram'
                  ? t.phInstagram
                  : key === 'tiktok'
                    ? t.phTiktok
                    : key === 'linkedin'
                      ? t.phLinkedin
                      : t.phFacebook
              }
              value={String(socials[key] || '')}
              onChange={(v) =>
                onChange(patchProfile(document, { socials: { ...socials, [key]: v } }))
              }
            />
          </Field>
        ))}
      </div>
    )
  }

  if (section === 'contact') {
    const { raw, patch, ph } = copyEditorHelpers(document, contentLocale, onChange)
    const profile = (document.profile as Record<string, unknown>) || {}
    const contactLabels = {
      email: t.fieldEmail,
      phone: t.fieldPhone,
      location: t.fieldLocation,
    } as const
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        {localeBar}
        <section className="space-y-4">
          <h3 className="font-display text-lg font-semibold text-[var(--cms-ink)]">
            {t.subsectionSectionLabels}
          </h3>
          <Field label={t.fieldContactLabel}>
            <TextInput
              placeholder={ph('contactLabel', t.phContactLabel)}
              value={raw.contactLabel || ''}
              onChange={(contactLabel) => patch({ contactLabel })}
            />
          </Field>
          <Field label={t.fieldContactTitle}>
            <TextInput
              placeholder={ph('contactTitle', t.phContactTitle)}
              value={raw.contactTitle || ''}
              onChange={(contactTitle) => patch({ contactTitle })}
            />
          </Field>
        </section>
        <p className="text-sm text-[var(--cms-muted)]">{t.contactHint}</p>
        {(['email', 'phone', 'location'] as const).map((key) => (
          <Field key={key} label={contactLabels[key]}>
            <TextInput
              placeholder={
                key === 'email' ? t.phEmail : key === 'phone' ? t.phPhone : t.phLocation
              }
              value={String(profile[key] || '')}
              onChange={(v) => onChange(patchProfile(document, { [key]: v }))}
            />
          </Field>
        ))}
      </div>
    )
  }

  const visible = Object.fromEntries(
    Object.entries(document).filter(([k]) => !HIDDEN_DOC_KEYS.has(k)),
  )
  return (
    <pre className="overflow-auto rounded-[var(--radius-lg)] bg-[var(--cms-bg-elevated)] p-3 text-xs text-[var(--cms-muted)]">
      {JSON.stringify(visible, null, 2)}
    </pre>
  )
}

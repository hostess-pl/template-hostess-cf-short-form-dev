import { z } from 'astro/zod';

export const localeSchema = z.enum(['en', 'pl', 'es']);

export const professionalStatusSchema = z.enum([
  'Student',
  'Pracuję na pełen etat',
  'Pracuję na część etatu',
  'Freelancer',
  'Prowadzę działalność gospodarczą',
  'Pracuję na umowę zlecenie',
  'Obecnie nie pracuję',
  'Inne',
]);

export const hostessEventSchema = z.object({
  id: z.string().min(1).max(80),
  title: z.string().max(200).default(''),
  description: z.string().max(2000).default(''),
  date: z.string().max(80).default(''),
  /** Cover photo — basename or absolute site-media / CMS URL. */
  imageFile: z.string().min(1).max(2000),
  /** Extra photos for the event lightbox slider (cover is imageFile). */
  imageFiles: z.array(z.string().max(2000)).max(8).optional().default([]),
  brand: z.string().max(120).optional(),
  titleByLocale: z
    .object({
      pl: z.string().max(200).optional().default(''),
      en: z.string().max(200).optional().default(''),
      es: z.string().max(200).optional().default(''),
    })
    .optional(),
  descriptionByLocale: z
    .object({
      pl: z.string().max(2000).optional().default(''),
      en: z.string().max(2000).optional().default(''),
      es: z.string().max(2000).optional().default(''),
    })
    .optional(),
  videoFile: z
    .string()
    .max(40)
    .regex(/^event-\d+\.(mp4|m4v|webm|mov)$/)
    .optional(),
});

export const hostessAssetsSchema = z
  .object({
    /** Basename (hero.jpg) or absolute public URL from site-media / Tally. */
    hero: z.string().max(2000).optional().default(''),
  })
  .optional()
  .default({ hero: '' });

export const educationEntrySchema = z.object({
  id: z.string().min(1).max(40),
  field: z.string().max(160).default(''),
  university: z.string().max(160).default(''),
  startDate: z.string().max(40).default(''),
  endDate: z.string().max(40).default(''),
  isOngoing: z.boolean().default(false),
});

export const employmentEntrySchema = z.object({
  id: z.string().min(1).max(40),
  title: z.string().min(1).max(120),
  company: z.string().max(120).default(''),
  startDate: z.string().max(40).default(''),
  endDate: z.string().max(40).default(''),
  date: z.string().max(80).default(''),
  description: z.string().max(500).default(''),
  isOngoing: z.boolean().default(false),
});

export const appearanceSchema = z.object({
  height: z.string().max(40).default(''),
  dressSize: z.string().max(40).default(''),
  hairColor: z.string().max(80).default(''),
  eyeColor: z.string().max(80).default(''),
});

export const mobilitySchema = z.object({
  drivingLicense: z.string().max(80).default(''),
  hasCar: z.boolean().default(false),
});

export const hostessSchema = z.object({
  submissionId: z.string().min(1).max(80),
  slug: z.string().min(1).max(80),
  contactRef: z.string().max(80).default(''),
  /** Short-form intake signal — preserved through tip Zod for GHA → GkEk callback. */
  intake: z.string().max(40).optional().default(''),
  /** Tally form id (e.g. rjRXoX / RGQDL9) — kept for mvp/lite deposit skip. */
  tallyFormId: z.string().max(40).optional().default(''),
  profile: z.object({
    displayName: z.string().min(1).max(120),
    legalName: z.string().min(1).max(160),
    email: z.string().email(),
    phone: z.string().max(40).default(''),
    location: z.string().min(1).max(160),
    workCities: z.array(z.string().min(1).max(80)).default([]),
    professionalStatus: z.string().max(80).default(''),
    socials: z.object({
      instagram: z.string().max(300).default(''),
      tiktok: z.string().max(300).default(''),
      linkedin: z.string().max(300).default(''),
      facebook: z.string().max(300).default(''),
    }),
  }),
  bio: z.object({
    short: z.string().min(1).max(2000),
  }),
  copy: z
    .object({
      headline: z.string().max(500).optional().default(''),
      greeting: z.string().max(500).optional().default(''),
      profile: z.string().max(2000).optional().default(''),
      aboutLead: z.string().max(2000).optional().default(''),
      experienceSummary: z.string().max(4000).optional().default(''),
      galleryLabel: z.string().max(120).optional().default(''),
      galleryTitle: z.string().max(200).optional().default(''),
      aboutLabel: z.string().max(120).optional().default(''),
      aboutTitle: z.string().max(200).optional().default(''),
      experienceLabel: z.string().max(120).optional().default(''),
      experienceTitle: z.string().max(200).optional().default(''),
      contactLabel: z.string().max(120).optional().default(''),
      contactTitle: z.string().max(200).optional().default(''),
    })
    .optional()
    .default({
      headline: '',
      greeting: '',
      profile: '',
      aboutLead: '',
      experienceSummary: '',
      galleryLabel: '',
      galleryTitle: '',
      aboutLabel: '',
      aboutTitle: '',
      experienceLabel: '',
      experienceTitle: '',
      contactLabel: '',
      contactTitle: '',
    }),
  copyByLocale: z
    .object({
      pl: z
        .object({
          headline: z.string().max(500).optional().default(''),
          greeting: z.string().max(500).optional().default(''),
          profile: z.string().max(2000).optional().default(''),
          aboutLead: z.string().max(2000).optional().default(''),
          experienceSummary: z.string().max(4000).optional().default(''),
          galleryLabel: z.string().max(120).optional().default(''),
          galleryTitle: z.string().max(200).optional().default(''),
          aboutLabel: z.string().max(120).optional().default(''),
          aboutTitle: z.string().max(200).optional().default(''),
          experienceLabel: z.string().max(120).optional().default(''),
          experienceTitle: z.string().max(200).optional().default(''),
          contactLabel: z.string().max(120).optional().default(''),
          contactTitle: z.string().max(200).optional().default(''),
        })
        .optional(),
      en: z
        .object({
          headline: z.string().max(500).optional().default(''),
          greeting: z.string().max(500).optional().default(''),
          profile: z.string().max(2000).optional().default(''),
          aboutLead: z.string().max(2000).optional().default(''),
          experienceSummary: z.string().max(4000).optional().default(''),
          galleryLabel: z.string().max(120).optional().default(''),
          galleryTitle: z.string().max(200).optional().default(''),
          aboutLabel: z.string().max(120).optional().default(''),
          aboutTitle: z.string().max(200).optional().default(''),
          experienceLabel: z.string().max(120).optional().default(''),
          experienceTitle: z.string().max(200).optional().default(''),
          contactLabel: z.string().max(120).optional().default(''),
          contactTitle: z.string().max(200).optional().default(''),
        })
        .optional(),
      es: z
        .object({
          headline: z.string().max(500).optional().default(''),
          greeting: z.string().max(500).optional().default(''),
          profile: z.string().max(2000).optional().default(''),
          aboutLead: z.string().max(2000).optional().default(''),
          experienceSummary: z.string().max(4000).optional().default(''),
          galleryLabel: z.string().max(120).optional().default(''),
          galleryTitle: z.string().max(200).optional().default(''),
          aboutLabel: z.string().max(120).optional().default(''),
          aboutTitle: z.string().max(200).optional().default(''),
          experienceLabel: z.string().max(120).optional().default(''),
          experienceTitle: z.string().max(200).optional().default(''),
          contactLabel: z.string().max(120).optional().default(''),
          contactTitle: z.string().max(200).optional().default(''),
        })
        .optional(),
    })
    .optional(),
  locales: z.array(localeSchema).min(1),
  languages: z.array(
    z.object({
      name: z.string().min(1).max(80),
      level: z.string().min(1).max(40),
    }),
  ),
  languagesByLocale: z
    .object({
      pl: z.array(z.object({ name: z.string().max(80).default(''), level: z.string().max(40).default('') })).optional(),
      en: z.array(z.object({ name: z.string().max(80).default(''), level: z.string().max(40).default('') })).optional(),
      es: z.array(z.object({ name: z.string().max(80).default(''), level: z.string().max(40).default('') })).optional(),
    })
    .optional(),
  appearanceTextByLocale: z
    .object({
      pl: z.object({ hairColor: z.string().max(80).optional().default(''), eyeColor: z.string().max(80).optional().default('') }).optional(),
      en: z.object({ hairColor: z.string().max(80).optional().default(''), eyeColor: z.string().max(80).optional().default('') }).optional(),
      es: z.object({ hairColor: z.string().max(80).optional().default(''), eyeColor: z.string().max(80).optional().default('') }).optional(),
    })
    .optional(),
  languageCompetencies: z.array(z.string().min(1).max(120)).default([]),
  skills: z.array(z.string().min(1).max(120)).default([]),
  traits: z.array(z.string().min(1).max(120)).default([]),
  appearance: appearanceSchema.default({
    height: '',
    dressSize: '',
    hairColor: '',
    eyeColor: '',
  }),
  mobility: mobilitySchema.default({
    drivingLicense: '',
    hasCar: false,
  }),
  employment: z.array(employmentEntrySchema).default([]),
  events: z.array(hostessEventSchema).max(50).default([]),
  assets: hostessAssetsSchema,
  experience: z.object({
    since: z.string().max(40).default(''),
    brands: z.string().max(500).default(''),
    eventTypes: z.string().max(500).default(''),
  }),
  education: z
    .object({
      entries: z.array(educationEntrySchema).default([]),
      university: z.string().max(160).default(''),
      field: z.string().max(160).default(''),
      isStudent: z.boolean().default(false),
    })
    .default({ entries: [], university: '', field: '', isStudent: false }),
  branding: z.object({
    palette: z.string().max(80).default(''),
    style: z.string().max(120).default(''),
    font: z.string().max(80).default(''),
    themeColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#C4A46B'),
    backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#FDFAF6'),
    templateKey: z.enum(['minimal', 'modern', 'elegant', 'luxury']).default('minimal'),
    templateRepo: z.string().max(80).default('template-hostess-cf'),
  }),
  domain: z.object({
    mode: z.string().max(80).default(''),
    address: z.string().max(120).default(''),
    desiredName: z.string().max(120).default(''),
    extension: z.string().max(20).default(''),
  }),
  extras: z
    .object({
      englishVersion: z.boolean().default(false),
      spanishVersion: z.boolean().default(false),
      eventVideos: z.boolean().default(false),
    })
    .default({ englishVersion: false, spanishVersion: false, eventVideos: false }),
  analytics: z.object({
    siteId: z.string().min(1).max(80),
    subprojectId: z.string().min(1).max(80).default('hostesswebs'),
  }),
});

export type HostessData = z.infer<typeof hostessSchema>;
export type HostessLocale = z.infer<typeof localeSchema>;

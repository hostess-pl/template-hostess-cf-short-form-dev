import type { ImageMetadata } from 'astro';
import type { Locale } from './site.config';
import { publicCopyForLocale } from '@/lib/cms/i18n';
import { loadHostess } from '@/lib/hostess';

let _bundleRef: ReturnType<typeof loadHostess> | null = null
let _bundle: ReturnType<typeof buildContentBundle> | null = null

const imageModules = import.meta.glob<{ default: ImageMetadata }>('../assets/images/*', {
  eager: true,
});

function resolveImage(fileName: string): ImageMetadata {
  const match = Object.entries(imageModules).find(([path]) => path.endsWith(`/${fileName}`));
  if (match) return match[1].default;
  const hero = Object.entries(imageModules).find(([path]) => path.endsWith('/hero.jpg'));
  if (hero) {
    console.warn(`[content] Missing image asset: ${fileName}; falling back to hero.jpg`);
    return hero[1].default;
  }
  throw new Error(`Missing image asset: ${fileName}`);
}

/** Local baked asset or remote/CMS URL. Never falls back to hero for events. */
export type EventImage =
  | { kind: 'local'; meta: ImageMetadata }
  | { kind: 'remote'; src: string };

/** Same shape as EventImage — hero may come from CMS assets.hero (URL) or bake. */
export type HeroImage = EventImage;

function resolveEventImage(value: string): EventImage {
  const raw = String(value || '').trim();
  if (!raw) {
    return { kind: 'remote', src: '' };
  }
  if (/^https?:\/\//i.test(raw) || raw.startsWith('/')) {
    return { kind: 'remote', src: raw };
  }
  const match = Object.entries(imageModules).find(([path]) => path.endsWith(`/${raw}`));
  if (match) return { kind: 'local', meta: match[1].default };
  return { kind: 'remote', src: `/cms-assets/${raw.replace(/^\/+/, '')}` };
}

/** Prefer CMS/hostess assets.hero; fall back to baked hero.jpg. */
function resolveHeroImage(hostess: ReturnType<typeof loadHostess>): HeroImage {
  const raw = String((hostess as { assets?: { hero?: string } })?.assets?.hero || '').trim();
  if (raw && raw !== 'hero.jpg') {
    return resolveEventImage(raw);
  }
  if (raw === 'hero.jpg') {
    return { kind: 'local', meta: resolveImage('hero.jpg') };
  }
  return { kind: 'local', meta: resolveImage('hero.jpg') };
}


export type AppearanceFactIcon = 'height' | 'dress' | 'hair' | 'eyes' | 'license' | 'car';

export interface AppearanceFact {
  id: string;
  icon: AppearanceFactIcon;
  label: Record<Locale, string>;
  value: Record<Locale, string>;
}

export interface FeaturedEvent {
  id: string;
  image: EventImage;
  /** Cover + extras for lightbox (image is always images[0]). */
  images: EventImage[];
  video?: string | null;
  date: string;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
  alt: Record<Locale, string>;
}

export interface TimelineEntry {
  id: string;
  date: Record<Locale, string>;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
}

export interface PortfolioContent {
  nav: Record<Locale, { work: string; about: string; experience: string; services: string; contact: string; book: string }>;
  hero: Record<
    Locale,
    {
      eyebrow: string;
      headlineLead: string;
      headlineEmphasis: string;
      bioIntro: string;
      bioBody: string;
      availability: string;
      cta: string;
      ctaSecondary: string;
    }
  >;
  stats: Record<Locale, { label: string; value: string }[]>;
  languagesLabel: Record<Locale, string>;
  languages: Record<Locale, { name: string; level: string }[]>;
  about: Record<
    Locale,
    {
      label: string;
      titleLead: string;
      titleEmphasis: string;
      lead: string;
      body: string;
      education: {
        label: string;
        degrees: { name: string; university: string; year: string }[];
      };
      currentWork: {
        label: string;
        entries: { id: string; name: string; year: string }[];
      };
    }
  >;
  strengths: Record<Locale, string[]>;
  gallery: Record<Locale, { label: string; title: string; subtitle: string }>;
  services: Record<Locale, { label: string; title: string; subtitle: string }>;
  background: Record<Locale, { label: string; title: string; subtitle: string }>;
  contact: Record<
    Locale,
    {
      label: string;
      titleLead: string;
      titleEmphasis: string;
      subtitle: string;
      note: string;
      directTitle: string;
      location: string;
      form: {
        name: string;
        email: string;
        phone: string;
        message: string;
        submit: string;
        privacy: string;
        successTitle: string;
        successMessage: string;
        errorGeneric: string;
        errorName: string;
        errorEmail: string;
        errorMessage: string;
      };
    }
  >;
  footer: Record<Locale, { tagline: string; siteBy: string; rights: string }>;
}

function buildContentBundle() {
  const hostess = loadHostess();


  function yearsSince(dateIso: string): number {
    if (!dateIso) return 1;
    const start = new Date(dateIso);
    if (Number.isNaN(start.getTime())) return 1;
    return Math.max(1, new Date().getFullYear() - start.getFullYear());
  }

  function localizeText(value: string, _locale: Locale): string {
    return value;
  }

  const PRESENT_LABEL: Record<Locale, string> = {
    en: 'present',
    pl: 'obecnie',
    es: 'actualidad',
  };

  function extractYear(value: string): string {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return String(parsed.getFullYear());
    const match = String(value || '').match(/\b(19|20)\d{2}\b/);
    return match?.[0] ?? '';
  }

  function eventYear(date: string): string {
    return extractYear(date) || String(date || '').trim();
  }

  function eventSortKey(date: string): string {
    const raw = String(date || '').trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
    const year = extractYear(raw);
    return year ? `${year}-01-01` : '0000-01-01';
  }

  function formatYearRange(
    startDate: string | undefined,
    endDate: string | undefined,
    isOngoing: boolean | undefined,
    locale: Locale,
    fallbackDate = '',
  ): string {
    const present = PRESENT_LABEL[locale];
    const startYear = extractYear(startDate || '');
    const endYear = extractYear(endDate || '');
    if (isOngoing) {
      if (startYear && endYear) return `${startYear} – ${endYear} (${present})`;
      return startYear ? `${startYear} – ${present}` : present;
    }
    if (startYear && endYear) return `${startYear} – ${endYear}`;
    if (startYear || endYear) return startYear || endYear;
    return String(fallbackDate || '')
      .replace(/\bpresent\b/gi, present)
      .replace(/\bongoing\b/gi, present);
  }

  function formatStudyYear(entry: { startDate?: string; endDate?: string; isOngoing?: boolean }, locale: Locale): string {
    return formatYearRange(entry.startDate, entry.endDate, entry.isOngoing, locale);
  }

  function formatEmploymentYear(
    job: { startDate?: string; endDate?: string; date?: string; isOngoing?: boolean },
    locale: Locale,
  ): string {
    return formatYearRange(job.startDate, job.endDate, job.isOngoing, locale, job.date);
  }


  function buildAppearanceFacts(): AppearanceFact[] {
    const appearance = hostess.appearance ?? { height: '', dressSize: '', hairColor: '', eyeColor: '' };
    const mobility = hostess.mobility ?? { drivingLicense: '', hasCar: false };
    const facts: AppearanceFact[] = [];

    if (appearance.height) {
      facts.push({
        id: 'height',
        icon: 'height',
        label: { en: 'Height', pl: 'Wzrost', es: 'Altura' },
        value: { en: appearance.height, pl: appearance.height, es: appearance.height },
      });
    }
    if (appearance.dressSize) {
      facts.push({
        id: 'dress',
        icon: 'dress',
        label: { en: 'Dress size', pl: 'Rozmiar', es: 'Talla' },
        value: { en: appearance.dressSize, pl: appearance.dressSize, es: appearance.dressSize },
      });
    }
    if (appearance.hairColor) {
      facts.push({
        id: 'hair',
        icon: 'hair',
        label: { en: 'Hair', pl: 'Włosy', es: 'Cabello' },
        value: { en: appearance.hairColor, pl: appearance.hairColor, es: appearance.hairColor },
      });
    }
    if (appearance.eyeColor) {
      facts.push({
        id: 'eyes',
        icon: 'eyes',
        label: { en: 'Eyes', pl: 'Oczy', es: 'Ojos' },
        value: { en: appearance.eyeColor, pl: appearance.eyeColor, es: appearance.eyeColor },
      });
    }
    if (mobility.drivingLicense) {
      const licenseValue =
        mobility.drivingLicense === 'yes'
          ? { en: 'Yes', pl: 'Tak', es: 'Sí' }
          : { en: mobility.drivingLicense, pl: mobility.drivingLicense, es: mobility.drivingLicense };
      facts.push({
        id: 'license',
        icon: 'license',
        label: { en: 'License', pl: 'Prawo jazdy', es: 'Carnet' },
        value: licenseValue,
      });
    }
    if (mobility.hasCar) {
      facts.push({
        id: 'car',
        icon: 'car',
        label: { en: 'Car', pl: 'Samochód', es: 'Coche' },
        value: { en: 'Yes', pl: 'Tak', es: 'Sí' },
      });
    }

    return facts;
  }

  function mergeStrengthBadges(...groups: string[][]): string[] {
    const seen = new Set<string>();
    const merged: string[] = [];
    for (const group of groups) {
      for (const raw of group) {
        const item = raw.trim();
        if (!item) continue;
        const key = item.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        merged.push(item);
      }
    }
    return merged;
  }

  function buildEducationDegrees(locale: Locale) {
    const entries = hostess.education.entries?.length
      ? hostess.education.entries
      : hostess.education.field || hostess.education.university
        ? [{
            id: 'study-1',
            field: hostess.education.field,
            university: hostess.education.university,
            startDate: '',
            endDate: '',
            isOngoing: hostess.education.isStudent,
          }]
        : [];

    return entries
      .filter((entry) => String(entry.field || '').trim().length > 0)
      .map((entry) => ({
        name: String(entry.field).trim(),
        university: String(entry.university || '').trim(),
        year: formatStudyYear(entry, locale),
      }));
  }

  function buildCurrentWorkEntries(locale: Locale) {
    return (hostess.employment || [])
      .filter((job) => job.isOngoing)
      .map((job) => ({
        id: job.id,
        name: job.company ? `${job.title} · ${job.company}` : job.title,
        year: formatEmploymentYear(job, locale),
      }));
  }




  const displayName = hostess.profile.displayName;
  const location = hostess.profile.location;
  const coveragePlaces = (hostess.profile.workCities || []).map((c) => c.trim()).filter(Boolean);
  const coverageLabel = coveragePlaces.length ? coveragePlaces.join(' · ') : location;
  const workCities = coveragePlaces.length ? coveragePlaces.join(', ') : location;
  const experienceYears = yearsSince(hostess.experience.since);
  const experienceYearsLabel = `${experienceYears}+`;
  const eventsCount = String(hostess.events.length);
  const languagesCount = String(hostess.languages.length);
  const eventTypes = hostess.experience.eventTypes || '';
  const bioShort = hostess.bio.short;
  const hostessCopy = hostess.copy ?? {};
  const copyByLocale: Record<string, typeof hostessCopy> =
    (hostess as { copyByLocale?: Record<string, typeof hostessCopy> }).copyByLocale &&
    typeof (hostess as { copyByLocale?: unknown }).copyByLocale === 'object'
      ? ((hostess as unknown as { copyByLocale?: Record<string, typeof hostessCopy> }).copyByLocale ?? {})
      : {};

  function copyFor(locale: 'en' | 'pl' | 'es') {
    return publicCopyForLocale(copyByLocale, hostessCopy as Record<string, unknown>, locale);
  }
  const copyHeadline = String(hostessCopy.headline || '').trim();
  const copyGreeting = String(hostessCopy.greeting || '').trim();
  const copyProfile = String(hostessCopy.profile || '').trim();
  const copyAboutLead = String(hostessCopy.aboutLead || '').trim();
  const copyExperienceSummary = String(hostessCopy.experienceSummary || '').trim();
  const experienceText = String(hostess.experience.brands || '').trim();
  const heroGreeting = copyGreeting || '';
  const heroProfileLine = copyProfile || bioShort;
  const aboutLeadLine = copyAboutLead || experienceText || bioShort;
  const aboutBodyLine = copyExperienceSummary || eventTypes;
  const headlineFor = (locale: 'en' | 'pl' | 'es') => String(copyFor(locale).headline || '').trim();
  const useUserHeadline = Boolean(copyHeadline || headlineFor('pl') || headlineFor('en') || headlineFor('es'));
  const allStrengths = mergeStrengthBadges(
    hostess.skills,
    hostess.traits || [],
    hostess.languageCompetencies || [],
  );
  const appearanceFacts = buildAppearanceFacts();
  const showStrengthsSection = allStrengths.length > 0;
  const professionalStatus = hostess.profile.professionalStatus || (hostess.education.isStudent ? 'Student' : '');
  const statusStatValue = professionalStatus || workCities;
  const statusStatLabel = {
    en: professionalStatus ? 'Status' : 'Coverage',
    pl: professionalStatus ? 'Status zawodowy' : 'Zasięg',
    es: professionalStatus ? 'Estado' : 'Cobertura',
  };

  const GALLERY_DISPLAY_MAX = 7
  const galleryEvents: FeaturedEvent[] = [...hostess.events]
    .filter((event) => {
      const ref = String(event.imageFile || '').trim()
      // Hide empty / unfilled cards; keep bake basenames and remote URLs that have a value.
      return Boolean(ref)
    })
    .sort((a, b) => eventSortKey(b.date).localeCompare(eventSortKey(a.date)))
    .slice(0, GALLERY_DISPLAY_MAX)
    .map((event) => {
      const cover = resolveEventImage(event.imageFile)
      const extras = (Array.isArray(event.imageFiles) ? event.imageFiles : [])
        .map((ref) => String(ref || '').trim())
        .filter(Boolean)
        .map((ref) => resolveEventImage(ref))
      return {
        id: event.id,
        image: cover,
        images: [cover, ...extras],
        video: event.videoFile ? `/videos/${event.videoFile}` : null,
        date: eventYear(event.date),
        title: {
          en: localizeText(event.title, 'en'),
          pl: localizeText(event.title, 'pl'),
          es: localizeText(event.title, 'es'),
        },
        description: {
          en: localizeText(event.description, 'en'),
          pl: localizeText(event.description, 'pl'),
          es: localizeText(event.description, 'es'),
        },
        alt: {
          en: event.title ? `${displayName} at ${event.title}` : `${displayName} portfolio`,
          pl: event.title ? `${displayName} — ${event.title}` : `${displayName} — portfolio`,
          es: event.title ? `${displayName} — ${event.title}` : `${displayName} — portfolio`,
        },
      }
    });

  const content: PortfolioContent = {
    nav: {
      en: {
        work: copyFor('en').galleryLabel || 'Work',
        about: copyFor('en').aboutLabel || 'About',
        experience: copyFor('en').experienceLabel || 'Experience',
        services: 'Services',
        contact: copyFor('en').contactLabel || 'Contact',
        book: "Let's connect",
      },
      pl: {
        work: copyFor('pl').galleryLabel || 'Portfolio',
        about: copyFor('pl').aboutLabel || 'O mnie',
        experience: copyFor('pl').experienceLabel || 'Doświadczenie',
        services: 'Usługi',
        contact: copyFor('pl').contactLabel || 'Kontakt',
        book: 'Połączmy się',
      },
      es: {
        work: copyFor('es').galleryLabel || 'Trabajo',
        about: copyFor('es').aboutLabel || 'Sobre mí',
        experience: copyFor('es').experienceLabel || 'Experiencia',
        services: 'Servicios',
        contact: copyFor('es').contactLabel || 'Contacto',
        book: 'Conectemos',
      },
    },
    hero: {
      en: {
        eyebrow: `Professional Hostess · ${coverageLabel}`,
        headlineLead: headlineFor('en') || 'The art',
        headlineEmphasis: headlineFor('en') ? '' : 'of presence',
        bioIntro: copyFor('en').greeting || `Hi, I'm ${displayName}!`,
        bioBody: copyFor('en').profile || '',
        availability: 'Available for events',
        cta: 'Enquire',
        ctaSecondary: 'View work ↗',
      },
      pl: {
        eyebrow: `Profesjonalna hostessa · ${coverageLabel}`,
        headlineLead: headlineFor('pl') || (useUserHeadline ? copyHeadline : 'Sztuka'),
        headlineEmphasis: headlineFor('pl') || copyHeadline ? '' : 'obecności',
        bioIntro: copyFor('pl').greeting || copyGreeting || `Cześć, jestem ${displayName}!`,
        bioBody: copyFor('pl').profile || heroProfileLine,
        availability: 'Dostępna na eventy',
        cta: 'Zapytaj',
        ctaSecondary: 'Zobacz portfolio ↗',
      },
      es: {
        eyebrow: `Azafata profesional · ${coverageLabel}`,
        headlineLead: headlineFor('es') || 'El arte',
        headlineEmphasis: headlineFor('es') ? '' : 'de la presencia',
        bioIntro: copyFor('es').greeting || `¡Hola, soy ${displayName}!`,
        bioBody: copyFor('es').profile || '',
        availability: 'Disponible para eventos',
        cta: 'Consultar',
        ctaSecondary: 'Ver trabajo ↗',
      },
    },
    stats: {
      en: [
        { label: 'Experience', value: experienceYearsLabel },
        { label: 'Location', value: location },
        { label: statusStatLabel.en, value: statusStatValue },
        { label: 'Languages', value: languagesCount },
      ],
      pl: [
        { label: 'Doświadczenie', value: experienceYearsLabel },
        { label: 'Lokalizacja', value: location },
        { label: statusStatLabel.pl, value: statusStatValue },
        { label: 'Języki', value: languagesCount },
      ],
      es: [
        { label: 'Experiencia', value: experienceYearsLabel },
        { label: 'Ubicación', value: location },
        { label: statusStatLabel.es, value: statusStatValue },
        { label: 'Idiomas', value: languagesCount },
      ],
    },
    languagesLabel: {
      en: 'Languages',
      pl: 'Języki',
      es: 'Idiomas',
    },
    languages: {
      en: hostess.languages,
      pl: hostess.languages,
      es: hostess.languages,
    },
    about: {
      en: {
        label: copyFor('en').aboutLabel || 'About',
        titleLead: copyFor('en').aboutTitle || 'Hospitality',
        titleEmphasis: copyFor('en').aboutTitle ? '' : 'as an art',
        lead: copyFor('en').aboutLead || '',
        body: copyFor('en').experienceSummary || '',
        education: {
          label: 'Studies',
          degrees: buildEducationDegrees('en'),
        },
        currentWork: {
          label: 'Work',
          entries: buildCurrentWorkEntries('en'),
        },
      },
      pl: {
        label: copyFor('pl').aboutLabel || 'O mnie',
        titleLead: copyFor('pl').aboutTitle || 'Gościnność',
        titleEmphasis: copyFor('pl').aboutTitle ? '' : 'jako sztuka',
        lead: copyFor('pl').aboutLead || aboutLeadLine,
        body: copyFor('pl').experienceSummary || aboutBodyLine,
        education: {
          label: 'Studia',
          degrees: buildEducationDegrees('pl'),
        },
        currentWork: {
          label: 'Praca',
          entries: buildCurrentWorkEntries('pl'),
        },
      },
      es: {
        label: copyFor('es').aboutLabel || 'Sobre mí',
        titleLead: copyFor('es').aboutTitle || 'La hospitalidad',
        titleEmphasis: copyFor('es').aboutTitle ? '' : 'como arte',
        lead: copyFor('es').aboutLead || '',
        body: copyFor('es').experienceSummary || '',
        education: {
          label: 'Estudios',
          degrees: buildEducationDegrees('es'),
        },
        currentWork: {
          label: 'Trabajo',
          entries: buildCurrentWorkEntries('es'),
        },
      },
    },
    strengths: {
      en: allStrengths,
      pl: allStrengths,
      es: allStrengths,
    },
    gallery: {
      en: {
        label: copyFor('en').galleryLabel || 'Portfolio',
        title: copyFor('en').galleryTitle || 'Selected events',
        subtitle: '',
      },
      pl: {
        label: copyFor('pl').galleryLabel || 'Portfolio',
        title: copyFor('pl').galleryTitle || 'Wybrane wydarzenia',
        subtitle: '',
      },
      es: {
        label: copyFor('es').galleryLabel || 'Portfolio',
        title: copyFor('es').galleryTitle || 'Eventos destacados',
        subtitle: '',
      },
    },
    services: {
      en: {
        label: 'What I offer',
        title: 'Services',
        subtitle: eventTypes || 'Hostess roles at conferences and premium events.',
      },
      pl: {
        label: 'Co oferuję',
        title: 'Usługi',
        subtitle: eventTypes || 'Doświadczenie jako hostessa na eventach premium.',
      },
      es: {
        label: 'Lo que ofrezco',
        title: 'Servicios',
        subtitle: eventTypes || 'Experiencia como azafata en eventos premium.',
      },
    },
    background: {
      en: {
        label: copyFor('en').experienceLabel || 'Experience',
        title: copyFor('en').experienceTitle || 'Employment History',
        subtitle: '',
      },
      pl: {
        label: copyFor('pl').experienceLabel || 'Doświadczenie',
        title: copyFor('pl').experienceTitle || 'Historia zatrudnienia',
        subtitle: '',
      },
      es: {
        label: copyFor('es').experienceLabel || 'Experiencia',
        title: copyFor('es').experienceTitle || 'Historial laboral',
        subtitle: '',
      },
    },
    contact: {
      en: {
        label: copyFor('en').contactLabel || 'Get in touch',
        titleLead: copyFor('en').contactTitle || "Let's create",
        titleEmphasis: copyFor('en').contactTitle ? '' : 'something exceptional',
        subtitle: 'Available for conferences, brand events, and hospitality roles.',
        note: 'All enquiries are handled personally.',
        directTitle: 'Direct contact',
        location: `${location}${workCities ? ` · ${workCities}` : ''}`,
        form: {
          name: 'Your name',
          email: 'Email',
          phone: 'Phone (optional)',
          message: 'Tell me about the event or role',
          submit: 'Send enquiry ↗',
          privacy: 'I agree to be contacted regarding this inquiry.',
          successTitle: 'Message sent',
          successMessage: 'Thank you — I will get back to you shortly.',
          errorGeneric: 'Something went wrong. Please try again.',
          errorName: 'Please enter your name.',
          errorEmail: 'Please enter a valid email.',
          errorMessage: 'Please enter a message.',
        },
      },
      pl: {
        label: copyFor('pl').contactLabel || 'Kontakt',
        titleLead: copyFor('pl').contactTitle || 'Stwórzmy',
        titleEmphasis: copyFor('pl').contactTitle ? '' : 'coś wyjątkowego',
        subtitle: 'Dostępna na konferencje, eventy marek i role w branży hospitality.',
        note: 'Wszystkie zapytania obsługuję osobiście.',
        directTitle: 'Kontakt bezpośredni',
        location: `${location}${workCities ? ` · ${workCities}` : ''}`,
        form: {
          name: 'Imię i nazwisko',
          email: 'E-mail',
          phone: 'Telefon (opcjonalnie)',
          message: 'Opisz wydarzenie lub rolę',
          submit: 'Wyślij zapytanie ↗',
          privacy: 'Wyrażam zgodę na kontakt w sprawie tego zapytania.',
          successTitle: 'Wiadomość wysłana',
          successMessage: 'Dziękuję — odezwę się wkrótce.',
          errorGeneric: 'Coś poszło nie tak. Spróbuj ponownie.',
          errorName: 'Podaj imię i nazwisko.',
          errorEmail: 'Podaj prawidłowy adres e-mail.',
          errorMessage: 'Wpisz wiadomość.',
        },
      },
      es: {
        label: copyFor('es').contactLabel || 'Contacto',
        titleLead: copyFor('es').contactTitle || 'Creemos',
        titleEmphasis: copyFor('es').contactTitle ? '' : 'algo excepcional',
        subtitle: 'Disponible para conferencias, eventos de marca y roles en hostelería.',
        note: 'Todas las consultas se gestionan de forma personal.',
        directTitle: 'Contacto directo',
        location: `${location}${workCities ? ` · ${workCities}` : ''}`,
        form: {
          name: 'Tu nombre',
          email: 'Correo electrónico',
          phone: 'Teléfono (opcional)',
          message: 'Cuéntame sobre el evento o el puesto',
          submit: 'Enviar consulta ↗',
          privacy: 'Acepto ser contactada respecto a esta consulta.',
          successTitle: 'Mensaje enviado',
          successMessage: 'Gracias — me pondré en contacto contigo pronto.',
          errorGeneric: 'Algo salió mal. Inténtalo de nuevo.',
          errorName: 'Introduce tu nombre.',
          errorEmail: 'Introduce un correo electrónico válido.',
          errorMessage: 'Escribe un mensaje.',
        },
      },
    },
    footer: {
      en: { tagline: 'Professional hospitality', siteBy: 'Site by', rights: 'All rights reserved.' },
      pl: { tagline: 'Profesjonalna gościnność', siteBy: 'Strona', rights: 'Wszelkie prawa zastrzeżone.' },
      es: { tagline: 'Hospitalidad profesional', siteBy: 'Sitio', rights: 'Todos los derechos reservados.' },
    },
  };

  const showExperienceSection = (hostess.employment || []).length > 0;

  function employmentSortKey(job: { startDate?: string; endDate?: string; isOngoing?: boolean }) {
    const start = String(job.startDate || '').trim();
    if (start) return start;
    // Ongoing / missing start sorts as newest when compared lexicographically with ISO dates
    return job.isOngoing ? '9999-12-31' : '0000-01-01';
  }

  const backgroundEntries: TimelineEntry[] = [...(hostess.employment || [])]
    .sort((a, b) => employmentSortKey(b).localeCompare(employmentSortKey(a)))
    .map((job) => ({
      id: job.id,
      date: {
        en: formatEmploymentYear(job, 'en'),
        pl: formatEmploymentYear(job, 'pl'),
        es: formatEmploymentYear(job, 'es'),
      },
      title: {
        en: job.company ? `${job.title} · ${job.company}` : job.title,
        pl: job.company ? `${job.title} · ${job.company}` : job.title,
        es: job.company ? `${job.title} · ${job.company}` : job.title,
      },
      description: {
        en: job.description,
        pl: job.description,
        es: job.description,
      },
    }));

  const hostessForHero = loadHostess();
  const heroImage = resolveHeroImage(hostessForHero);
  return { appearanceFacts, showStrengthsSection, galleryEvents, content, showExperienceSection, backgroundEntries, heroImage };
}

function getContentBundle() {
  // Cache keyed on overlay identity from loadHostess() (ALS), not baked JSON alone.
  const hostess = loadHostess();
  if (_bundle && _bundleRef === hostess) return _bundle;
  _bundleRef = hostess;
  _bundle = buildContentBundle();
  return _bundle;
}

export { getContentBundle };

export const appearanceFacts = new Proxy({} as Record<string, unknown>, {
  get(_t, prop) {
    const obj = getContentBundle().appearanceFacts as object
    const value = Reflect.get(obj, prop)
    return typeof value === 'function' ? (value as (...args: never[]) => unknown).bind(obj) : value
  },
}) as unknown as ReturnType<typeof buildContentBundle>['appearanceFacts']

export const galleryEvents = new Proxy([] as never[], {
  get(_t, prop) {
    const arr = getContentBundle().galleryEvents as unknown as unknown[]
    const value = Reflect.get(arr as object, prop)
    return typeof value === 'function' ? (value as (...args: never[]) => unknown).bind(arr) : value
  },
}) as unknown as ReturnType<typeof buildContentBundle>['galleryEvents']

export const content: PortfolioContent = new Proxy({} as PortfolioContent, {
  get(_t, prop) {
    return Reflect.get(getContentBundle().content as object, prop)
  },
})

export const backgroundEntries = new Proxy([] as never[], {
  get(_t, prop) {
    const arr = getContentBundle().backgroundEntries as unknown as unknown[]
    const value = Reflect.get(arr as object, prop)
    return typeof value === 'function' ? (value as (...args: never[]) => unknown).bind(arr) : value
  },
}) as unknown as ReturnType<typeof buildContentBundle>['backgroundEntries']

export const heroImage = new Proxy({} as Record<string, unknown>, {
  get(_t, prop) {
    const obj = getContentBundle().heroImage as object
    const value = Reflect.get(obj, prop)
    return typeof value === 'function' ? (value as (...args: never[]) => unknown).bind(obj) : value
  },
}) as unknown as ReturnType<typeof buildContentBundle>['heroImage']

export function getShowStrengthsSection(): boolean {
  return getContentBundle().showStrengthsSection
}
/** @deprecated use getShowStrengthsSection() — kept as live getter for Astro conditionals via helper */
export const showStrengthsSection = {
  valueOf(): boolean { return getContentBundle().showStrengthsSection },
  [Symbol.toPrimitive](): boolean { return getContentBundle().showStrengthsSection },
} as unknown as boolean

export function getShowExperienceSection(): boolean {
  return getContentBundle().showExperienceSection
}
/** @deprecated use getShowExperienceSection() — kept as live getter for Astro conditionals via helper */
export const showExperienceSection = {
  valueOf(): boolean { return getContentBundle().showExperienceSection },
  [Symbol.toPrimitive](): boolean { return getContentBundle().showExperienceSection },
} as unknown as boolean


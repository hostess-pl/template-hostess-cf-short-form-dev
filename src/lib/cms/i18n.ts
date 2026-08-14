export type CmsChromeLocale = 'pl' | 'en'
export type ContentLocale = 'pl' | 'en' | 'es'

const CHROME_KEY = 'hw-cms-chrome-locale'
const CONTENT_KEY = 'hw-cms-content-locale'

export type CmsChromeStrings = {
  overview: string
  insights: string
  media: string
  content: string
  dashboard: string
  analytics: string
  assets: string
  account: string
  profile: string
  hero: string
  about: string
  experience: string
  gallery: string
  contact: string
  save: string
  saving: string
  saved: string
  saveChanges: string
  unsavedChanges: string
  menuOpen: string
  menuClose: string
  viewSite: string
  signOut: string
  loading: string
  discard: string
  addItem: string
  remove: string
  reorderUp: string
  reorderDown: string
  chooseAsset: string
  clear: string
  pasteUrl: string
  hideUrl: string
  noAsset: string
  chromeLang: string
  contentLang: string
  changePassword: string
  forgotPassword: string
  sendReset: string
  resetSent: string
  newPassword: string
  confirmPassword: string
  updatePassword: string
  passwordUpdated: string
  proOnlyTitle: string
  proOnlyBody: string
  subsectionAboutCopy: string
  subsectionSectionLabels: string
  subsectionStudies: string
  subsectionLanguages: string
  subsectionTraits: string
  subsectionPhysical: string
  subsectionEmployment: string
  subsectionExperienceMeta: string
  untitledEvent: string
  untitledEntry: string
  editorBadge: string
  loadFailed: string
  saveFailed: string
  dashboardHint: string
  dashboardAria: string
  themeToDark: string
  themeToLight: string
  themeDark: string
  themeLight: string
  // Login
  loginTitle: string
  loginLede: string
  loginConfigError: string
  loginAuthError: string
  loginInviteError: string
  signInMethod: string
  magicLinkTab: string
  passwordTab: string
  workEmail: string
  password: string
  emailMagicLink: string
  signIn: string
  backToSignIn: string
  magicLinkSent: string
  magicLinkWait: string
  couldNotSendLink: string
  authNotConfigured: string
  emailRateLimited: string
  somethingWentWrong: string
  passwordMinLength: string
  passwordsMismatch: string
  passwordSaveFailed: string
  setPasswordHint: string
  // Analytics
  analyticsTitle: string
  analyticsLede: string
  analyticsLoading: string
  analyticsLoadFailed: string
  pageViews: string
  uniqueVisitors: string
  sessions: string
  leads: string
  devices: string
  locales: string
  trafficSources: string
  latestEvents: string
  noDataYet: string
  noEventsYet: string
  when: string
  type: string
  path: string
  device: string
  source: string
  direct: string
  analyticsDraftTitle: string
  analyticsDraftHint: string
  analyticsDailyTitle: string
  pages: string
  insightsTeaser: string
  insightsTeaserDraft: string
  // Assets
  assetsTitle: string
  assetsLede: string
  upload: string
  uploadNew: string
  uploading: string
  assetsLoading: string
  assetsEmpty: string
  uploadFailed: string
  useAsset: string
  copyUrl: string
  copied: string
  close: string
  imagesOnly: string
  videosOnly: string
  imagesAndVideos: string
  siteSource: string
  uploadedSource: string
  // Field labels
  fieldHeadline: string
  fieldGreeting: string
  fieldProfileHero: string
  fieldBioShort: string
  fieldAboutLead: string
  fieldMainText: string
  fieldGalleryLabel: string
  fieldGalleryTitle: string
  fieldAboutLabel: string
  fieldAboutTitle: string
  fieldExperienceLabel: string
  fieldExperienceTitle: string
  fieldContactLabel: string
  fieldContactTitle: string
  fieldField: string
  fieldUniversity: string
  fieldStart: string
  fieldEnd: string
  fieldOngoing: string
  fieldName: string
  fieldLevel: string
  fieldTraits: string
  fieldSkills: string
  fieldLanguageCompetencies: string
  fieldHeight: string
  fieldDressSize: string
  fieldHairColor: string
  fieldEyeColor: string
  fieldDrivingLicense: string
  fieldHasCar: string
  subsectionMobility: string
  fieldSince: string
  fieldBrands: string
  fieldEventTypes: string
  fieldTitle: string
  fieldCompany: string
  fieldDescription: string
  fieldDate: string
  fieldBrand: string
  fieldPhoto: string
  fieldHeroPhoto: string
  fieldExtraPhotos: string
  fieldAddExtraPhoto: string
  fieldVideoOptional: string
  fieldDisplayName: string
  fieldLegalName: string
  fieldEmail: string
  fieldPhone: string
  fieldLocation: string
  fieldProfessionalStatus: string
  fieldWorkCities: string
  socialsHeading: string
  contactHint: string
  mediaUrlPlaceholder: string
  // Field placeholders
  phHeadline: string
  phGreeting: string
  phProfileHero: string
  phBioShort: string
  phAboutLead: string
  phMainText: string
  phGalleryLabel: string
  phGalleryTitle: string
  phAboutLabel: string
  phAboutTitle: string
  phExperienceLabel: string
  phExperienceTitle: string
  phContactLabel: string
  phContactTitle: string
  phField: string
  phUniversity: string
  phStart: string
  phEnd: string
  phName: string
  phLevel: string
  phTraits: string
  phSkills: string
  phHeight: string
  phDressSize: string
  phHairColor: string
  phEyeColor: string
  phSince: string
  phBrands: string
  phEventTypes: string
  phTitle: string
  phCompany: string
  phDescription: string
  phDate: string
  phBrand: string
  phDisplayName: string
  phLegalName: string
  phEmail: string
  phPhone: string
  phLocation: string
  phProfessionalStatus: string
  phWorkCities: string
  phInstagram: string
  phTiktok: string
  phLinkedin: string
  phFacebook: string
}

const PL: CmsChromeStrings = {
  overview: 'Przegląd',
  insights: 'Analityka',
  media: 'Media',
  content: 'Treść',
  dashboard: 'Sekcje strony',
  analytics: 'Analityka',
  assets: 'Pliki',
  account: 'Konto',
  profile: 'Profil i social media',
  hero: 'Hero',
  about: 'O mnie',
  experience: 'Doświadczenie',
  gallery: 'Portfolio',
  contact: 'Kontakt',
  save: 'Zapisz',
  saving: 'Zapisywanie…',
  saved: 'Zapisano — widoczne na stronie',
  saveChanges: 'Zapisz zmiany',
  unsavedChanges: 'Niezapisane zmiany',
  menuOpen: 'Otwórz menu',
  menuClose: 'Zamknij menu',
  viewSite: 'Zobacz stronę',
  signOut: 'Wyloguj',
  loading: 'Ładowanie…',
  discard: 'Odrzucić niezapisane zmiany?',
  addItem: 'Dodaj pozycję',
  remove: 'Usuń',
  reorderUp: 'W górę',
  reorderDown: 'W dół',
  chooseAsset: 'Wybierz z plików',
  clear: 'Wyczyść',
  pasteUrl: 'Wklej URL',
  hideUrl: 'Ukryj URL',
  noAsset: 'Brak wybranego pliku',
  chromeLang: 'Język panelu',
  contentLang: 'Język treści',
  changePassword: 'Zmień hasło',
  forgotPassword: 'Nie pamiętam hasła',
  sendReset: 'Wyślij link resetujący',
  resetSent: 'Jeśli konto istnieje, sprawdź skrzynkę e-mail.',
  newPassword: 'Nowe hasło',
  confirmPassword: 'Potwierdź hasło',
  updatePassword: 'Zapisz hasło',
  passwordUpdated: 'Hasło zaktualizowane',
  proOnlyTitle: 'CMS dostępne w planie Pro',
  proOnlyBody:
    'Edycja treści i analityka są częścią Hostess Webs Pro. Skontaktuj się z Hostess Webs, aby przejść na Pro.',
  subsectionAboutCopy: 'Teksty',
  subsectionSectionLabels: 'Etykiety sekcji',
  subsectionStudies: 'Studia',
  subsectionLanguages: 'Języki',
  subsectionTraits: 'Cechy i umiejętności',
  subsectionPhysical: 'Profil fizyczny',
  subsectionEmployment: 'Historia zatrudnienia',
  subsectionExperienceMeta: 'Doświadczenie spoza branży hostess',
  untitledEvent: 'Wydarzenie bez tytułu',
  untitledEntry: 'Wpis bez tytułu',
  editorBadge: 'Edytor',
  loadFailed: 'Nie udało się wczytać',
  saveFailed: 'Nie udało się zapisać',
  dashboardHint: 'Szkic sekcji strony. Kliknij blok, aby edytować.',
  dashboardAria: 'Szkic sekcji portfolio',
  themeToDark: 'Włącz tryb ciemny',
  themeToLight: 'Włącz tryb jasny',
  themeDark: 'Ciemny',
  themeLight: 'Jasny',
  loginTitle: 'Edytor treści',
  loginLede:
    'Tylko dla zaproszonych. Użyj linku magicznego (otwórz w tej samej przeglądarce) albo e-mail i hasło po pierwszym logowaniu.',
  loginConfigError: 'Klucze publiczne Supabase nie są skonfigurowane w tym środowisku.',
  loginAuthError: 'Link logowania wygasł lub jest nieprawidłowy. Poproś o nowy.',
  loginInviteError: 'To konto nie ma zaproszenia do edycji tej strony.',
  signInMethod: 'Sposób logowania',
  magicLinkTab: 'Link magiczny',
  passwordTab: 'E-mail i hasło',
  workEmail: 'E-mail służbowy',
  password: 'Hasło',
  emailMagicLink: 'Wyślij link logowania',
  signIn: 'Zaloguj',
  backToSignIn: 'Wróć do logowania',
  magicLinkSent:
    'Jeśli masz zaproszenie, sprawdź skrzynkę. Otwórz link w tej samej przeglądarce w ciągu około godziny. Link magiczny nie zmienia hasła.',
  magicLinkWait: 'Odczekaj chwilę przed kolejną prośbą o link.',
  couldNotSendLink: 'Nie udało się wysłać linku',
  authNotConfigured: 'Logowanie nie jest skonfigurowane',
  emailRateLimited:
    'Limit wysyłki e-mail. Odczekaj około godziny albo poproś administratora o bezpośredni link (cms:login-link).',
  somethingWentWrong: 'Coś poszło nie tak',
  passwordMinLength: 'Użyj co najmniej 8 znaków.',
  passwordsMismatch: 'Hasła nie są takie same.',
  passwordSaveFailed: 'Nie udało się zapisać hasła',
  setPasswordHint:
    'Po pierwszym logowaniu ustaw hasło, żeby wracać przez e-mail i hasło albo link magiczny.',
  analyticsTitle: 'Analityka',
  analyticsLede: 'Metryki własne z ostatnich 30 dni (Pro). Zbierane od momentu publikacji portfolio.',
  analyticsLoading: 'Ładowanie analityki…',
  analyticsLoadFailed: 'Nie udało się wczytać analityki',
  pageViews: 'Wyświetlenia',
  uniqueVisitors: 'Unikalni odwiedzający',
  sessions: 'Sesje',
  leads: 'Leady',
  devices: 'Urządzenia',
  locales: 'Języki',
  trafficSources: 'Źródła ruchu',
  latestEvents: 'Ostatnie zdarzenia',
  noDataYet: 'Brak danych',
  noEventsYet: 'Brak zdarzeń — analityka startuje po publikacji, gdy strona jest publiczna.',
  when: 'Kiedy',
  type: 'Typ',
  path: 'Ścieżka',
  device: 'Urządzenie',
  source: 'Źródło',
  direct: 'bezpośredni',
  analyticsDraftTitle: 'Analityka startuje po publikacji',
  analyticsDraftHint: 'Opublikuj portfolio, aby zbierać odwiedziny i zapytania z formularza kontaktowego.',
  analyticsDailyTitle: 'Ostatnie 7 dni',
  pages: 'Strony',
  insightsTeaser: 'Wyświetlenia (30 dni)',
  insightsTeaserDraft: 'Analityka włączy się po publikacji portfolio.',
  assetsTitle: 'Pliki',
  assetsLede: 'Zdjęcia i filmy tej strony. Wybieraj je przy edycji pól.',
  upload: 'Prześlij',
  uploadNew: 'Prześlij nowy',
  uploading: 'Przesyłanie…',
  assetsLoading: 'Ładowanie plików…',
  assetsEmpty: 'Brak plików. Prześlij zdjęcie lub film, aby zacząć.',
  uploadFailed: 'Przesyłanie nie powiodło się',
  useAsset: 'Użyj',
  copyUrl: 'Kopiuj URL',
  copied: 'Skopiowano',
  close: 'Zamknij',
  imagesOnly: 'Zdjęcia',
  videosOnly: 'Filmy',
  imagesAndVideos: 'Zdjęcia i filmy',
  siteSource: 'strona',
  uploadedSource: 'przesłane',
  fieldHeadline: 'Nagłówek',
  fieldGreeting: 'Powitanie',
  fieldProfileHero: 'Tekst hero / profil',
  fieldBioShort: 'Bio (krótko)',
  fieldAboutLead: 'TEXT1',
  fieldMainText: 'TEXT2',
  fieldGalleryLabel: 'Etykieta galerii / nawigacja',
  fieldGalleryTitle: 'Tytuł galerii',
  fieldAboutLabel: 'Etykieta O mnie / nawigacja',
  fieldAboutTitle: 'Tytuł O mnie',
  fieldExperienceLabel: 'Etykieta doświadczenia / nawigacja',
  fieldExperienceTitle: 'Tytuł doświadczenia',
  fieldContactLabel: 'Etykieta kontaktu / nawigacja',
  fieldContactTitle: 'Tytuł kontaktu',
  fieldField: 'Kierunek',
  fieldUniversity: 'Uczelnia',
  fieldStart: 'Od',
  fieldEnd: 'Do',
  fieldOngoing: 'Trwa / obecnie',
  fieldName: 'Nazwa',
  fieldLevel: 'Poziom',
  fieldTraits: 'Cechy (po przecinku)',
  fieldSkills: 'Umiejętności (po przecinku)',
  fieldLanguageCompetencies: 'Kompetencje językowe (po przecinku)',
  fieldHeight: 'Wzrost',
  fieldDressSize: 'Rozmiar',
  fieldHairColor: 'Kolor włosów',
  fieldEyeColor: 'Kolor oczu',
  fieldDrivingLicense: 'Prawo jazdy',
  fieldHasCar: 'Samochód',
  subsectionMobility: 'Mobilność',
  fieldSince: 'Od (RRRR-MM)',
  fieldBrands: 'Tekst doświadczenia',
  fieldEventTypes: 'Typy wydarzeń',
  fieldTitle: 'Tytuł',
  fieldCompany: 'Firma',
  fieldDescription: 'Opis',
  fieldDate: 'Data',
  fieldBrand: 'Marka',
  fieldPhoto: 'Zdjęcie',
  fieldHeroPhoto: 'Zdjęcie główne (hero)',
  fieldExtraPhotos: 'Dodatkowe zdjęcia (slider)',
  fieldAddExtraPhoto: 'Dodaj zdjęcie do wydarzenia',
  fieldVideoOptional: 'Film (opcjonalnie)',
  fieldDisplayName: 'Nazwa wyświetlana',
  fieldLegalName: 'Imię i nazwisko',
  fieldEmail: 'E-mail',
  fieldPhone: 'Telefon',
  fieldLocation: 'Lokalizacja',
  fieldProfessionalStatus: 'Status zawodowy',
  fieldWorkCities: 'Miasta pracy (po przecinku)',
  socialsHeading: 'Social media',
  contactHint: 'Formularz kontaktowy na stronie używa e-maila, telefonu i lokalizacji z profilu.',
  mediaUrlPlaceholder: 'nazwa-pliku.jpg lub URL',
  phHeadline: 'np. Pierwsze wrażenie, które buduje zaufanie',
  phGreeting: 'np. Cześć, jestem Anna!',
  phProfileHero: 'Krótki opis pod nagłówkiem (2–3 zdania)',
  phBioShort: 'Jedno–dwa zdania bio na stronie',
  phAboutLead: 'Wstęp do sekcji O mnie',
  phMainText: 'Główny akapit o Tobie i doświadczeniu',
  phGalleryLabel: 'Portfolio',
  phGalleryTitle: 'Wybrane wydarzenia',
  phAboutLabel: 'O mnie',
  phAboutTitle: 'Gościnność jako sztuka',
  phExperienceLabel: 'Doświadczenie',
  phExperienceTitle: 'Historia zatrudnienia',
  phContactLabel: 'Kontakt',
  phContactTitle: 'Porozmawiajmy',
  phField: 'np. Marketing / Eventy',
  phUniversity: 'np. Uniwersytet Warszawski',
  phStart: 'RRRR-MM',
  phEnd: 'RRRR-MM lub puste jeśli trwa',
  phName: 'np. angielski',
  phLevel: 'np. B2 / native',
  phTraits: 'np. komunikatywna, punktualna, elastyczna',
  phSkills: 'np. hosting, tłumaczenia, social media',
  phHeight: 'np. 175 cm',
  phDressSize: 'np. 36 / S',
  phHairColor: 'np. blond',
  phEyeColor: 'np. niebieskie',
  phSince: 'np. 2019-06',
  phBrands: 'Krótki tekst pod tytułem O mnie (gdy TEXT1 O mnie jest puste)',
  phEventTypes: 'np. targi, premiery, konferencje',
  phTitle: 'np. Hostess / Brand ambassador',
  phCompany: 'Nazwa firmy lub agencji',
  phDescription: 'Co robiłaś na tym stanowisku / wydarzeniu',
  phDate: 'np. 2024-09 lub Wrzesień 2024',
  phBrand: 'Nazwa marki wydarzenia',
  phDisplayName: 'Jak masz być widoczna na stronie',
  phLegalName: 'Imię i nazwisko',
  phEmail: 'kontakt@twojadomena.pl',
  phPhone: '+48 600 000 000',
  phLocation: 'np. Warszawa, Polska',
  phProfessionalStatus: 'np. dostępna / freelancer',
  phWorkCities: 'Warszawa, Kraków, Trójmiasto',
  phInstagram: 'https://instagram.com/…',
  phTiktok: 'https://tiktok.com/@…',
  phLinkedin: 'https://linkedin.com/in/…',
  phFacebook: 'https://facebook.com/…',
}

const EN: CmsChromeStrings = {
  overview: 'Overview',
  insights: 'Insights',
  media: 'Media',
  content: 'Content',
  dashboard: 'Page sections',
  analytics: 'Analytics',
  assets: 'Assets',
  account: 'Account',
  profile: 'Profile & socials',
  hero: 'Hero',
  about: 'About',
  experience: 'Experience',
  gallery: 'Portfolio',
  contact: 'Contact',
  save: 'Save',
  saving: 'Saving…',
  saved: 'Saved — live on the site',
  saveChanges: 'Save changes',
  unsavedChanges: 'Unsaved changes',
  menuOpen: 'Open menu',
  menuClose: 'Close menu',
  viewSite: 'View site',
  signOut: 'Sign out',
  loading: 'Loading…',
  discard: 'Discard unsaved changes?',
  addItem: 'Add item',
  remove: 'Remove',
  reorderUp: 'Move up',
  reorderDown: 'Move down',
  chooseAsset: 'Choose from assets',
  clear: 'Clear',
  pasteUrl: 'Paste URL',
  hideUrl: 'Hide URL',
  noAsset: 'No asset selected',
  chromeLang: 'Panel language',
  contentLang: 'Content language',
  changePassword: 'Change password',
  forgotPassword: 'Forgot password',
  sendReset: 'Send reset link',
  resetSent: 'If the account exists, check your inbox.',
  newPassword: 'New password',
  confirmPassword: 'Confirm password',
  updatePassword: 'Save password',
  passwordUpdated: 'Password updated',
  proOnlyTitle: 'CMS is available on Pro',
  proOnlyBody:
    'Content editing and analytics are part of Hostess Webs Pro. Contact Hostess Webs to upgrade.',
  subsectionAboutCopy: 'Copy',
  subsectionSectionLabels: 'Section labels',
  subsectionStudies: 'Studies',
  subsectionLanguages: 'Languages',
  subsectionTraits: 'Traits & skills',
  subsectionPhysical: 'Physical profile',
  subsectionEmployment: 'Employment history',
  subsectionExperienceMeta: 'Non-hostess industry experience',
  untitledEvent: 'Untitled event',
  untitledEntry: 'Untitled entry',
  editorBadge: 'Editor',
  loadFailed: 'Could not load',
  saveFailed: 'Could not save',
  dashboardHint: 'Wireframe of portfolio sections. Click a block to edit.',
  dashboardAria: 'Portfolio wireframe',
  themeToDark: 'Switch to dark mode',
  themeToLight: 'Switch to light mode',
  themeDark: 'Dark',
  themeLight: 'Light',
  loginTitle: 'Content editor',
  loginLede:
    'Invite-only. Use a magic link (open it in this same browser) or email + password after your first sign-in.',
  loginConfigError: 'Supabase public keys are not configured on this environment.',
  loginAuthError: 'Sign-in link expired or invalid. Request a new one.',
  loginInviteError: 'This account is not invited to edit this site.',
  signInMethod: 'Sign-in method',
  magicLinkTab: 'Magic link',
  passwordTab: 'Email + password',
  workEmail: 'Work email',
  password: 'Password',
  emailMagicLink: 'Email me a sign-in link',
  signIn: 'Sign in',
  backToSignIn: 'Back to sign in',
  magicLinkSent:
    'If you are invited, check your inbox. Open the link in this same browser within about an hour. Magic link does not change your password.',
  magicLinkWait: 'Please wait before requesting another link.',
  couldNotSendLink: 'Could not send link',
  authNotConfigured: 'Auth is not configured',
  emailRateLimited:
    'Email rate limit reached. Wait about an hour, or ask an admin for a direct sign-in link (cms:login-link).',
  somethingWentWrong: 'Something went wrong',
  passwordMinLength: 'Use at least 8 characters.',
  passwordsMismatch: 'Passwords do not match.',
  passwordSaveFailed: 'Could not save password',
  setPasswordHint:
    'After your first sign-in, save a password so you can return with email + password or a magic link.',
  analyticsTitle: 'Analytics',
  analyticsLede: 'First-party metrics for the last 30 days (Pro). Collection starts after you publish.',
  analyticsLoading: 'Loading analytics…',
  analyticsLoadFailed: 'Failed to load analytics',
  pageViews: 'Page views',
  uniqueVisitors: 'Unique visitors',
  sessions: 'Sessions',
  leads: 'Leads',
  devices: 'Devices',
  locales: 'Locales',
  trafficSources: 'Traffic sources',
  latestEvents: 'Latest events',
  noDataYet: 'No data yet',
  noEventsYet: 'No events yet — analytics start once your portfolio is published and public.',
  when: 'When',
  type: 'Type',
  path: 'Path',
  device: 'Device',
  source: 'Source',
  direct: 'direct',
  analyticsDraftTitle: 'Analytics start after publish',
  analyticsDraftHint: 'Publish your portfolio to start collecting visits and contact leads.',
  analyticsDailyTitle: 'Last 7 days',
  pages: 'Pages',
  insightsTeaser: 'Views (30 days)',
  insightsTeaserDraft: 'Analytics turn on after you publish your portfolio.',
  assetsTitle: 'Assets',
  assetsLede: 'Images and videos for this site. Pick from here when editing fields.',
  upload: 'Upload',
  uploadNew: 'Upload new',
  uploading: 'Uploading…',
  assetsLoading: 'Loading assets…',
  assetsEmpty: 'No assets yet. Upload an image or video to get started.',
  uploadFailed: 'Upload failed',
  useAsset: 'Use',
  copyUrl: 'Copy URL',
  copied: 'Copied',
  close: 'Close',
  imagesOnly: 'Images',
  videosOnly: 'Videos',
  imagesAndVideos: 'Images & videos',
  siteSource: 'site',
  uploadedSource: 'uploaded',
  fieldHeadline: 'Headline',
  fieldGreeting: 'Greeting',
  fieldProfileHero: 'Profile / hero text',
  fieldBioShort: 'Bio (short)',
  fieldAboutLead: 'TEXT1',
  fieldMainText: 'TEXT2',
  fieldGalleryLabel: 'Gallery label / nav',
  fieldGalleryTitle: 'Gallery title',
  fieldAboutLabel: 'About label / nav',
  fieldAboutTitle: 'About title',
  fieldExperienceLabel: 'Experience label / nav',
  fieldExperienceTitle: 'Experience title',
  fieldContactLabel: 'Contact label / nav',
  fieldContactTitle: 'Contact title',
  fieldField: 'Field',
  fieldUniversity: 'University',
  fieldStart: 'Start',
  fieldEnd: 'End',
  fieldOngoing: 'Ongoing / present',
  fieldName: 'Name',
  fieldLevel: 'Level',
  fieldTraits: 'Traits (comma-separated)',
  fieldSkills: 'Skills (comma-separated)',
  fieldLanguageCompetencies: 'Language competencies (comma-separated)',
  fieldHeight: 'Height',
  fieldDressSize: 'Dress size',
  fieldHairColor: 'Hair color',
  fieldEyeColor: 'Eye color',
  fieldDrivingLicense: 'Driving license',
  fieldHasCar: 'Has a car',
  subsectionMobility: 'Mobility',
  fieldSince: 'Since (YYYY-MM)',
  fieldBrands: 'Experience text',
  fieldEventTypes: 'Event types',
  fieldTitle: 'Title',
  fieldCompany: 'Company',
  fieldDescription: 'Description',
  fieldDate: 'Date',
  fieldBrand: 'Brand',
  fieldPhoto: 'Photo',
  fieldHeroPhoto: 'Hero photo',
  fieldExtraPhotos: 'Extra photos (slider)',
  fieldAddExtraPhoto: 'Add photo to event',
  fieldVideoOptional: 'Video (optional)',
  fieldDisplayName: 'Display name',
  fieldLegalName: 'Legal name',
  fieldEmail: 'Email',
  fieldPhone: 'Phone',
  fieldLocation: 'Location',
  fieldProfessionalStatus: 'Professional status',
  fieldWorkCities: 'Work cities (comma-separated)',
  socialsHeading: 'Socials',
  contactHint: 'The contact form on the public site uses your profile email, phone, and location.',
  mediaUrlPlaceholder: 'filename.jpg or URL',
  phHeadline: 'e.g. A first impression that builds trust',
  phGreeting: "e.g. Hi, I'm Anna!",
  phProfileHero: 'Short hero subtitle (2–3 sentences)',
  phBioShort: 'One–two sentence bio for the site',
  phAboutLead: 'Lead-in for the About section',
  phMainText: 'Main paragraph about you and your experience',
  phGalleryLabel: 'Portfolio',
  phGalleryTitle: 'Selected events',
  phAboutLabel: 'About',
  phAboutTitle: 'Hospitality as an art',
  phExperienceLabel: 'Experience',
  phExperienceTitle: 'Employment History',
  phContactLabel: 'Contact',
  phContactTitle: "Let's work together",
  phField: 'e.g. Marketing / Events',
  phUniversity: 'e.g. University of Warsaw',
  phStart: 'YYYY-MM',
  phEnd: 'YYYY-MM or empty if ongoing',
  phName: 'e.g. English',
  phLevel: 'e.g. B2 / native',
  phTraits: 'e.g. communicative, punctual, flexible',
  phSkills: 'e.g. hosting, interpreting, social media',
  phHeight: 'e.g. 175 cm',
  phDressSize: 'e.g. 36 / S',
  phHairColor: 'e.g. blonde',
  phEyeColor: 'e.g. blue',
  phSince: 'e.g. 2019-06',
  phBrands: 'Short text under the About title (when About TEXT1 is empty)',
  phEventTypes: 'e.g. trade shows, launches, conferences',
  phTitle: 'e.g. Hostess / Brand ambassador',
  phCompany: 'Company or agency name',
  phDescription: 'What you did in this role / event',
  phDate: 'e.g. 2024-09 or September 2024',
  phBrand: 'Event brand name',
  phDisplayName: 'How you appear on the site',
  phLegalName: 'Full legal name',
  phEmail: 'hello@yourdomain.com',
  phPhone: '+48 600 000 000',
  phLocation: 'e.g. Warsaw, Poland',
  phProfessionalStatus: 'e.g. available / freelancer',
  phWorkCities: 'Warsaw, Krakow, Tricity',
  phInstagram: 'https://instagram.com/…',
  phTiktok: 'https://tiktok.com/@…',
  phLinkedin: 'https://linkedin.com/in/…',
  phFacebook: 'https://facebook.com/…',
}

export function chromeStrings(locale: CmsChromeLocale): CmsChromeStrings {
  return locale === 'en' ? EN : PL
}

export function readStoredChromeLocale(): CmsChromeLocale {
  if (typeof window === 'undefined') return 'pl'
  return window.localStorage.getItem(CHROME_KEY) === 'en' ? 'en' : 'pl'
}

export function storeChromeLocale(locale: CmsChromeLocale) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(CHROME_KEY, locale)
}

export function readStoredContentLocale(available: ContentLocale[]): ContentLocale {
  if (typeof window === 'undefined') return available[0] ?? 'pl'
  const raw = window.localStorage.getItem(CONTENT_KEY) as ContentLocale | null
  if (raw && available.includes(raw)) return raw
  if (available.includes('pl')) return 'pl'
  return available[0] ?? 'pl'
}

export function storeContentLocale(locale: ContentLocale) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(CONTENT_KEY, locale)
}

export function availableContentLocales(doc: Record<string, unknown> | null): ContentLocale[] {
  const fromDoc = Array.isArray(doc?.locales)
    ? (doc!.locales as unknown[]).filter((x): x is ContentLocale => x === 'pl' || x === 'en' || x === 'es')
    : []
  if (fromDoc.length) return fromDoc
  const extras = (doc?.extras && typeof doc.extras === 'object' ? doc.extras : {}) as Record<
    string,
    unknown
  >
  const out: ContentLocale[] = ['pl']
  if (extras.englishVersion === true) out.push('en')
  if (extras.spanishVersion === true) out.push('es')
  return out
}

export type CopyFields = {
  headline?: string
  greeting?: string
  profile?: string
  aboutLead?: string
  experienceSummary?: string
  galleryLabel?: string
  galleryTitle?: string
  aboutLabel?: string
  aboutTitle?: string
  experienceLabel?: string
  experienceTitle?: string
  contactLabel?: string
  contactTitle?: string
}

const COPY_FIELD_KEYS = [
  'headline',
  'greeting',
  'profile',
  'aboutLead',
  'experienceSummary',
  'galleryLabel',
  'galleryTitle',
  'aboutLabel',
  'aboutTitle',
  'experienceLabel',
  'experienceTitle',
  'contactLabel',
  'contactTitle',
] as const satisfies readonly (keyof CopyFields)[]

function copyFieldsFromRecord(source: unknown): CopyFields {
  if (!source || typeof source !== 'object') return {}
  const row = source as Record<string, unknown>
  const out: CopyFields = {}
  for (const key of COPY_FIELD_KEYS) {
    const v = row[key]
    if (v != null && String(v).trim()) out[key] = String(v)
  }
  return out
}

function isEmptyCopyFields(fields: CopyFields): boolean {
  return !COPY_FIELD_KEYS.some((key) => String(fields[key] || '').trim())
}

function pickCopyField(
  doc: Record<string, unknown>,
  locale: ContentLocale,
  key: keyof CopyFields,
): string {
  const byLocale =
    doc.copyByLocale && typeof doc.copyByLocale === 'object'
      ? (doc.copyByLocale as Record<string, CopyFields>)
      : {}
  const flat =
    doc.copy && typeof doc.copy === 'object' ? (doc.copy as CopyFields) : {}
  const fromLocale = byLocale[locale]?.[key]
  const fromPl = byLocale.pl?.[key]
  const fromFlat = flat[key]
  return String(fromLocale || fromPl || fromFlat || '').trim()
}

export function getCopyForLocale(
  doc: Record<string, unknown>,
  locale: ContentLocale,
): CopyFields {
  const out: CopyFields = {}
  for (const key of COPY_FIELD_KEYS) {
    const value = pickCopyField(doc, locale, key)
    if (value) out[key] = value
  }
  return out
}

/**
 * Backfill copyByLocale from flat copy and seed EN/ES from PL when enabled.
 * Returns migrated doc + whether persistence is needed.
 */
export function migrateCopyByLocale(doc: Record<string, unknown>): {
  doc: Record<string, unknown>
  changed: boolean
} {
  const flat = copyFieldsFromRecord(doc.copy)
  let byLocale =
    doc.copyByLocale && typeof doc.copyByLocale === 'object'
      ? Object.fromEntries(
          Object.entries(doc.copyByLocale as Record<string, unknown>).map(([k, v]) => [
            k,
            copyFieldsFromRecord(v),
          ]),
        ) as Record<string, CopyFields>
      : {}
  let changed = false

  if (!isEmptyCopyFields(flat) && isEmptyCopyFields(byLocale.pl || {})) {
    byLocale.pl = { ...flat }
    changed = true
  }

  const extras =
    doc.extras && typeof doc.extras === 'object'
      ? (doc.extras as Record<string, unknown>)
      : {}
  const locales = Array.isArray(doc.locales) ? (doc.locales as string[]) : ['pl']

  const seedFromPl = (loc: ContentLocale) => {
    if (loc === 'pl') return
    const current = byLocale[loc] || {}
    if (!isEmptyCopyFields(current)) return
    const source = !isEmptyCopyFields(byLocale.pl || {}) ? byLocale.pl : flat
    if (isEmptyCopyFields(source || {})) return
    byLocale[loc] = { ...(source as CopyFields) }
    changed = true
  }

  if (extras.englishVersion === true || locales.includes('en')) seedFromPl('en')
  if (extras.spanishVersion === true || locales.includes('es')) seedFromPl('es')

  if (!changed) return { doc, changed: false }

  const next = { ...doc, copyByLocale: byLocale }
  if (!isEmptyCopyFields(byLocale.pl || {})) {
    next.copy = byLocale.pl
  }
  return { doc: next, changed: true }
}

export function seedCopyLocaleIfMissing(
  doc: Record<string, unknown>,
  locale: ContentLocale,
): Record<string, unknown> {
  if (locale === 'pl') return doc
  const { doc: migrated } = migrateCopyByLocale(doc)
  const byLocale =
    migrated.copyByLocale && typeof migrated.copyByLocale === 'object'
      ? (migrated.copyByLocale as Record<string, CopyFields>)
      : {}
  if (!isEmptyCopyFields(byLocale[locale] || {})) return migrated
  const source = !isEmptyCopyFields(byLocale.pl || {})
    ? byLocale.pl
    : copyFieldsFromRecord(migrated.copy)
  if (isEmptyCopyFields(source || {})) return migrated
  return {
    ...migrated,
    copyByLocale: { ...byLocale, [locale]: { ...(source as CopyFields) } },
  }
}

export function setCopyForLocale(
  doc: Record<string, unknown>,
  locale: ContentLocale,
  next: CopyFields,
): Record<string, unknown> {
  const prevBy =
    doc.copyByLocale && typeof doc.copyByLocale === 'object'
      ? { ...(doc.copyByLocale as Record<string, CopyFields>) }
      : {}
  const updated = { ...prevBy, [locale]: next }
  // Keep flat `copy` synced to PL (or first locale) for backward compatibility.
  const flatSource = updated.pl ?? updated[locale] ?? next
  return {
    ...doc,
    copyByLocale: updated,
    copy: flatSource,
  }
}

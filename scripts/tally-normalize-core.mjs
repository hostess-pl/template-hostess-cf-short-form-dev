/**
 * Canonical Tally → hostess normalizer.
 * Sync: node hostesses/scripts/sync-tally-normalize.mjs
 */

export const PROFESSIONAL_STATUS_VALUES = [
  'Student',
  'Pracuję na pełen etat',
  'Pracuję na część etatu',
  'Freelancer',
  'Prowadzę działalność gospodarczą',
  'Pracuję na umowę zlecenie',
  'Obecnie nie pracuję',
  'Inne',
];

/**
 * Production Tally form aQPkGW (live question IDs).
 * Do not reuse 44dDEb IDs — that form is a different schema.
 */
export const TALLY_FIELD_MAP_PROD = {
  firstName: 'question_JDAjbY',
  lastName: 'question_gZMPPK',
  legalName: null,
  displayName: 'question_gZMPX1',
  phone: 'question_yv9Arp',
  email: 'question_XYWAdd',
  instagram: 'question_e2eOOo',
  tiktok: 'question_WY5bbQ',
  linkedin: 'question_XYWAAV',
  facebook: 'question_EDQVGq',
  location: 'question_88QDVY',
  workCities: 'question_0v60z0',
  languages: null,
  languagePairs: [
    ['question_djxGJN', 'question_YYWB70'],
    ['question_lWd286', 'question_RY5eqP'],
    ['question_GDdEOz', 'question_OY5qxA'],
    ['question_PY5QZ0', 'question_EDQVoL'],
    ['question_4vx0lo', 'question_jWQ489'],
    ['question_xyab89', 'question_RY5eqv'],
  ],
  experienceSince: 'question_GDdEa2',
  eventTypes: null,
  brands: null,
  skills: 'question_OY5qqA',
  skillsCheckboxPrefix: 'question_OY5qqA_',
  skillsOther: 'question_JDAjj7',
  traits: 'question_GDdEEz',
  traitsCheckboxPrefix: 'question_GDdEEz_',
  traitsOther: 'question_MYzZZ0',
  languageCompetencies: 'question_odMNNM',
  languageCompetenciesPrefix: 'question_odMNNM_',
  languageCompetenciesOther: ['question_1v700L', 'question_BDkoW4', 'question_vLy65X'],
  bio: 'question_lWd226',
  // Copy block on aQPkGW — short keys vary; prefer map when known, else label match.
  headline: null,
  greeting: null,
  aboutLead: null,
  experienceSummary: null,
  style: 'question_PY5QN0',
  palette: 'question_OY5qKp',
  font: null,
  domainOwned: 'question_EDQVGL',
  domainAddress: 'question_rLA9QL',
  domainDesired: 'question_4vx0Yo',
  domainExtension: 'question_jWQ4r9',
  domainExtensionCustom: 'question_2vNdYb',
  localeCheckboxes: 'question_VY57aE',
  university: 'question_lWd2Xp',
  fieldOfStudy: 'question_DDdO9j',
  isStudent: 'question_YYWBX6',
  professionalStatus: 'question_YYWBX6',
  studyBlocks: [
    {
      field: 'question_DDdO9j',
      university: 'question_lWd2Xp',
      start: 'question_VY577l',
      end: 'question_PY5QQ0',
    },
    {
      field: 'question_MYzZ20',
      university: 'question_JDAjr7',
      start: 'question_EDQVVL',
      end: 'question_rLA99L',
    },
    {
      field: 'question_2vNddb',
      university: 'question_xyabb9',
      start: 'question_ZY6kkv',
      end: 'question_NYWNNb',
    },
  ],
  heroImage: 'question_djxGGN',
  event1Image: 'question_4vx0YB',
  event1Title: 'question_aEYJJy',
  event1Brand: 'question_odMN85',
  event1Description: 'question_xyab79',
  event1Date: 'question_ZY6kAv',
  event2Image: 'question_jWQ4r6',
  event2Title: 'question_7v200z',
  event2Brand: 'question_GDdEOQ',
  event2Description: 'question_NYWNxb',
  event2Date: 'question_qWAQqk',
  event3Image: 'question_2vNdYA',
  event3Title: 'question_ADLRRN',
  event3Brand: 'question_OY5qxk',
  event3Description: 'question_QY59qk',
  event3Date: 'question_9vD0Y4',
  event4Image: 'question_xyab7J',
  event4Title: 'question_kW6jjj',
  event4Brand: 'question_VY57WN',
  event4Description: 'question_e2eOGo',
  event4Date: 'question_WY5b6Q',
  event5Image: 'question_RY5eQP',
  event5Title: 'question_KDl22K',
  event5Brand: 'question_PY5QZP',
  event5Description: 'question_aEYJ1y',
  event5Date: 'question_6v20Y5',
  event6Image: 'question_odMNZM',
  event6Title: 'question_pWBqqE',
  event6Brand: 'question_EDQVoA',
  event6Description: 'question_7v20Yz',
  event6Date: 'question_brxRME',
  employment1Title: 'question_BDkoYY',
  employment1Company: 'question_88QDbo',
  employment1Start: 'question_yv9AbW',
  employment1End: 'question_XYWA7V',
  employment1Duties: 'question_kW6j4j',
  employment1Ongoing: 'question_YYWBlz',
  employment2Title: 'question_KDl24K',
  employment2Company: 'question_0v60qQ',
  employment2Start: 'question_88QDDo',
  employment2End: 'question_0v600Q',
  employment2Duties: 'question_LYWxj2',
  employment2Ongoing: 'question_DDdO6X',
  employment3Title: 'question_OY5qZA',
  employment3Company: 'question_zJDB8E',
  employment3Start: 'question_zJDBBE',
  employment3End: 'question_5v100b',
  employment3Duties: 'question_VY57al',
  employment3Ongoing: 'question_lWd2kV',
  wantsEmploymentHistory: 'question_GDdEVz',
  wantsEducationInfo: 'question_jWQ449',
  contactRef: 'question_RY5eeP',
  video1: 'question_7v2076',
  video1Event: 'question_2vNd9g',
  video2: 'question_QY59Nl',
  video2Event: 'question_9vD0AK',
  video3: 'question_WY5baL',
  video3Event: 'question_NYWN2N',
  video4: 'question_ZY6kbA',
  video4Event: 'question_aEYJpW',
  video5: 'question_jWQ48Y',
  video5Event: 'question_brxR10',
  video6: 'question_yv9AAW',
  video6Event: 'question_rLA98p',
  height: 'question_zJDB48',
  dressSize: 'question_5v10oP',
  hairColor: 'question_djxGXy',
  eyeColor: 'question_rLA9Q5',
  drivingLicense: 'question_RY5e1p',
  hasCar: 'question_odMNYX',
};

/** Retired production form — evaluation fixtures only. */
export const TALLY_FIELD_MAP_LEGACY_44dDEb = {
  legalName: 'question_QdZ2Mp',
  displayName: 'question_9OkGXY',
  phone: 'question_eLJZDO',
  email: 'question_WPW9ra',
  instagram: 'question_a0LNeq',
  tiktok: 'question_6RlJeB',
  linkedin: 'question_7oAlbA',
  facebook: 'question_ELRLLo',
  location: 'question_bLpV9o',
  workCities: 'question_AxgPKk',
  languages: 'question_1MePdW',
  experienceSince: 'question_gLljdd',
  eventTypes: 'question_yxQZ24',
  brands: 'question_XEalJ4',
  skills: 'question_qOrOO2',
  skillsCheckboxPrefix: 'question_qOrOO2_',
  skillsOther: null,
  traits: 'question_qOrOO2',
  traitsCheckboxPrefix: null,
  traitsOther: null,
  languageCompetencies: null,
  languageCompetenciesPrefix: null,
  languageCompetenciesOther: [],
  bio: 'question_2LWyOD',
  style: 'question_eLJp5Q',
  palette: 'question_RRNKMJ',
  font: null,
  domainOwned: 'question_4L6qWb',
  domainAddress: 'question_jLRpdR',
  domainDesired: 'question_2LWZqp',
  domainExtension: 'question_x2qokG',
  domainExtensionCustom: 'question_Zl7g40',
  localeCheckboxes: 'question_ELRzdN',
  university: 'question_pGExyb',
  fieldOfStudy: 'question_LXr171',
  isStudent: 'question_KLEQe7',
  professionalStatus: 'question_KLEQe7',
  studyBlocks: [
    { field: 'question_LXr171', university: 'question_pGExyb', start: null, end: null },
  ],
  heroImage: null,
  event1Image: 'question_4L6LLb',
  event1Title: null,
  event1Brand: null,
  event1Description: 'question_D58P0N',
  event1Date: 'question_lLG1VN',
  event2Image: 'question_jLRLLR',
  event2Title: null,
  event2Brand: null,
  event2Description: 'question_RRNa84',
  event2Date: 'question_ooP1lO',
  event3Image: 'question_2LWLLp',
  event3Title: null,
  event3Brand: null,
  event3Description: 'question_GLG4YL',
  event3Date: 'question_OL298Y',
  event4Image: 'question_x2q22G',
  event4Title: null,
  event4Brand: null,
  event4Description: 'question_VVeAoM',
  event4Date: 'question_Plxe8B',
  event5Image: 'question_Zl7ll0',
  event5Title: null,
  event5Brand: null,
  event5Description: 'question_ELRE8B',
  event5Date: 'question_rV4122',
  event6Image: 'question_NLjLLG',
  event6Title: null,
  event6Brand: null,
  event6Description: 'question_4L6yPA',
  event6Date: 'question_jLRYGJ',
  contactRef: 'question_XEjjAL',
  video1: 'question_KDY8EK',
  video1Event: 'question_OYDKWa',
  video2: 'question_PYdLa1',
  video2Event: 'question_EDke4l',
  video3: 'question_4v4Rgr',
  video3Event: 'question_jWaXOQ',
  video4: 'question_xyXEed',
  video4Event: 'question_RYG174',
  video5: 'question_GDxa2L',
  video5Event: 'question_OYDKWY',
  video6: 'question_PYdLaB',
  video6Event: 'question_EDke4B',
  height: 'question_BZy4KN',
  dressSize: 'question_k5oa9M',
  hairColor: 'question_v4ZjrQ',
  eyeColor: 'question_rV4VVM',
  drivingLicense: 'question_ML4KNX',
  hasCar: 'question_JLPKpd',
  wantsEmploymentHistory: null,
  wantsEducationInfo: null,
};

/** Develop / test Tally form QKWPy8 */
export const TALLY_FIELD_MAP_DEV = {
  firstName: 'question_PYDDK0',
  lastName: 'question_ED554A',
  legalName: null,
  displayName: 'question_ED559L',
  phone: 'question_rLBB7L',
  email: 'question_4vBB5o',
  instagram: 'question_yvNNW6',
  tiktok: 'question_XYrrKe',
  linkedin: 'question_4vBBgd',
  facebook: 'question_xyjjKE',
  location: 'question_jWbbN9',
  workCities: 'question_2vBB0b',
  languages: null,
  languagePairs: [
    ['question_odDD4N', 'question_GDKK2O'],
    ['question_VYjjk6', 'question_PYDDax'],
    ['question_rLBBxX', 'question_4vBBg5'],
    ['question_2vBBMM', 'question_xyjjek'],
    ['question_NYDDKp', 'question_qWaax5'],
  ],
  experienceSince: 'question_rLBB7p',
  eventTypes: null,
  brands: null,
  skills: 'question_6veeao',
  skillsCheckboxPrefix: 'question_6veeao_',
  skillsOther: 'question_PYDDaP',
  traits: 'question_aEee7W',
  traitsCheckboxPrefix: 'question_aEee7W_',
  traitsOther: 'question_VYjjkN',
  languageCompetencies: 'question_WYrrxL',
  languageCompetenciesPrefix: 'question_WYrrxL_',
  languageCompetenciesOther: ['question_OYllWk', 'question_YYRREv', 'question_lWqqoX'],
  bio: 'question_9vXXbK',
  headline: 'question_qWaa08',
  greeting: 'question_QYMMPl',
  aboutLead: 'question_djNNBD',
  experienceSummary: 'question_MYDD9E',
  style: 'question_br99P0',
  palette: 'question_4vBB5d',
  font: null,
  domainOwned: 'question_ADKKZo',
  domainAddress: 'question_BDKKM4',
  domainDesired: 'question_kW99Md',
  domainExtension: 'question_vLrroX',
  domainExtensionCustom: 'question_KDeedz',
  localeCheckboxes: 'question_jWbbNY',
  university: 'question_VYjjgN',
  fieldOfStudy: 'question_OYllvk',
  isStudent: 'question_GDKKWQ',
  professionalStatus: 'question_GDKKWQ',
  studyBlocks: [
    {
      field: 'question_OYllvk',
      university: 'question_VYjjgN',
      start: 'question_7vbb66',
      end: 'question_br99b0',
    },
    {
      field: 'question_VYjj2N',
      university: 'question_PYDDVP',
      start: 'question_ADKK1o',
      end: 'question_BDKKP4',
    },
    {
      field: 'question_KDeeqz',
      university: 'question_LYzzQz',
      start: 'question_pWddly',
      end: 'question_1vkk14',
    },
  ],
  heroImage: 'question_NYDDGN',
  event1Image: 'question_NYDDkN',
  event1Title: 'question_88zz0k',
  event1Brand: 'question_WYrrGR',
  event1Description: 'question_LYzzRz',
  event1Date: 'question_pWdd8y',
  event2Image: 'question_qWaa68',
  event2Title: 'question_zJNNaZ',
  event2Brand: 'question_aEeeb2',
  event2Description: 'question_1vkkq4',
  event2Date: 'question_MYDDoE',
  event3Image: 'question_QYMMLl',
  event3Title: 'question_djNN5D',
  event3Brand: 'question_6veebN',
  event3Description: 'question_JDdd5z',
  event3Date: 'question_gZeeKM',
  event4Image: 'question_9vXXVK',
  event4Title: 'question_DDKKlX',
  event4Brand: 'question_7vbbB2',
  event4Description: 'question_yvNNV6',
  event4Date: 'question_XYrrZe',
  event5Image: 'question_e2DD4J',
  event5Title: 'question_RYdd7v',
  event5Brand: 'question_br99B7',
  event5Description: 'question_88zz7k',
  event5Date: 'question_0v77NP',
  event6Image: 'question_WYrryL',
  event6Title: 'question_GDKK2Q',
  event6Brand: 'question_ADKKol',
  event6Description: 'question_zJNNPZ',
  event6Date: 'question_5v44Wv',
  employment1Title: 'question_YYRRNz',
  employment1Company: 'question_jWbbOY',
  employment1Start: 'question_rLBBzp',
  employment1End: 'question_4vBBed',
  employment1Duties: 'question_DDKKgX',
  employment1Ongoing: 'question_odRpPb',
  employment2Title: 'question_RYddEv',
  employment2Company: 'question_2vBBMg',
  employment2Start: 'question_jWbb1Y',
  employment2End: 'question_2vBBQg',
  employment2Duties: 'question_odDDX5',
  employment2Ongoing: 'question_GDpgGe',
  employment3Title: 'question_6veeoo',
  employment3Company: 'question_xyjjeE',
  employment3Start: 'question_xyjjOE',
  employment3End: 'question_ZYooqA',
  employment3Duties: 'question_7vbbG6',
  employment3Ongoing: 'question_OYXg2a',
  wantsEmploymentHistory: 'question_aEeeVW',
  wantsEducationInfo: 'question_kW99Vd',
  contactRef: null,
  video1: 'question_rLBBxp',
  video1Event: 'question_BDKKO1',
  video2: 'question_vLrr74',
  video2Event: 'question_KDee7D',
  video3: 'question_pWddjP',
  video3Event: 'question_1vkkZb',
  video4: 'question_JDddaX',
  video4Event: 'question_gZeeyJ',
  video5: 'question_XYrrVz',
  video5Event: 'question_88zzvr',
  video6: 'question_zJNNpg',
  video6Event: 'question_5v446Q',
  height: 'question_xyjjK9',
  dressSize: 'question_RYddpv',
  hairColor: 'question_odDDW5',
  eyeColor: 'question_ZYoo0A',
  drivingLicense: 'question_PYDDKP',
  hasCar: 'question_ED559A',
};

/**
 * Develop short intake — Tally form Xxd7VP (API-mapped 2026-07-31).
 * Enough for a preview; employment/events/domain omitted (defaults).
 */
export const TALLY_FIELD_MAP_SHORT_INTAKE = {
  firstName: 'question_ADApq0',
  lastName: 'question_BDApLN',
  legalName: null,
  displayName: 'question_BDApQ5',
  phone: 'question_kWKG71',
  email: 'question_vLEDOv',
  instagram: 'question_4vA71O',
  tiktok: 'question_jW5o0E',
  linkedin: 'question_vLED0Q',
  facebook: 'question_YYpGz5',
  location: 'question_KDvxJA',
  workCities: 'question_LYvKJj',
  languages: null,
  languagePairs: null,
  experienceSince: 'question_0v18JN',
  eventTypes: null,
  brands: null,
  skills: null,
  skillsCheckboxPrefix: null,
  skillsOther: null,
  traits: null,
  traitsCheckboxPrefix: null,
  traitsOther: null,
  languageCompetencies: null,
  languageCompetenciesPrefix: null,
  languageCompetenciesOther: null,
  bio: null,
  headline: null,
  greeting: null,
  aboutLead: null,
  experienceSummary: null,
  style: 'question_4vA7Nk',
  palette: null,
  font: null,
  domainOwned: null,
  domainAddress: null,
  domainDesired: null,
  domainExtension: null,
  domainExtensionCustom: null,
  localeCheckboxes: null,
  university: null,
  fieldOfStudy: null,
  isStudent: null,
  professionalStatus: 'question_JDXlJ4',
  studyBlocks: [],
  heroImage: 'question_MYvarX',
  event1Image: 'question_NYM7Ml',
  event1Title: null,
  event1Brand: null,
  event1Description: null,
  event1Date: null,
  event2Image: null,
  event2Title: null,
  event2Brand: null,
  event2Description: null,
  event2Date: null,
  event3Image: null,
  event3Title: null,
  event3Brand: null,
  event3Description: null,
  event3Date: null,
  event4Image: null,
  event4Title: null,
  event4Brand: null,
  event4Description: null,
  event4Date: null,
  contactRef: 'question_XY1oR4',
  employment1Title: null,
  employment1Company: null,
  employment1Duties: null,
  employment1Start: null,
  employment1End: null,
  employment1Ongoing: null,
  employment2Title: null,
  employment2Company: null,
  employment2Duties: null,
  employment2Start: null,
  employment2End: null,
  employment2Ongoing: null,
  employment3Title: null,
  employment3Company: null,
  employment3Duties: null,
  employment3Start: null,
  employment3End: null,
  employment3Ongoing: null,
  height: null,
  dressSize: null,
  hairColor: null,
  eyeColor: null,
  drivingLicense: null,
  hasCar: null,
  wantsEmploymentHistory: null,
  wantsEducationInfo: null,
};

/**
 * Short-form MVP sandbox — Tally form rjRXoX (UUID keys from public form schema, 2026-08-01).
 * Isolated product path → template-hostess-cf-short-form. Do not use for live tip mains.
 */
export const TALLY_FIELD_MAP_SHORT_FORM_MVP = {
  firstName: '5523c015-8779-417f-b95e-48fe90c9e38a',
  lastName: 'c00ff627-db0f-41d7-bb77-bf8f51713395',
  legalName: null,
  displayName: '07dc8ed1-ca3d-4016-8911-0d322c69d650',
  phone: '84e686c1-c677-47ba-ba8a-59bb67407826',
  email: '9ef83859-3b66-4d06-bb77-9e1392583568',
  instagram: '74de28f1-d2e3-498f-98c2-d904ea65e4d0',
  tiktok: '1c73a7ff-eabb-4d5c-9974-4a95267e45e8',
  linkedin: '03dd2edc-c121-4bdc-8386-67a032a778a7',
  facebook: '1b541a51-6375-4e53-aaaa-fb4a26dd481c',
  location: 'dbf9836d-d9b0-412e-8acd-79257d1c44b3',
  workCities: '17834f95-ad0f-40f4-b948-016e32377801',
  languages: null,
  languagePairs: null,
  experienceSince: '7441d4b8-f964-46cc-8f8f-820242282e29',
  eventTypes: null,
  brands: null,
  skills: null,
  skillsCheckboxPrefix: null,
  skillsOther: null,
  traits: null,
  traitsCheckboxPrefix: null,
  traitsOther: null,
  languageCompetencies: null,
  languageCompetenciesPrefix: null,
  languageCompetenciesOther: null,
  bio: null,
  headline: null,
  greeting: null,
  aboutLead: null,
  experienceSummary: null,
  style: 'add15fed-5d13-4003-b31f-cf8e5d80a1a5',
  palette: null,
  font: null,
  domainOwned: null,
  domainAddress: null,
  domainDesired: null,
  domainExtension: null,
  domainExtensionCustom: null,
  localeCheckboxes: null,
  university: null,
  fieldOfStudy: null,
  isStudent: null,
  professionalStatus: '75101b17-e3aa-4768-acb1-e229d0c9bb39',
  studyBlocks: [],
  heroImage: '768b5df1-d213-4541-873c-84f9f42a05d7',
  event1Image: '065a8e07-2696-4cab-bbe5-851ccd782450',
  event1Title: null,
  event1Brand: null,
  event1Description: null,
  event1Date: null,
  event2Image: null,
  event2Title: null,
  event2Brand: null,
  event2Description: null,
  event2Date: null,
  event3Image: null,
  event3Title: null,
  event3Brand: null,
  event3Description: null,
  event3Date: null,
  event4Image: null,
  event4Title: null,
  event4Brand: null,
  event4Description: null,
  event4Date: null,
  contactRef: null,
  employment1Title: null,
  employment1Company: null,
  employment1Duties: null,
  employment1Start: null,
  employment1End: null,
  employment1Ongoing: null,
  employment2Title: null,
  employment2Company: null,
  employment2Duties: null,
  employment2Start: null,
  employment2End: null,
  employment2Ongoing: null,
  employment3Title: null,
  employment3Company: null,
  employment3Duties: null,
  employment3Start: null,
  employment3End: null,
  employment3Ongoing: null,
  height: null,
  dressSize: null,
  hairColor: null,
  eyeColor: null,
  drivingLicense: null,
  hasCar: null,
  wantsEmploymentHistory: null,
  wantsEducationInfo: null,
};

/** @deprecated use resolveFieldMap */
export const TALLY_FIELD_MAP = TALLY_FIELD_MAP_PROD;

/** Known Tally forms only — never fall back to a wrong map. */
export const KNOWN_TALLY_FORM_IDS = Object.freeze(['QKWPy8', 'aQPkGW', '44dDEb', 'Xxd7VP', 'rjRXoX']);

/** Short intake / lite forms — relaxed field-map contract. */
export const LITE_TALLY_FORM_IDS = Object.freeze(['Xxd7VP']);

/** Short-form MVP sandbox forms — relaxed contract + force short-form tip. */
export const MVP_TALLY_FORM_IDS = Object.freeze(['rjRXoX']);

export const SHORT_FORM_MVP_TEMPLATE_REPO = 'template-hostess-cf-short-form';

export function resolveFieldMap(formId) {
  const id = String(formId || '').trim();
  if (id === 'QKWPy8') return TALLY_FIELD_MAP_DEV;
  if (id === 'aQPkGW') return TALLY_FIELD_MAP_PROD;
  if (id === '44dDEb') return TALLY_FIELD_MAP_LEGACY_44dDEb;
  if (id === 'Xxd7VP') return TALLY_FIELD_MAP_SHORT_INTAKE;
  if (id === 'rjRXoX') return TALLY_FIELD_MAP_SHORT_FORM_MVP;
  return null;
}

/** Required non-null map keys for live forms (contract / deploy guards). */
export const REQUIRED_FIELD_MAP_KEYS = Object.freeze([
  'displayName',
  'email',
  'phone',
  'heroImage',
  'style',
  'domainOwned',
  'domainDesired',
  'domainExtension',
  'employment1Title',
  'employment1Company',
  'event1Description',
  'event1Image',
  'studyBlocks',
]);

/** Minimum map bindings for short-intake preview. */
export const REQUIRED_FIELD_MAP_KEYS_LITE = Object.freeze([
  'displayName',
  'email',
  'phone',
  'location',
  'heroImage',
]);

export function assertFieldMapContract(map, formId) {
  if (!map || typeof map !== 'object') {
    throw new Error(`field_map_missing:${formId || 'unknown'}`);
  }
  const formIdNorm = String(formId || '').trim();
  const lite =
    LITE_TALLY_FORM_IDS.includes(formIdNorm) || MVP_TALLY_FORM_IDS.includes(formIdNorm);
  const required = lite ? REQUIRED_FIELD_MAP_KEYS_LITE : REQUIRED_FIELD_MAP_KEYS;
  const missing = required.filter((key) => {
    const value = map[key];
    if (key === 'studyBlocks') return !Array.isArray(value) || value.length < 1;
    return !value;
  });
  if (missing.length) {
    throw new Error(`field_map_incomplete:${formId || 'unknown'}:${missing.join(',')}`);
  }
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}

function generateFallbackId() {
  return Math.random().toString(36).substring(2, 10);
}

export function buildSlug(displayName, submissionId) {
  const cleanName = slugify(displayName);
  const cleanId = slugify(submissionId) || generateFallbackId();
  const baseSlug = cleanName ? `${cleanName}-${cleanId}` : `portfolio-${cleanId}`;
  return baseSlug.slice(0, 80);
}

function fieldValue(fields, key) {
  if (!key) return '';
  const entry = fields[key];
  if (entry == null) return '';
  if (typeof entry === 'object' && 'value' in entry) {
    const value = entry.value;
    if (Array.isArray(value)) return value.join(', ');
    return value == null ? '' : String(value);
  }
  if (Array.isArray(entry)) return entry.join(', ');
  return String(entry);
}

function trimmedFieldValue(fields, key) {
  return fieldValue(fields, key).trim();
}

function normalizeFieldLabel(label) {
  return String(label || '')
    .toLowerCase()
    .replace(/ł/g, 'l')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Prefer mapped question key; fall back to label match (prod copy fields on aQPkGW).
 * @param {Record<string, unknown>} fields
 * @param {string | null | undefined} key
 * @param {string[]} labelMatchers normalized substrings or exact labels
 */
function trimmedFieldValueOrLabel(fields, key, labelMatchers = []) {
  const mapped = trimmedFieldValue(fields, key);
  if (mapped) return mapped;
  const matchers = (labelMatchers || [])
    .map((m) => normalizeFieldLabel(m))
    .filter(Boolean);
  if (!matchers.length) return '';
  for (const entry of Object.values(fields || {})) {
    if (!entry || typeof entry !== 'object') continue;
    const label = normalizeFieldLabel(entry.label);
    if (!label) continue;
    if (!matchers.some((m) => label === m || label.startsWith(`${m} `) || label.includes(m))) {
      continue;
    }
    const raw = 'value' in entry ? entry.value : '';
    if (raw == null) continue;
    const text = Array.isArray(raw) ? raw.join(', ') : String(raw);
    const trimmed = text.trim();
    if (trimmed) return trimmed;
  }
  return '';
}

const ALLOWED_IMAGE_HOSTS = new Set(['storage.tally.so', 'tally.so', 'www.tally.so']);
const DENIED_IMAGE_EXTS = ['.svg', '.svgz', '.gif', '.html', '.htm', '.js', '.mjs', '.pdf', '.xml', '.mp4', '.m4v', '.webm', '.mov'];
const ALLOWED_IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'];
const ALLOWED_VIDEO_EXTS = ['.mp4', '.m4v', '.webm', '.mov'];
const DENIED_VIDEO_EXTS = ['.svg', '.svgz', '.gif', '.html', '.htm', '.js', '.mjs', '.pdf', '.xml', '.exe', '.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'];
const MAX_TEXT = {
  displayName: 120,
  legalName: 160,
  email: 200,
  phone: 40,
  location: 120,
  bio: 2000,
  headline: 500,
  greeting: 500,
  aboutLead: 2000,
  experienceSummary: 4000,
  brands: 500,
  eventTypes: 500,
  eventDescription: 1000,
  domain: 120,
  social: 300,
  university: 200,
  field: 200,
  style: 200,
  palette: 120,
  employment: 500,
};

function truncateText(value, maxLen) {
  const s = String(value ?? '');
  return s.length <= maxLen ? s : s.slice(0, maxLen);
}

function sanitizeMediaUrl(url, { allowedExts, deniedExts }) {
  const raw = String(url || '').trim();
  if (!raw) return '';
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    return '';
  }
  if (parsed.protocol !== 'https:') return '';
  if (parsed.username || parsed.password) return '';
  const host = parsed.hostname.toLowerCase();
  if (/^(localhost|127\.|10\.|192\.168\.|169\.254\.|::1)/i.test(host)) return '';
  if (!ALLOWED_IMAGE_HOSTS.has(host)) return '';
  const pathLower = parsed.pathname.toLowerCase();
  for (const ext of deniedExts) {
    if (pathLower.endsWith(ext)) return '';
  }
  const lastSlash = pathLower.lastIndexOf('/');
  const base = pathLower.slice(lastSlash + 1);
  const dot = base.lastIndexOf('.');
  if (dot > 0) {
    const ext = base.slice(dot);
    if (!allowedExts.includes(ext)) return '';
  }
  return raw;
}

/**
 * Tally sometimes glues multiple signed URLs into one string, duplicating
 * accessToken/signature query keys. Keep the first value of each key.
 */
export function cleanTallyUrl(url) {
  const raw = String(url || '').trim();
  if (!raw || !raw.startsWith('http')) return '';
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    return '';
  }
  const seen = new Set();
  const parts = [];
  for (const pair of parsed.search.slice(1).split('&')) {
    if (!pair || !pair.includes('=')) continue;
    const eq = pair.indexOf('=');
    const key = pair.slice(0, eq);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    parts.push(pair);
  }
  parsed.search = parts.length ? `?${parts.join('&')}` : '';
  return parsed.toString();
}

function sanitizeAssetUrl(url) {
  return sanitizeMediaUrl(cleanTallyUrl(url), {
    allowedExts: ALLOWED_IMAGE_EXTS,
    deniedExts: DENIED_IMAGE_EXTS,
  });
}

function sanitizeVideoUrl(url) {
  return sanitizeMediaUrl(cleanTallyUrl(url), {
    allowedExts: ALLOWED_VIDEO_EXTS,
    deniedExts: DENIED_VIDEO_EXTS,
  });
}

/** Collect raw http(s) URL strings from a FILE_UPLOAD field value. */
function collectRawUploadUrls(raw) {
  const out = [];
  const push = (value) => {
    const s = String(value || '').trim();
    if (!s) return;
    if (s.includes(',http')) {
      for (const part of s.split(/,(?=https?:\/\/)/)) {
        const u = part.trim();
        if (u.startsWith('http')) out.push(u);
      }
      return;
    }
    if (s.startsWith('http')) out.push(s);
  };

  if (typeof raw === 'string') {
    push(raw);
  } else if (Array.isArray(raw)) {
    for (const item of raw) {
      if (typeof item === 'string') push(item);
      else if (item && typeof item === 'object' && typeof item.url === 'string') push(item.url);
    }
  } else if (raw && typeof raw === 'object' && typeof raw.url === 'string') {
    push(raw.url);
  }
  return out;
}

function fileUploadUrls(fields, key) {
  if (!key) return [];
  const entry = fields[key];
  if (entry == null) return [];
  const raw = typeof entry === 'object' && 'value' in entry ? entry.value : entry;
  const urls = [];
  const seen = new Set();
  for (const candidate of collectRawUploadUrls(raw)) {
    const cleaned = sanitizeAssetUrl(candidate);
    if (!cleaned || seen.has(cleaned)) continue;
    seen.add(cleaned);
    urls.push(cleaned);
  }
  return urls;
}

function fileUploadUrl(fields, key) {
  return fileUploadUrls(fields, key)[0] || '';
}

/** Count image-like FILE_UPLOAD answers (excludes video prompts). */
export function countImageFileUploads(fields) {
  let count = 0;
  for (const entry of Object.values(fields || {})) {
    if (!entry || typeof entry !== 'object') continue;
    if (String(entry.type || '') !== 'FILE_UPLOAD') continue;
    const label = String(entry.label || '').toLowerCase();
    if (/filmik|video|mp4|mov|webm/.test(label)) continue;
    const raw = entry.value;
    const hasUrl = typeof raw === 'string'
      ? raw.startsWith('http')
      : Array.isArray(raw)
        ? Boolean(raw[0])
        : Boolean(raw && raw.url);
    if (hasUrl) count += 1;
  }
  return count;
}

export function encodeAssetsTransport(assets) {
  try {
    return Buffer.from(JSON.stringify(assets || {}), 'utf8').toString('base64url');
  } catch {
    return '';
  }
}

export function decodeAssetsTransport(encoded) {
  const raw = String(encoded || '').trim();
  if (!raw) return null;
  try {
    const json = Buffer.from(raw, 'base64url').toString('utf8');
    const parsed = JSON.parse(json);
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      hero: parsed.hero || null,
      events: Array.isArray(parsed.events) ? parsed.events : [],
      videos: Array.isArray(parsed.videos) ? parsed.videos : [],
    };
  } catch {
    return null;
  }
}

export function assetsHaveUsableMedia(assets) {
  if (!assets || typeof assets !== 'object') return false;
  if (assets.hero) return true;
  if (Array.isArray(assets.events) && assets.events.some(Boolean)) return true;
  return false;
}

function videoUploadUrl(fields, key) {
  const entry = fields[key];
  if (entry == null) return '';
  const raw = typeof entry === 'object' && 'value' in entry ? entry.value : entry;
  let candidate = '';
  if (typeof raw === 'string' && raw.startsWith('http')) candidate = raw;
  else if (Array.isArray(raw)) {
    const first = raw[0];
    if (typeof first === 'string' && first.startsWith('http')) candidate = first;
    else if (first && typeof first.url === 'string') candidate = first.url;
  } else if (raw && typeof raw === 'object' && typeof raw.url === 'string') {
    candidate = raw.url;
  }
  return sanitizeVideoUrl(candidate);
}

function parseEventIndex(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  const numbered = raw.match(/(?:wydarzenie|event)\s*([1-6])/i);
  if (numbered) return Number(numbered[1]);
  const digit = raw.match(/\b([1-6])\b/);
  if (digit) return Number(digit[1]);
  return null;
}

function collectEventVideos(fields, map) {
  const byEvent = new Map();

  const tryAdd = (url, eventHint) => {
    const safe = sanitizeVideoUrl(url);
    if (!safe) return;
    const eventIndex = parseEventIndex(eventHint);
    if (!eventIndex) return;
    byEvent.set(eventIndex, safe);
  };

  for (let index = 1; index <= 6; index += 1) {
    const fileKey = map[`video${index}`];
    const eventKey = map[`video${index}Event`];
    if (!fileKey) continue;
    tryAdd(videoUploadUrl(fields, fileKey), trimmedFieldValue(fields, eventKey) || String(index));
  }

  const uploadKeys = [];
  const eventHintKeys = [];
  for (const [key, entry] of Object.entries(fields)) {
    if (!key.startsWith('question_')) continue;
    const label = String(entry?.label || '').toLowerCase();
    const type = String(entry?.type || '');
    if (type === 'FILE_UPLOAD' && /załącz filmik|zalacz filmik|attach.*video|filmik/i.test(label)) {
      uploadKeys.push(key);
    }
    if (
      (type === 'INPUT_TEXT' || type === 'MULTIPLE_CHOICE' || type === 'DROPDOWN') &&
      /którego wydarzenia|ktorego wydarzenia|which event|wydarzenia chcesz/i.test(label)
    ) {
      eventHintKeys.push(key);
    }
  }
  uploadKeys.sort();
  eventHintKeys.sort();
  for (let i = 0; i < uploadKeys.length; i += 1) {
    const url = videoUploadUrl(fields, uploadKeys[i]);
    if (!url) continue;
    const hint = trimmedFieldValue(fields, eventHintKeys[i] || '') || String(i + 1);
    tryAdd(url, hint);
  }

  return [...byEvent.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([eventIndex, url]) => ({ eventIndex, url }));
}

function splitList(value) {
  return String(value)
    .split(/[,;]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function parseLanguages(value, fields, map) {
  if (map.languagePairs?.length) {
    const langs = [];
    for (const [nameKey, levelKey] of map.languagePairs) {
      const name = trimmedFieldValue(fields, nameKey);
      const level = trimmedFieldValue(fields, levelKey);
      // Never invent a CEFR level — skip incomplete pairs.
      if (!name || !level) continue;
      langs.push({ name, level });
    }
    if (langs.length > 0) return langs;
  }
  return splitList(value)
    .map((chunk) => {
      const match = chunk.match(/^(.+?)\s+([A-C][12]|native|Native|BASIC|Basic)$/i);
      if (!match) return null;
      return {
        name: match[1].trim(),
        level: match[2].toUpperCase() === 'NATIVE' ? 'Native' : match[2].toUpperCase(),
      };
    })
    .filter(Boolean);
}

function parseLocales(checkboxValue) {
  const raw = String(checkboxValue).toLowerCase();
  const locales = [];
  if (raw.includes('angielska') || raw.includes('english') || raw.includes('en')) locales.push('en');
  if (raw.includes('hiszpańska') || raw.includes('spanish') || raw.includes('es')) locales.push('es');
  if (!locales.includes('pl')) locales.push('pl');
  return [...new Set(locales)];
}

function parseExtras(checkboxValue) {
  const raw = String(checkboxValue).toLowerCase();
  return {
    englishVersion: /angielska|english|\ben\b/.test(raw),
    spanishVersion: /hiszpańska|spanish|\bes\b/.test(raw),
    eventVideos: /filmik|video wydarzen|event video/.test(raw),
  };
}

function normalizePhone(value) {
  const trimmed = String(value).trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('+')) return trimmed;
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return trimmed;
  return `+${digits}`;
}

function normalizeSocial(value) {
  const trimmed = String(value).trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.includes('linkedin.com')) {
    const path = trimmed.replace(/^.*linkedin\.com/i, 'linkedin.com');
    return `https://${path.replace(/^\/\//, '')}`;
  }
  if (trimmed.includes('facebook.com')) {
    return trimmed.startsWith('http') ? trimmed : `https://${trimmed.replace(/^\/\//, '')}`;
  }
  if (trimmed.includes('instagram.com') || trimmed.startsWith('@')) {
    const handle = trimmed.replace(/^@/, '').replace(/^.*instagram\.com\//, '');
    return `https://instagram.com/${handle}`;
  }
  return trimmed;
}

function paletteToColors(palette) {
  const lower = String(palette).toLowerCase();
  if (lower.includes('black')) {
    return { themeColor: '#111827', backgroundColor: '#F9FAFB' };
  }
  return { themeColor: '#C4A46B', backgroundColor: '#FDFAF6' };
}

export function extractFields(input) {
  let foundId = '';
  if (input) {
    foundId =
      input.id ||
      input.submissionId ||
      input.responseId ||
      input.eventId ||
      input.data?.submissionId ||
      input.data?.responseId ||
      input.data?.eventId ||
      input.data?.id ||
      '';
  }

  if (input?.data?.fields && Array.isArray(input.data.fields)) {
    const map = {};
    const fieldOrder = [];
    for (const field of input.data.fields) {
      if (!field?.key) continue;
      map[field.key] = field;
      fieldOrder.push(field.key);
    }
    return {
      submissionId: foundId,
      fields: map,
      fieldOrder,
      formId: input.formId || input.data?.formId || discoverFormIdFromFields(map) || '',
    };
  }

  const fields = {};
  const fieldOrder = [];
  for (const [key, value] of Object.entries(input || {})) {
    // Classic Tally keys + UUID keys used by newer forms (e.g. rjRXoX).
    const isQuestion = key.startsWith('question_');
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key);
    if (!isQuestion && !isUuid) continue;
    fields[key] = value;
    fieldOrder.push(key);
  }
  return {
    submissionId: foundId,
    fields,
    fieldOrder,
    formId: input?.formId || input?.data?.formId || discoverFormIdFromFields(fields) || '',
  };
}

/** Ordered [key, entry] pairs — form order when available (never localeCompare keys). */
export function orderedFieldEntries(fields, fieldOrder) {
  const order = Array.isArray(fieldOrder) && fieldOrder.length
    ? fieldOrder
    : Object.keys(fields || {});
  const seen = new Set();
  const entries = [];
  for (const key of order) {
    if (!key || seen.has(key) || !fields?.[key]) continue;
    seen.add(key);
    entries.push([key, fields[key]]);
  }
  for (const [key, entry] of Object.entries(fields || {})) {
    if (seen.has(key)) continue;
    entries.push([key, entry]);
  }
  return entries;
}

function entryTextValue(entry) {
  if (entry == null) return '';
  if (typeof entry === 'object' && 'value' in entry) {
    const value = entry.value;
    if (Array.isArray(value)) return value.map((v) => (v == null ? '' : String(v))).join(', ').trim();
    return value == null ? '' : String(value).trim();
  }
  if (Array.isArray(entry)) return entry.map((v) => (v == null ? '' : String(v))).join(', ').trim();
  return String(entry).trim();
}

/** Classify repeated Tally labels into employment slot roles. */
export function classifyEmploymentRole(label) {
  const n = normalizeFieldLabel(label);
  if (!n) return null;
  if (/czy chcesz|dodac kolejne|add another|histori.*zatrudnienia|employment history/.test(n)) return null;
  if (/dalej pracujesz|nadal pracujesz|still (in|working)|currently (in this role|working)|obecnie pracujesz|czy dalej/.test(n)) {
    return 'ongoing';
  }
  if (/stanowisko|job title|position title|^position$|^role$/.test(n)) return 'title';
  if (/nazwa firmy|company name|employer|pracodawc|^firma$|^company$/.test(n)) return 'company';
  if (/zakres obowiazk|duties|responsibilit|opis stanowiska|job description/.test(n)) return 'duties';
  if (/data rozpoczecia|start date|od kiedy/.test(n) && !/hostess|stud/.test(n)) return 'start';
  if (/data zakonczenia|end date|do kiedy/.test(n) && !/stud/.test(n)) return 'end';
  return null;
}

/** Classify study block labels. */
export function classifyStudyRole(label) {
  const n = normalizeFieldLabel(label);
  if (!n) return null;
  // Exclude gate questions like "Czy chcesz dodać kolejny kierunek studiów?"
  if (/czy chcesz|dodac kolejny|add another|informacje o studiach|study information/.test(n)) return null;
  if (/kierunek stud|^kierunek$|field of study|major/.test(n)) return 'field';
  if (/uczelnia|university|university name|szkola wyzsza/.test(n)) return 'university';
  if (/rok rozpoczecia stud|start.*stud|poczatek stud/.test(n)) return 'start';
  if (/rok zakonczenia stud|przewidywany rok zakonczenia|end.*stud|koniec stud/.test(n)) return 'end';
  return null;
}

/** Classify portfolio event labels (numbered opis/data preferred for slot breaks). */
export function classifyEventRole(label) {
  const n = normalizeFieldLabel(label);
  if (!n) return null;
  // Exclude "Czy chcesz dodać kolejne wydarzenie?"
  if (/czy chcesz|dodac kolejne|add another|add (a )?next/.test(n)) return null;
  if (/^wydarzenie\s*\d*$/.test(n) || /^event\s*\d*$/.test(n) || /^wydarzenie$/.test(n)) return 'image';
  if (/tytul wydarzenia|event title|^tytul$/.test(n)) return 'title';
  if (/marka.*wspolprac|brand.*work|^marka$|^brand$/.test(n)) return 'brand';
  if (/opis wydarzenia|event description/.test(n)) return 'description';
  if (/data wydarzenia|event date/.test(n)) return 'date';
  return null;
}

/**
 * Walk fields in form order and group repeated employment questions into slots.
 * Survives wrong/cross-wired question IDs in the field map.
 */
export function discoverEmploymentByOrder(fields, fieldOrder) {
  const slots = [];
  let current = null;

  const pushCurrent = () => {
    if (!current) return;
    if (!current.title && !current.company) {
      current = null;
      return;
    }
    slots.push(current);
    current = null;
  };

  for (const [, entry] of orderedFieldEntries(fields, fieldOrder)) {
    const label = String(entry?.label || '');
    const role = classifyEmploymentRole(label);
    if (!role) continue;
    const value = entryTextValue(entry);

    if (role === 'title') {
      pushCurrent();
      current = {
        title: value,
        company: '',
        start: '',
        end: '',
        duties: '',
        ongoing: null,
      };
      continue;
    }

    if (!current) {
      if (role === 'company' && value) {
        current = { title: '', company: value, start: '', end: '', duties: '', ongoing: null };
      }
      continue;
    }

    if (role === 'ongoing') {
      current.ongoing = parseYesNo(value);
      continue;
    }
    if (role === 'company' || role === 'start' || role === 'end' || role === 'duties') {
      if (!current[role] || role === 'duties') current[role] = value;
    }
  }
  pushCurrent();
  return slots.slice(0, 3);
}

/**
 * Walk fields in form order and group study questions into slots.
 */
export function discoverStudiesByOrder(fields, fieldOrder) {
  const slots = [];
  let current = null;

  const pushCurrent = () => {
    if (!current) return;
    // Kierunek required — university-only rows are not studies.
    if (!String(current.field || '').trim()) {
      current = null;
      return;
    }
    slots.push(current);
    current = null;
  };

  for (const [, entry] of orderedFieldEntries(fields, fieldOrder)) {
    const label = String(entry?.label || '');
    const role = classifyStudyRole(label);
    if (!role) continue;
    const value = entryTextValue(entry);

    if (role === 'field') {
      pushCurrent();
      current = { field: value, university: '', start: '', end: '' };
      continue;
    }
    if (!current) continue;
    if (role === 'university' || role === 'start' || role === 'end') {
      if (!current[role]) current[role] = value;
    }
  }
  pushCurrent();
  return slots.slice(0, 3);
}

/**
 * Walk fields in form order and group event questions into slots.
 */
export function discoverEventsByOrder(fields, fieldOrder) {
  const slots = [];
  let current = null;

  const emptySlot = () => ({ title: '', brand: '', description: '', date: '', imageUrl: null });

  const pushCurrent = () => {
    if (!current) return;
    if (!current.description && !current.date && !current.imageUrl && !current.title && !current.brand) {
      current = null;
      return;
    }
    slots.push(current);
    current = null;
  };

  for (const [key, entry] of orderedFieldEntries(fields, fieldOrder)) {
    const label = String(entry?.label || '');
    const role = classifyEventRole(label);
    if (!role) continue;

    if (role === 'image') {
      // Numbered "Wydarzenie N" file upload starts a new slot.
      pushCurrent();
      current = emptySlot();
      current.imageUrl = fileUploadUrl(fields, key);
      continue;
    }

    if (!current) current = emptySlot();

    if (role === 'title') {
      // Repeated untitled title fields without a new image: start next slot if this one is filled.
      if (current.title && (current.description || current.date || current.brand || current.imageUrl)) {
        pushCurrent();
        current = emptySlot();
      }
      current.title = entryTextValue(entry);
    } else if (role === 'brand') {
      current.brand = entryTextValue(entry);
    } else if (role === 'description') {
      if (current.description && (current.title || current.date || current.imageUrl)) {
        pushCurrent();
        current = emptySlot();
      }
      current.description = entryTextValue(entry);
    } else if (role === 'date') {
      current.date = entryTextValue(entry);
    }
  }
  pushCurrent();
  return slots.slice(0, 6);
}

/**
 * Verify mapped employment/event keys still point at the expected label roles.
 * @returns {{ key: string, expected: string, got: string, label: string }[]}
 */
export function collectFieldMapLabelMismatches(fields, map) {
  const mismatches = [];
  if (!map || !fields) return mismatches;

  const check = (key, expected, classify) => {
    if (!key || !fields[key]) return;
    const label = String(fields[key].label || '');
    const got = classify(label);
    if (got && got !== expected) {
      mismatches.push({ key, expected, got, label });
    }
  };

  for (let index = 1; index <= 3; index += 1) {
    check(map[`employment${index}Title`], 'title', classifyEmploymentRole);
    check(map[`employment${index}Company`], 'company', classifyEmploymentRole);
    check(map[`employment${index}Duties`], 'duties', classifyEmploymentRole);
    check(map[`employment${index}Start`], 'start', classifyEmploymentRole);
    check(map[`employment${index}End`], 'end', classifyEmploymentRole);
    check(map[`employment${index}Ongoing`], 'ongoing', classifyEmploymentRole);
  }

  for (let index = 1; index <= 6; index += 1) {
    check(map[`event${index}Title`], 'title', classifyEventRole);
    check(map[`event${index}Brand`], 'brand', classifyEventRole);
    check(map[`event${index}Description`], 'description', classifyEventRole);
    check(map[`event${index}Date`], 'date', classifyEventRole);
    check(map[`event${index}Image`], 'image', classifyEventRole);
  }

  const blocks = Array.isArray(map.studyBlocks) ? map.studyBlocks : [];
  for (const block of blocks) {
    check(block.field, 'field', classifyStudyRole);
    check(block.university, 'university', classifyStudyRole);
    check(block.start, 'start', classifyStudyRole);
    check(block.end, 'end', classifyStudyRole);
  }

  return mismatches;
}

/** Recover Tally formId from private storage JWT when the webhook body omits it. */
function discoverFormIdFromFields(fields) {
  for (const entry of Object.values(fields || {})) {
    const raw = typeof entry === 'object' && entry && 'value' in entry ? entry.value : entry;
    const candidates = [];
    if (typeof raw === 'string') candidates.push(raw);
    else if (Array.isArray(raw)) {
      for (const item of raw) {
        if (typeof item === 'string') candidates.push(item);
        else if (item && typeof item.url === 'string') candidates.push(item.url);
      }
    } else if (raw && typeof raw === 'object' && typeof raw.url === 'string') {
      candidates.push(raw.url);
    }
    for (const url of candidates) {
      const match = String(url).match(/[?&]accessToken=([^&]+)/);
      if (!match) continue;
      try {
        const payload = JSON.parse(Buffer.from(match[1].split('.')[1], 'base64url').toString('utf8'));
        if (payload?.formId) return String(payload.formId);
      } catch {
        // ignore malformed tokens
      }
    }
  }
  return '';
}

function checkboxLabel(entry) {
  const label = typeof entry === 'object' && entry?.label ? String(entry.label) : '';
  const match = label.match(/\(([^)]+)\)\s*$/);
  return match?.[1]?.trim() || '';
}

function isChecked(entry) {
  return (
    entry === true ||
    (typeof entry === 'object' && entry !== null && 'value' in entry && entry.value === true)
  );
}

function parseCheckboxGroup(fields, map, { aggregateKey, prefix, otherKeys = [], skipInne = true }) {
  const items = new Set();

  for (const part of splitList(fieldValue(fields, aggregateKey))) {
    if (!part) continue;
    if (skipInne && /^inne$|^other$/i.test(part)) continue;
    items.add(part);
  }

  if (prefix) {
    for (const [key, entry] of Object.entries(fields)) {
      if (!key.startsWith(prefix)) continue;
      if (!isChecked(entry)) continue;
      const label = checkboxLabel(entry);
      if (!label) continue;
      if (skipInne && /^inne$|^other$/i.test(label)) continue;
      items.add(label);
    }
  }

  for (const otherKey of otherKeys) {
    const other = trimmedFieldValue(fields, otherKey);
    if (other) items.add(other);
  }

  return [...items];
}

function parseSkills(fields, map) {
  return parseCheckboxGroup(fields, map, {
    aggregateKey: map.skills,
    prefix: map.skillsCheckboxPrefix || 'question_qOrOO2_',
    otherKeys: map.skillsOther ? [map.skillsOther] : [],
  });
}

function parseTraits(fields, map) {
  if (!map.traits && !map.traitsCheckboxPrefix) return [];
  return parseCheckboxGroup(fields, map, {
    aggregateKey: map.traits,
    prefix: map.traitsCheckboxPrefix,
    otherKeys: map.traitsOther ? [map.traitsOther] : [],
  });
}

function parseLanguageCompetencies(fields, map) {
  if (!map.languageCompetencies && !map.languageCompetenciesPrefix) return [];
  return parseCheckboxGroup(fields, map, {
    aggregateKey: map.languageCompetencies,
    prefix: map.languageCompetenciesPrefix,
    otherKeys: map.languageCompetenciesOther || [],
  });
}

function parseProfessionalStatus(fields, map) {
  const raw = trimmedFieldValue(fields, map.professionalStatus || map.isStudent);
  if (!raw) return '';
  const match = PROFESSIONAL_STATUS_VALUES.find(
    (option) => option.toLowerCase() === raw.toLowerCase(),
  );
  return match || raw.slice(0, 80);
}

function formatEmploymentDateRange(start, end) {
  const s = String(start || '').trim();
  const e = String(end || '').trim();
  if (s && e) return `${s} – ${e}`;
  return s || e || '';
}

function extractYearToken(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) return String(parsed.getFullYear());
  const match = raw.match(/\b(19|20)\d{2}\b/);
  return match?.[0] ?? '';
}

/** Display string: "2023 – 2024" or "2023 – present" (English token; UI localizes). */
function formatEmploymentYearRange(start, end, isOngoing) {
  const startYear = extractYearToken(start);
  const endYear = extractYearToken(end);
  if (isOngoing) {
    return startYear ? `${startYear} – present` : 'present';
  }
  if (startYear && endYear) {
    return startYear === endYear ? startYear : `${startYear} – ${endYear}`;
  }
  return startYear || endYear || '';
}

function parseDateValue(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function isEmploymentOngoing(start, end) {
  const endRaw = String(end || '').trim();
  const startRaw = String(start || '').trim();
  if (!endRaw) return Boolean(startRaw);
  if (/obecnie|present|teraz|current|obecna|nadal|still|w trakcie/i.test(endRaw)) return true;
  const endDate = parseDateValue(endRaw);
  if (endDate && endDate >= new Date()) return true;
  return false;
}

function isStudyOngoing(end, start) {
  const endRaw = String(end || '').trim();
  if (!endRaw) return Boolean(String(start || '').trim());
  if (/obecnie|present|teraz|current|w trakcie|ongoing|en curso/i.test(endRaw)) return true;
  const endDate = parseDateValue(endRaw);
  if (endDate && endDate >= new Date()) return true;
  return false;
}

function parseStudyBlocks(fields, map, professionalStatus, fieldOrder = []) {
  const ordered = discoverStudiesByOrder(fields, fieldOrder);
  const entries = [];

  if (ordered.length) {
    for (let index = 0; index < ordered.length; index += 1) {
      const block = ordered[index];
      const field = truncateText(block.field, MAX_TEXT.field);
      if (!field) continue;
      const university = truncateText(block.university, MAX_TEXT.university);
      const startDate = String(block.start || '').trim();
      const endDate = String(block.end || '').trim();
      entries.push({
        id: `study-${index + 1}`,
        field,
        university,
        startDate,
        endDate,
        isOngoing: isStudyOngoing(endDate, startDate),
      });
    }
  } else {
    const blocks = Array.isArray(map.studyBlocks) ? map.studyBlocks : [];
    for (let index = 0; index < blocks.length; index += 1) {
      const block = blocks[index];
      const field = truncateText(trimmedFieldValue(fields, block.field), MAX_TEXT.field);
      const university = truncateText(trimmedFieldValue(fields, block.university), MAX_TEXT.university);
      const startDate = trimmedFieldValue(fields, block.start);
      const endDate = trimmedFieldValue(fields, block.end);
      // Kierunek required — never emit university-as-degree rows.
      if (!field) continue;
      entries.push({
        id: `study-${index + 1}`,
        field,
        university,
        startDate,
        endDate,
        isOngoing: isStudyOngoing(endDate, startDate),
      });
    }

    if (!entries.length && map.fieldOfStudy) {
      const field = truncateText(trimmedFieldValue(fields, map.fieldOfStudy), MAX_TEXT.field);
      const university = truncateText(trimmedFieldValue(fields, map.university), MAX_TEXT.university);
      if (field) {
        entries.push({
          id: 'study-1',
          field,
          university,
          startDate: '',
          endDate: '',
          isOngoing: /student/i.test(professionalStatus),
        });
      }
    }
  }

  if (/student/i.test(professionalStatus) && entries.length && !entries.some((entry) => entry.isOngoing)) {
    const latest = [...entries].sort(
      (a, b) => Date.parse(b.startDate || '1970') - Date.parse(a.startDate || '1970'),
    )[0];
    if (latest) {
      for (const entry of entries) {
        if (entry.id === latest.id) entry.isOngoing = true;
      }
    }
  }

  return entries;
}

function parseYesNo(value) {
  const v = String(value || '').trim().toLowerCase();
  if (/^(tak|yes|true|1)$/i.test(v)) return true;
  if (/^(nie|no|false|0)$/i.test(v)) return false;
  return null;
}

/** Explicit Tak/Nie gate for optional sections; undefined = unanswered (keep parsed content). */
function parseSectionGate(fields, fieldKey, labelPatterns) {
  const mapped = fieldKey ? trimmedFieldValue(fields, fieldKey) : '';
  const raw = mapped || String(discoverFieldByLabel(fields, labelPatterns) || '');
  if (!raw) return undefined;
  return parseYesNo(raw);
}

/** Discover "Czy dalej pracujesz…" answers in submission field order (not key sort). */
function discoverEmploymentOngoingFlags(fields) {
  const entries = [];
  for (const [key, entry] of Object.entries(fields || {})) {
    const label = String(entry?.label || '');
    if (
      !/dalej\s+pracujesz|nadal\s+pracujesz|still\s+(in|working)|currently\s+(in\s+this\s+role|working)|obecnie\s+pracujesz|czy\s+dalej/i.test(
        label,
      )
    ) {
      continue;
    }
    const indexMatch = label.match(/(?:stanowisku|role|job|pozycj[aiy]|#)\s*(\d+)/i)
      || label.match(/\((\d+)\)\s*$/)
      || label.match(/(\d+)\s*$/);
    entries.push({
      key,
      label,
      answer: parseYesNo(entry?.value),
      slot: indexMatch ? Number(indexMatch[1]) : null,
      order: entries.length,
    });
  }
  const numbered = entries.filter((e) => e.slot != null && e.slot > 0);
  if (numbered.length === entries.length && entries.length > 0) {
    numbered.sort((a, b) => a.slot - b.slot);
    return numbered.map((entry) => entry.answer);
  }
  // Preserve Object.entries insertion order (Tally webhook field order ≈ form order).
  // Never localeCompare keys — that mis-assigns Tak/Nie across jobs (e.g. GDpgGe before odRpPb).
  entries.sort((a, b) => a.order - b.order);
  return entries.map((entry) => entry.answer);
}

function discoverFieldByLabel(fields, patterns) {
  for (const [key, entry] of Object.entries(fields)) {
    const label = String(entry?.label || '');
    if (!patterns.some((re) => re.test(label))) continue;
    const value = entry?.value;
    if (value == null || value === '') continue;
    if (typeof value === 'boolean') return value;
    const text = String(value).trim();
    if (text) return text;
  }
  return '';
}

function parseAppearance(fields, map) {
  const height =
    truncateText(trimmedFieldValue(fields, map.height), 40) ||
    truncateText(String(discoverFieldByLabel(fields, [/wzrost/i, /height/i]) || ''), 40);
  const dressSize =
    truncateText(trimmedFieldValue(fields, map.dressSize), 40) ||
    truncateText(String(discoverFieldByLabel(fields, [/rozmiar\s+ubra/i, /dress\s*size|clothing\s*size/i]) || ''), 40);
  const hairColor =
    truncateText(trimmedFieldValue(fields, map.hairColor), 80) ||
    truncateText(String(discoverFieldByLabel(fields, [/kolor\s+włos/i, /hair\s*colou?r/i]) || ''), 80);
  const eyeColor =
    truncateText(trimmedFieldValue(fields, map.eyeColor), 80) ||
    truncateText(String(discoverFieldByLabel(fields, [/kolor\s+ocz/i, /eye\s*colou?r/i]) || ''), 80);
  return { height, dressSize, hairColor, eyeColor };
}

function parseMobility(fields, map) {
  const licenseRaw =
    trimmedFieldValue(fields, map.drivingLicense) ||
    String(discoverFieldByLabel(fields, [/prawo\s+jazdy/i, /driving\s+licen[cs]e/i]) || '');
  const carRaw =
    trimmedFieldValue(fields, map.hasCar) ||
    String(discoverFieldByLabel(fields, [/posiadasz\s+samoch/i, /have\s+a\s+car|own\s+a\s+car|samochód/i]) || '');
  const licenseYesNo = parseYesNo(licenseRaw);
  const carYesNo = parseYesNo(carRaw);
  return {
    drivingLicense: licenseYesNo === true ? 'yes' : licenseYesNo === false ? '' : truncateText(licenseRaw, 80),
    hasCar: carYesNo === true,
  };
}

function parseEmployment(fields, map, fieldOrder = []) {
  const discoveredOngoing = discoverEmploymentOngoingFlags(fields);
  const orderedSlots = discoverEmploymentByOrder(fields, fieldOrder);

  const buildJob = (index, raw) => {
    const title = String(raw.title || '').trim();
    const company = String(raw.company || '').trim();
    if (!title && !company) return null;
    const start = String(raw.start || '').trim();
    const end = String(raw.end || '').trim();
    const duties = truncateText(raw.duties || '', MAX_TEXT.employment);
    const ongoingFlag = raw.ongoing ?? discoveredOngoing[index];
    const isOngoing = ongoingFlag === null || ongoingFlag === undefined
      ? isEmploymentOngoing(start, end)
      : ongoingFlag === true;
    const endForStore = isOngoing ? '' : end;
    return {
      id: `job-${index + 1}`,
      title: truncateText(title || company, 120),
      company: truncateText(company, 120),
      startDate: start,
      endDate: endForStore,
      date: formatEmploymentYearRange(start, endForStore, isOngoing) || formatEmploymentDateRange(start, endForStore),
      description: duties,
      isOngoing,
    };
  };

  // Prefer form-order discovery — immune to cross-wired title/company map IDs.
  if (orderedSlots.length) {
    return orderedSlots.map((slot, index) => buildJob(index, slot)).filter(Boolean);
  }

  const jobs = [];
  for (let index = 1; index <= 3; index += 1) {
    const title = trimmedFieldValue(fields, map[`employment${index}Title`]);
    const company = trimmedFieldValue(fields, map[`employment${index}Company`]);
    const start = trimmedFieldValue(fields, map[`employment${index}Start`]);
    const end = trimmedFieldValue(fields, map[`employment${index}End`]);
    const duties = truncateText(trimmedFieldValue(fields, map[`employment${index}Duties`]), MAX_TEXT.employment);
    if (!title && !company) continue;
    const mappedOngoing = parseYesNo(trimmedFieldValue(fields, map[`employment${index}Ongoing`]));
    const discovered = discoveredOngoing[index - 1];
    const ongoingFlag = mappedOngoing ?? discovered;
    const job = buildJob(index - 1, {
      title,
      company,
      start,
      end,
      duties,
      ongoing: ongoingFlag,
    });
    if (job) jobs.push(job);
  }
  return jobs;
}

export const TEMPLATE_REPOS = {
  minimal: 'template-hostess-cf',
  modern: 'template-hostess-cf-modern',
  elegant: 'template-hostess-cf-elegant',
  luxury: 'template-hostess-cf-luxury',
  shortForm: 'template-hostess-cf-short-form',
};

export function resolveTemplateChoice(styleRaw) {
  const requestedStyle = String(styleRaw || '').trim();
  const s = requestedStyle.toLowerCase();
  if (/elegan|elegant/.test(s)) {
    return {
      templateKey: 'elegant',
      templateRepo: TEMPLATE_REPOS.elegant,
      styleImplemented: true,
      requestedStyle,
    };
  }
  if (/luksus|luxury/.test(s)) {
    return {
      templateKey: 'luxury',
      templateRepo: TEMPLATE_REPOS.luxury,
      styleImplemented: true,
      requestedStyle,
    };
  }
  if (/nowoczes|modern/.test(s)) {
    return {
      templateKey: 'modern',
      templateRepo: TEMPLATE_REPOS.modern,
      styleImplemented: true,
      requestedStyle,
    };
  }
  if (/minimal/.test(s)) {
    return {
      templateKey: 'minimal',
      templateRepo: TEMPLATE_REPOS.minimal,
      styleImplemented: true,
      requestedStyle,
    };
  }
  return {
    templateKey: 'minimal',
    templateRepo: TEMPLATE_REPOS.minimal,
    styleImplemented: false,
    requestedStyle,
  };
}

function normalizeExtension(fields, map) {
  const custom = trimmedFieldValue(fields, map.domainExtensionCustom);
  if (custom) return custom.replace(/^\./, '');
  return trimmedFieldValue(fields, map.domainExtension).replace(/^\./, '');
}

function deriveDomainMode(fields, map) {
  const desired = trimmedFieldValue(fields, map.domainDesired);
  const owned = trimmedFieldValue(fields, map.domainOwned).toLowerCase();
  const address = trimmedFieldValue(fields, map.domainAddress);
  if (owned.includes('tak') && address) return 'Posiadam domenę';
  if (desired) return 'Własna domena';
  if (owned.includes('nie')) return 'Subdomena hostess.pl';
  return '';
}

function buildEvents(fields, brandsFallback, map, fieldOrder = [], options = {}) {
  const events = [];
  const assets = [];
  const allowEmptyTitle = Boolean(options.allowEmptyTitle);
  const excludeImageUrls = new Set(
    (Array.isArray(options.excludeImageUrls) ? options.excludeImageUrls : [])
      .map((u) => String(u || '').trim())
      .filter(Boolean),
  );
  const orderedSlots = discoverEventsByOrder(fields, fieldOrder);

  const pushEvent = (index, { title, brand, description, date, imageUrl }) => {
    const desc = truncateText(description || '', MAX_TEXT.eventDescription);
    const dateRaw = String(date || '').trim();
    const image = imageUrl || null;
    if (image && excludeImageUrls.has(image)) return;
    if (!desc && !dateRaw && !image && !title && !brand) return;
    let resolvedTitle = String(title || '').trim();
    const resolvedBrand = String(brand || '').trim();
    const imageOnly = Boolean(image) && !resolvedTitle && !resolvedBrand && !desc && !dateRaw;
    if (!resolvedTitle) {
      if (allowEmptyTitle && imageOnly) {
        resolvedTitle = '';
      } else {
        resolvedTitle = resolvedBrand
          || (index === 1 && brandsFallback ? truncateText(brandsFallback, MAX_TEXT.brands) : '')
          || `Event ${index}`;
      }
    }
    resolvedTitle = truncateText(resolvedTitle, MAX_TEXT.brands);
    events.push({
      id: `event-${index}`,
      title: resolvedTitle,
      description: desc,
      date: dateRaw,
      brand: truncateText(resolvedBrand, MAX_TEXT.brands),
      imageFile: `event-${index}.jpg`,
    });
    assets.push(image);
  };

  if (orderedSlots.length) {
    orderedSlots.forEach((slot, i) => {
      pushEvent(i + 1, {
        title: slot.title,
        brand: slot.brand,
        description: slot.description,
        date: slot.date,
        imageUrl: slot.imageUrl ? sanitizeAssetUrl(slot.imageUrl) : null,
      });
    });
    return { events, assets };
  }

  let nextIndex = 1;
  for (let slot = 1; slot <= 6 && nextIndex <= 6; slot += 1) {
    const description = truncateText(
      trimmedFieldValue(fields, map[`event${slot}Description`]),
      MAX_TEXT.eventDescription,
    );
    const date = trimmedFieldValue(fields, map[`event${slot}Date`]);
    const imageUrls = fileUploadUrls(fields, map[`event${slot}Image`]);
    const titleKey = map[`event${slot}Title`];
    const brandKey = map[`event${slot}Brand`];
    const title = titleKey ? trimmedFieldValue(fields, titleKey) : '';
    const brand = brandKey ? trimmedFieldValue(fields, brandKey) : '';

    if (imageUrls.length > 1) {
      // Multi-file gallery (short intake): one image-only event per URL.
      for (const imageUrl of imageUrls) {
        if (nextIndex > 6) break;
        pushEvent(nextIndex, {
          title: '',
          brand: '',
          description: '',
          date: '',
          imageUrl,
        });
        nextIndex += 1;
      }
      continue;
    }

    const imageUrl = imageUrls[0] || '';
    if (!description && !date && !imageUrl && !title && !brand) continue;
    pushEvent(nextIndex, { title, brand, description, date, imageUrl });
    nextIndex += 1;
  }

  return { events, assets };
}

function normalizeRefValue(value) {
  const v = String(value || '').trim();
  if (!v) return '';
  if (/^ref[\s_]/i.test(v)) return v.replace(/\s+/g, '_');
  return v;
}

function extractContactRef(input, fields, map) {
  const mappedKey = map.contactRef;
  if (mappedKey) {
    const direct = trimmedFieldValue(fields, mappedKey);
    if (direct) return normalizeRefValue(direct);
    const prefix = `${mappedKey}_`;
    for (const [key] of Object.entries(fields)) {
      if (key === mappedKey || key.startsWith(prefix)) {
        const v = trimmedFieldValue(fields, key);
        if (v) return normalizeRefValue(v);
      }
    }
  }
  for (const [, entry] of Object.entries(fields)) {
    if (entry?.type !== 'HIDDEN_FIELDS') continue;
    const label = String(entry?.label || '').toLowerCase();
    if (label === 'ref' || label === 'contactref') {
      const v = entry?.value;
      if (v != null && String(v).trim()) return normalizeRefValue(String(v).trim());
    }
  }
  for (const [key, entry] of Object.entries(fields)) {
    if (!key.includes('ref') && entry?.type !== 'HIDDEN_FIELDS') continue;
    if (entry?.type === 'HIDDEN_FIELDS' && String(entry?.label || '').toLowerCase() !== 'ref') continue;
    const v = entry?.value;
    if (v != null && String(v).trim().startsWith('ref_')) return normalizeRefValue(String(v).trim());
  }
  if (input?.hiddenFields?.ref) return normalizeRefValue(input.hiddenFields.ref);
  if (input?.hiddenFields?.contactRef) return normalizeRefValue(input.hiddenFields.contactRef);
  if (input?.queryParams?.ref) return normalizeRefValue(input.queryParams.ref);
  if (input?.queryParams?.contactRef) return normalizeRefValue(input.queryParams.contactRef);
  return '';
}

/**
 * @param {Record<string, unknown>} input Tally webhook body
 * @param {{ callbackUrl?: string }} [options]
 */
export function normalizeTallySubmission(input, options = {}) {
  const formId = input?.formId || input?.data?.formId || extractFields(input).formId;
  const map = resolveFieldMap(formId);
  if (!map) {
    return {
      ok: false,
      error: 'unknown_tally_form_id',
      message: `Unsupported Tally formId "${formId || ''}" — update resolveFieldMap / field maps before accepting submissions`,
      normalized: null,
      repoName: null,
      templateKey: null,
      templateRepo: null,
      githubDispatchPayload: null,
      media: null,
    };
  }
  const { submissionId, fields, fieldOrder } = extractFields(input);
  const formIdForChecks = String(formId || '').trim();
  const skipLabelGuard = MVP_TALLY_FORM_IDS.includes(formIdForChecks);
  const labelMismatches = skipLabelGuard ? [] : collectFieldMapLabelMismatches(fields, map);
  const orderRecovered =
    discoverEmploymentByOrder(fields, fieldOrder).length > 0
    || discoverStudiesByOrder(fields, fieldOrder).length > 0
    || discoverEventsByOrder(fields, fieldOrder).length > 0;
  if (labelMismatches.length > 0 && !orderRecovered) {
    return {
      ok: false,
      error: 'field_map_label_mismatch',
      message: `Field map label mismatch for formId "${formId}": ${labelMismatches
        .slice(0, 5)
        .map((m) => `${m.key} expected ${m.expected} got ${m.got}`)
        .join('; ')}`,
      normalized: null,
      repoName: null,
      templateKey: null,
      templateRepo: null,
      githubDispatchPayload: null,
      media: null,
      labelMismatches,
    };
  }
  const displayName = truncateText(trimmedFieldValue(fields, map.displayName), MAX_TEXT.displayName);
  const legalName = (() => {
    if (map.firstName || map.lastName) {
      const combined = `${trimmedFieldValue(fields, map.firstName)} ${trimmedFieldValue(fields, map.lastName)}`.trim();
      if (combined) return truncateText(combined, MAX_TEXT.legalName);
    }
    return truncateText(trimmedFieldValue(fields, map.legalName) || displayName, MAX_TEXT.legalName);
  })();
  const slug = buildSlug(displayName || legalName, submissionId);
  const contactRef = extractContactRef(input, fields, map);
  const palette = truncateText(trimmedFieldValue(fields, map.palette), MAX_TEXT.palette);
  const colors = paletteToColors(palette);
  const styleRaw = truncateText(trimmedFieldValue(fields, map.style), MAX_TEXT.style);
  const formIdNormEarly = String(formId || '').trim();
  const isMvpEarly = MVP_TALLY_FORM_IDS.includes(formIdNormEarly);
  let templateChoice = resolveTemplateChoice(styleRaw);
  if (isMvpEarly) {
    templateChoice = {
      templateKey: 'modern',
      templateRepo: SHORT_FORM_MVP_TEMPLATE_REPO,
      styleImplemented: true,
      requestedStyle: styleRaw || 'Nowoczesny',
    };
  }
  const brandsFromField = map.brands ? truncateText(trimmedFieldValue(fields, map.brands), MAX_TEXT.brands) : '';
  const isLiteIntake = LITE_TALLY_FORM_IDS.includes(String(formId || '').trim());
  let heroUrl = map.heroImage ? fileUploadUrl(fields, map.heroImage) : '';
  const galleryUrls = map.event1Image ? fileUploadUrls(fields, map.event1Image) : [];
  // Short intake: if no dedicated hero, promote the first gallery photo to hero
  // and keep the rest as portfolio-only events.
  if (!heroUrl && isLiteIntake && galleryUrls[0]) {
    heroUrl = galleryUrls[0];
  }
  const { events, assets: eventAssets } = buildEvents(fields, brandsFromField, map, fieldOrder, {
    allowEmptyTitle: isLiteIntake,
    excludeImageUrls: heroUrl ? [heroUrl] : [],
  });
  const brands = brandsFromField || events.map((e) => e.brand).filter(Boolean).join(', ').slice(0, MAX_TEXT.brands);
  if (!heroUrl) {
    heroUrl = eventAssets.find(Boolean) || null;
  }
  const eventVideos = collectEventVideos(fields, map);
  for (const { eventIndex } of eventVideos) {
    const event = events.find((item) => item.id === `event-${eventIndex}`);
    if (!event) continue;
    event.videoFile = `event-${eventIndex}.mp4`;
  }
  const videoAssets = eventVideos.map(({ eventIndex, url }) => ({
    eventIndex,
    url,
    fileName: `event-${eventIndex}.mp4`,
  }));

  const assets = { hero: heroUrl || null, events: eventAssets, videos: videoAssets };
  const imageUploadCount = countImageFileUploads(fields);
  const hasUsableMedia = assetsHaveUsableMedia(assets);
  // Transport encoding survives n8n URL redaction / cross-workflow stripping.
  const assetsB64 = encodeAssetsTransport(assets);

  if (imageUploadCount > 0 && !hasUsableMedia) {
    return {
      ok: false,
      error: 'media_extraction_failed',
      message: `Form included ${imageUploadCount} image upload(s) but no safe Tally media URL survived normalization`,
      normalized: null,
      repoName: null,
      templateKey: null,
      templateRepo: null,
      githubDispatchPayload: null,
      media: { imageUploadCount, assets, assetsB64: null },
    };
  }

  const localeCheckboxRaw = fieldValue(fields, map.localeCheckboxes);
  const professionalStatus = parseProfessionalStatus(fields, map);
  const employmentGate = parseSectionGate(fields, map.wantsEmploymentHistory, [
    /histori[aęę]\s+zatrudnienia.*spoza/i,
    /employment\s+history.*outside/i,
  ]);
  const educationGate = parseSectionGate(fields, map.wantsEducationInfo, [
    /informacje\s+o\s+studiach/i,
    /add\s+(study|education)\s+information/i,
  ]);
  const employment = employmentGate === false ? [] : parseEmployment(fields, map, fieldOrder);
  const studyEntries = educationGate === false ? [] : parseStudyBlocks(fields, map, professionalStatus, fieldOrder);
  const traits = parseTraits(fields, map);
  const languageCompetencies = parseLanguageCompetencies(fields, map);
  const skills = parseSkills(fields, map);
  const extras = parseExtras(localeCheckboxRaw);
  const appearance = parseAppearance(fields, map);
  const mobility = parseMobility(fields, map);

  const profileText = truncateText(
    trimmedFieldValueOrLabel(fields, map.bio, ['opis profilu']),
    MAX_TEXT.bio,
  );
  const headlineText = trimmedFieldValueOrLabel(fields, map.headline, ['naglowek glowny']);
  const greetingText = trimmedFieldValueOrLabel(fields, map.greeting, ['powitanie']);
  const aboutLeadText = trimmedFieldValueOrLabel(fields, map.aboutLead, [
    'krotkie przedstawienie',
  ]);
  const experienceSummaryText = trimmedFieldValueOrLabel(fields, map.experienceSummary, [
    'opis doswiadczenia',
  ]);

  const formIdNorm = String(formId || '').trim();
  const isMvp = MVP_TALLY_FORM_IDS.includes(formIdNorm);
  const isLite = LITE_TALLY_FORM_IDS.includes(formIdNorm);

  const normalized = {
    submissionId,
    slug,
    contactRef,
    intake: isMvp ? 'mvp' : isLite ? 'lite' : 'full',
    tallyFormId: formIdNorm || null,
    profile: {
      displayName: displayName || legalName,
      legalName,
      email: truncateText(trimmedFieldValue(fields, map.email), MAX_TEXT.email),
      phone: truncateText(normalizePhone(fieldValue(fields, map.phone)), MAX_TEXT.phone),
      location: truncateText(trimmedFieldValue(fields, map.location), MAX_TEXT.location),
      workCities: splitList(fieldValue(fields, map.workCities)).map((c) => truncateText(c, 80)),
      socials: {
        instagram: truncateText(normalizeSocial(fieldValue(fields, map.instagram)), MAX_TEXT.social),
        tiktok: truncateText(normalizeSocial(fieldValue(fields, map.tiktok)), MAX_TEXT.social),
        linkedin: truncateText(normalizeSocial(fieldValue(fields, map.linkedin)), MAX_TEXT.social),
        facebook: truncateText(normalizeSocial(fieldValue(fields, map.facebook)), MAX_TEXT.social),
      },
      professionalStatus,
    },
    bio: {
      short: truncateText(
        profileText || aboutLeadText || 'Professional hostess portfolio.',
        MAX_TEXT.bio,
      ),
    },
    copy: {
      headline: truncateText(headlineText, MAX_TEXT.headline),
      greeting: truncateText(greetingText, MAX_TEXT.greeting),
      profile: truncateText(profileText, MAX_TEXT.bio),
      aboutLead: truncateText(aboutLeadText, MAX_TEXT.aboutLead),
      experienceSummary: truncateText(experienceSummaryText, MAX_TEXT.experienceSummary),
    },
    locales: parseLocales(localeCheckboxRaw),
    languages: parseLanguages(fieldValue(fields, map.languages), fields, map).map((lang) => ({
      name: truncateText(lang.name, 80),
      level: truncateText(lang.level, 40),
    })),
    languageCompetencies: languageCompetencies.map((s) => truncateText(s, 120)),
    skills: skills.map((s) => truncateText(s, 120)),
    traits: traits.map((s) => truncateText(s, 120)),
    appearance,
    mobility,
    employment,
    events,
    experience: {
      since: trimmedFieldValue(fields, map.experienceSince),
      brands,
      eventTypes: truncateText(trimmedFieldValue(fields, map.eventTypes), MAX_TEXT.eventTypes),
    },
    education: {
      entries: studyEntries,
      university: studyEntries[0]?.university || truncateText(trimmedFieldValue(fields, map.university), MAX_TEXT.university),
      field: studyEntries[0]?.field || truncateText(trimmedFieldValue(fields, map.fieldOfStudy), MAX_TEXT.field),
      isStudent:
        studyEntries.some((entry) => entry.isOngoing)
        || /student/i.test(professionalStatus)
        || /tak|yes|true|student/i.test(fieldValue(fields, map.isStudent)),
    },
    branding: {
      palette,
      style: styleRaw,
      font: truncateText(trimmedFieldValue(fields, map.font), 80),
      themeColor: colors.themeColor,
      backgroundColor: colors.backgroundColor,
      templateKey: templateChoice.templateKey,
      templateRepo: templateChoice.templateRepo,
    },
    domain: {
      mode: deriveDomainMode(fields, map),
      address: truncateText(trimmedFieldValue(fields, map.domainAddress), MAX_TEXT.domain),
      desiredName: truncateText(trimmedFieldValue(fields, map.domainDesired), MAX_TEXT.domain),
      extension: truncateText(normalizeExtension(fields, map), 20),
    },
    extras,
    analytics: { siteId: slug, subprojectId: 'hostesswebs' },
    // Keep plain assets for local/dev; also ship assetsB64 for transport safety.
    assets,
    assetsB64,
    templateKey: templateChoice.templateKey,
    templateRepo: templateChoice.templateRepo,
  };

  const callbackUrl =
    (() => {
      if (options.callbackUrl) return options.callbackUrl;
      if (process.env.WF_PROVISION_CALLBACK_URL) return process.env.WF_PROVISION_CALLBACK_URL;
      const base = String(process.env.WEBHOOK_URL || process.env.N8N_HOST || '').replace(/\/$/, '');
      if (!base) throw new Error('provision_callback_url_unresolved');
      const origin = base.startsWith('http') ? base : `https://${base}`;
      return `${origin}/webhook/hostess-provision-callback`;
    })();

  // Prefer transport-safe hostess payload for GitHub Actions (URLs live in assetsB64).
  const hostessForDispatch = {
    ...normalized,
    assets: { hero: null, events: assets.events.map(() => null), videos: [] },
    assetsB64,
  };

  const githubDispatchPayload = {
    submissionId: normalized.submissionId,
    callbackUrl,
    templateRepo: templateChoice.templateRepo,
    assetsB64,
    hostess: JSON.stringify(hostessForDispatch),
  };

  return {
    ok: true,
    normalized,
    repoName: slug,
    templateKey: templateChoice.templateKey,
    templateRepo: templateChoice.templateRepo,
    githubDispatchPayload,
    media: { imageUploadCount, hasUsableMedia, assetsB64 },
  };
}

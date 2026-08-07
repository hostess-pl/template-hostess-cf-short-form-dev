type Locale = 'en' | 'pl' | 'es';
type Status = 'open' | 'detached';
type AnnotationType = 'point' | 'region';
type ReviewRole = 'client' | 'admin';

type ApiComment = {
  id: string;
  message: string;
  page_path: string;
  locale: Locale;
  selector: string;
  rel_x: number;
  rel_y: number;
  rel_w: number | null;
  rel_h: number | null;
  doc_x: number;
  doc_y: number;
  annotation_type: AnnotationType;
  status: Status;
  created_at: string;
};

type PendingComment = {
  temp_id: string;
  message: string;
  page_path: string;
  locale: Locale;
  selector: string;
  rel_x: number;
  rel_y: number;
  rel_w?: number;
  rel_h?: number;
  doc_x: number;
  doc_y: number;
  annotation_type: AnnotationType;
  created_at: string;
};

type RenderComment = {
  key: string;
  id: string;
  message: string;
  selector: string;
  relX: number;
  relY: number;
  relW: number | null;
  relH: number | null;
  docX: number;
  docY: number;
  locale: Locale;
  annotationType: AnnotationType;
  createdAt: string;
  detached: boolean;
  pending: boolean;
};

type PointerStart = {
  x: number;
  y: number;
  target: HTMLElement;
};

let initialized = false;
let gateEnabled = false;
let depositGateReason: string | null = null;
let modeEnabled = false;
let editAuthorized = false;
let authToken = '';
let renderScheduled = false;
let comments: RenderComment[] = [];
let pointerStart: PointerStart | null = null;
let isDragging = false;
let draftRegionEl: HTMLDivElement | null = null;
let reviewLocked = false;
let commentCount = 0;
let submitInFlight = false;
let sendError = '';
let activePinKey: string | null = null;

const MODE_PREFIX = 'review-mode';
const PENDING_PREFIX = 'review-pending';
const AUTH_PREFIX = 'review-auth';
const COMPLETE_PREFIX = 'review-complete';
const DRAG_THRESHOLD = 8;
const MIN_REGION_PX = 12;

function readLocale(): Locale {
  const raw = document.documentElement.lang;
  if (raw === 'pl' || raw === 'es') return raw;
  return 'en';
}

/** Toolbar/UI copy: English for `en`, Polish for everything else (incl. pl/es). */
function uiLocale(): 'en' | 'pl' {
  return readLocale() === 'en' ? 'en' : 'pl';
}

type UiKey =
  | 'gate_feedback_locked'
  | 'gate_awaiting_payment'
  | 'gate_awaiting_ops'
  | 'gate_building'
  | 'gate_unavailable'
  | 'send_production'
  | 'review_submitted'
  | 'feedback_locked_help'
  | 'feedback_enabled'
  | 'feedback_disabled'
  | 'disable'
  | 'enable'
  | 'help_mode_on'
  | 'help_mode_off_auth'
  | 'help_mode_off'
  | 'send_help_ready'
  | 'send_help_need_comment'
  | 'send_help_submitting'
  | 'send_confirm_title'
  | 'send_confirm_body'
  | 'cancel'
  | 'session_expired'
  | 'submit_failed'
  | 'submit_offline'
  | 'code_title'
  | 'code_desc_dev'
  | 'code_desc'
  | 'code_placeholder'
  | 'unlock'
  | 'code_required'
  | 'code_invalid'
  | 'delete'
  | 'delete_confirm'
  | 'delete_failed'
  | 'editor_placeholder_region'
  | 'editor_placeholder_point'
  | 'save'
  | 'success_sent'
  | 'detached'
  | 'saving';

const UI_COPY: Record<'en' | 'pl', Record<UiKey, string>> = {
  en: {
    gate_feedback_locked: 'Feedback window is closed — final build in progress.',
    gate_awaiting_payment: 'Preview unlocks after the deposit is paid.',
    gate_awaiting_ops: 'Preview is being prepared — you will receive a link soon.',
    gate_building: 'Feedback window is closed.',
    gate_unavailable: 'Preview is not available yet.',
    send_production: 'Send for production',
    review_submitted: 'Review submitted',
    feedback_locked_help: 'Feedback is locked while our team prepares production.',
    feedback_enabled: 'Feedback enabled',
    feedback_disabled: 'Feedback disabled',
    disable: 'Disable',
    enable: 'Enable',
    help_mode_on: 'Click to pin · drag to highlight an area.',
    help_mode_off_auth: 'Enable mode to add or delete feedback.',
    help_mode_off: 'Enable mode and enter your feedback code.',
    send_help_ready:
      'When you are done, send your feedback for our team to apply before production.',
    send_help_need_comment: 'Add at least one comment before sending.',
    send_help_submitting: 'Submitting your review…',
    send_confirm_title: 'Send for production?',
    send_confirm_body:
      "We'll notify our team to apply your feedback and prepare production. You won't be able to add more comments after this.",
    cancel: 'Cancel',
    session_expired: 'Session expired. Re-enter your feedback code.',
    submit_failed: 'Could not submit your review. Please try again or contact support.',
    submit_offline: 'Could not submit your review. Check your connection and try again.',
    code_title: 'Enter feedback code',
    code_desc_dev: 'Use dev-admin or dev-client (from .env) to unlock feedback on localhost.',
    code_desc: 'Use the code shared with you to add or delete comments on this preview.',
    code_placeholder: 'Feedback code',
    unlock: 'Unlock',
    code_required: 'Enter your feedback code.',
    code_invalid: 'Invalid code. Try again.',
    delete: 'Delete',
    delete_confirm: 'Delete this feedback comment?',
    delete_failed: 'Could not delete this comment. Check your connection and try again.',
    editor_placeholder_region: 'Describe the change for this highlighted area...',
    editor_placeholder_point: 'Describe the change you want here...',
    save: 'Save',
    success_sent:
      'Your feedback has been sent. Our team will apply your changes and prepare production.',
    detached: 'Detached',
    saving: 'Saving…',
  },
  pl: {
    gate_feedback_locked: 'Okno uwag zostało zamknięte — trwa budowa wersji finalnej.',
    gate_awaiting_payment: 'Podgląd zostanie odblokowany po wpłacie depozytu.',
    gate_awaiting_ops: 'Podgląd jest w przygotowaniu — wkrótce otrzymasz link.',
    gate_building: 'Okno uwag zostało zamknięte.',
    gate_unavailable: 'Podgląd nie jest jeszcze dostępny.',
    send_production: 'Wyślij do produkcji',
    review_submitted: 'Uwagi wysłane',
    feedback_locked_help: 'Uwagi są zablokowane — przygotowujemy wersję produkcyjną.',
    feedback_enabled: 'Tryb uwag włączony',
    feedback_disabled: 'Tryb uwag wyłączony',
    disable: 'Wyłącz',
    enable: 'Włącz',
    help_mode_on: 'Kliknij, by przypiąć · przeciągnij, by zaznaczyć obszar.',
    help_mode_off_auth: 'Włącz tryb, aby dodawać lub usuwać uwagi.',
    help_mode_off: 'Włącz tryb i wpisz kod do uwag.',
    send_help_ready:
      'Gdy skończysz, wyślij uwagi — zespół wprowadzi zmiany przed produkcją.',
    send_help_need_comment: 'Dodaj co najmniej jedną uwagę przed wysłaniem.',
    send_help_submitting: 'Wysyłanie uwag…',
    send_confirm_title: 'Wysłać do produkcji?',
    send_confirm_body:
      'Powiadomimy zespół, aby wprowadził Twoje uwagi i przygotował produkcję. Potem nie będzie można dodawać kolejnych komentarzy.',
    cancel: 'Anuluj',
    session_expired: 'Sesja wygasła. Wpisz ponownie kod do uwag.',
    submit_failed: 'Nie udało się wysłać uwag. Spróbuj ponownie lub skontaktuj się z nami.',
    submit_offline: 'Nie udało się wysłać uwag. Sprawdź połączenie i spróbuj ponownie.',
    code_title: 'Wpisz kod do uwag',
    code_desc_dev: 'Użyj dev-admin lub dev-client (z .env), aby odblokować uwagi lokalnie.',
    code_desc: 'Użyj kodu, który otrzymałaś/otrzymałeś, aby dodawać lub usuwać uwagi.',
    code_placeholder: 'Kod do uwag',
    unlock: 'Odblokuj',
    code_required: 'Wpisz kod do uwag.',
    code_invalid: 'Nieprawidłowy kod. Spróbuj ponownie.',
    delete: 'Usuń',
    delete_confirm: 'Usunąć tę uwagę?',
    delete_failed: 'Nie udało się usunąć uwagi. Sprawdź połączenie i spróbuj ponownie.',
    editor_placeholder_region: 'Opisz zmianę dla zaznaczonego obszaru…',
    editor_placeholder_point: 'Opisz zmianę, którą chcesz wprowadzić…',
    save: 'Zapisz',
    success_sent:
      'Uwagi zostały wysłane. Zespół wprowadzi zmiany i przygotuje wersję produkcyjną.',
    detached: 'Odłączona',
    saving: 'Zapisywanie…',
  },
};

function t(key: UiKey): string {
  return UI_COPY[uiLocale()][key];
}

function pagePath(): string {
  return window.location.pathname;
}

function authKey(): string {
  return `${AUTH_PREFIX}:${window.location.hostname}`;
}

function isPreviewHostname(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return host.startsWith('preview-') && host.endsWith('.workers.dev');
}

function isLocalDevHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return host === 'localhost' || host === '127.0.0.1';
}

function depositGateMessage(reason: string | null): string {
  switch (reason) {
    case 'preview_view':
      return '';
    case 'feedback_locked':
      return t('gate_feedback_locked');
    case 'awaiting_payment':
      return t('gate_awaiting_payment');
    case 'awaiting_ops':
      return t('gate_awaiting_ops');
    case 'building':
      return t('gate_building');
    default:
      return t('gate_unavailable');
  }
}

async function fetchReviewAccess(): Promise<{
  viewable: boolean;
  allowed: boolean;
  feedbackLocked: boolean;
  reason: string | null;
}> {
  const url = new URL(window.location.href);
  if (import.meta.env.DEV && isLocalDevHost(url.hostname)) {
    return { viewable: true, allowed: true, feedbackLocked: false, reason: 'build_feedback' };
  }
  try {
    const response = await fetch('/api/review-access', { credentials: 'same-origin' });
    const data = (await response.json()) as {
      viewable?: boolean;
      allowed?: boolean;
      feedbackLocked?: boolean;
      reason?: string;
    };
    return {
      viewable: Boolean(data.viewable),
      allowed: Boolean(data.allowed),
      feedbackLocked: Boolean(data.feedbackLocked),
      reason: data.reason || null,
    };
  } catch {
    return { viewable: false, allowed: false, feedbackLocked: false, reason: 'unavailable' };
  }
}

function ensureDepositGateBanner(): void {
  const message = depositGateMessage(depositGateReason);
  if (!message) return;
  if (document.getElementById('review-deposit-gate')) return;
  const banner = document.createElement('div');
  banner.id = 'review-deposit-gate';
  banner.className = 'review-deposit-gate';
  banner.textContent = message;
  document.body.appendChild(banner);
}

function removeDepositGateBanner(): void {
  document.getElementById('review-deposit-gate')?.remove();
}

function isReviewGateEnabled(): boolean {
  const url = new URL(window.location.href);
  const flag = (url.searchParams.get('review') || '').toLowerCase();
  if (flag === '0' || flag === 'false' || flag === 'off') return false;

  const reviewAvailable = document.documentElement.dataset.reviewAvailable === '1';
  const previewOrDev =
    reviewAvailable
    || (import.meta.env.DEV && isLocalDevHost(url.hostname))
    || isPreviewHostname(url.hostname);

  // Production builds never expose review UI, even with ?review=1.
  if (!previewOrDev) return false;

  // Explicit ?review=1 still works on preview/dev hosts (gated by previewOrDev above).
  if (flag === '1' || flag === 'true' || flag === 'on') return true;
  // Respect server flag — stable demos deploy with REVIEW_MODE_ENABLED=false.
  if (reviewAvailable) return true;
  if (import.meta.env.DEV && isLocalDevHost(url.hostname)) return true;
  return false;
}

function modeKey(): string {
  return `${MODE_PREFIX}:${pagePath()}:${readLocale()}`;
}

function pendingKey(): string {
  return `${PENDING_PREFIX}:${pagePath()}:${readLocale()}`;
}

function completeKey(): string {
  return `${COMPLETE_PREFIX}:${window.location.hostname}`;
}

function readReviewLocked(): boolean {
  return window.localStorage.getItem(completeKey()) === '1';
}

function saveReviewLocked(value: boolean): void {
  if (value) {
    window.localStorage.setItem(completeKey(), '1');
    return;
  }
  window.localStorage.removeItem(completeKey());
}

function saveModeEnabled(value: boolean): void {
  window.localStorage.setItem(modeKey(), value ? '1' : '0');
}

function readModeEnabled(): boolean {
  const raw = window.localStorage.getItem(modeKey());
  return raw ? raw === '1' : false;
}

function readStoredAuth(): { token: string; role: ReviewRole } | null {
  const raw = window.sessionStorage.getItem(authKey());
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { token?: unknown; role?: unknown };
    if (typeof parsed.token !== 'string' || !parsed.token) return null;
    if (parsed.role !== 'client' && parsed.role !== 'admin') return null;
    return { token: parsed.token, role: parsed.role };
  } catch {
    return null;
  }
}

function saveStoredAuth(token: string, role: ReviewRole): void {
  window.sessionStorage.setItem(authKey(), JSON.stringify({ token, role }));
}

function clearStoredAuth(): void {
  window.sessionStorage.removeItem(authKey());
}

function applyAuthState(): void {
  const stored = readStoredAuth();
  if (!stored) {
    editAuthorized = false;
    authToken = '';
    return;
  }
  editAuthorized = true;
  authToken = stored.token;
}

function readPending(): PendingComment[] {
  const raw = window.localStorage.getItem(pendingKey());
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is PendingComment => {
      if (!item || typeof item !== 'object') return false;
      const row = item as Record<string, unknown>;
      const annotationType = row.annotation_type;
      return (
        typeof row.temp_id === 'string' &&
        typeof row.message === 'string' &&
        typeof row.selector === 'string' &&
        typeof row.rel_x === 'number' &&
        typeof row.rel_y === 'number' &&
        typeof row.doc_x === 'number' &&
        typeof row.doc_y === 'number' &&
        typeof row.page_path === 'string' &&
        (row.locale === 'en' || row.locale === 'pl' || row.locale === 'es') &&
        typeof row.created_at === 'string' &&
        (annotationType === 'point' || annotationType === 'region')
      );
    });
  } catch {
    return [];
  }
}

function writePending(items: PendingComment[]): void {
  window.localStorage.setItem(pendingKey(), JSON.stringify(items));
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function escapeCssToken(value: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value);
  }
  return value.replace(/["\\]/g, '\\$&');
}

function collectAncestorChain(target: HTMLElement): HTMLElement[] {
  const chain: HTMLElement[] = [];
  let current: HTMLElement | null = target;
  while (current && current !== document.body) {
    chain.push(current);
    current = current.parentElement;
  }
  return chain;
}

function findInteractiveAnchor(target: HTMLElement): HTMLElement | null {
  const interactive = target.closest('a, button, img, h1, h2, h3');
  if (!(interactive instanceof HTMLElement)) return null;
  if (!interactive.closest('[data-review-id]')) return null;
  return interactive;
}

function resolveStablePinAnchor(target: HTMLElement): HTMLElement {
  const chain = collectAncestorChain(target);

  for (const element of chain) {
    if (element.hasAttribute('data-review-target')) return element;
  }
  for (const element of chain) {
    if (element.hasAttribute('data-gallery-id')) return element;
  }

  const interactive = findInteractiveAnchor(target);
  if (interactive) return interactive;

  for (const element of chain) {
    if (element.hasAttribute('data-review-id')) return element;
  }
  for (const element of chain) {
    if ((element.tagName === 'SECTION' || element.tagName === 'ARTICLE') && element.id) return element;
  }

  const semantic = target.closest('header, footer, main');
  if (semantic instanceof HTMLElement) return semantic;

  return document.body;
}

function appendLocaleSuffix(selector: string, anchor: HTMLElement, locale: Locale): string {
  if (selector.includes('[data-lang=')) return selector;
  const lang = anchor.getAttribute('data-lang');
  if (lang) return `${selector}[data-lang="${escapeCssToken(lang)}"]`;
  if (document.querySelectorAll(selector).length <= 1) return selector;
  return `${selector}[data-lang="${escapeCssToken(locale)}"]`;
}

function buildInteractiveSelector(anchor: HTMLElement, locale: Locale): string | null {
  const section = anchor.closest('[data-review-id]');
  if (!(section instanceof HTMLElement)) return null;
  const sectionId = section.getAttribute('data-review-id');
  if (!sectionId) return null;

  const base = `[data-review-id="${escapeCssToken(sectionId)}"]`;
  const tag = anchor.tagName.toLowerCase();

  if (tag === 'a') {
    const href = anchor.getAttribute('href');
    if (!href) return null;
    let selector = `${base} a[href="${escapeCssToken(href)}"]`;
    const lang = anchor.getAttribute('data-lang') ?? locale;
    return `${selector}[data-lang="${escapeCssToken(lang)}"]`;
  }

  if (tag === 'button' && anchor.id) {
    return `#${escapeCssToken(anchor.id)}`;
  }

  if (tag === 'img') {
    const alt = anchor.getAttribute('alt');
    if (alt) return `${base} img[alt="${escapeCssToken(alt)}"]`;
  }

  if (tag === 'h1' || tag === 'h2' || tag === 'h3') {
    return `${base} ${tag}`;
  }

  return null;
}

function buildStableSelector(anchor: HTMLElement, locale: Locale): string {
  const reviewTarget = anchor.getAttribute('data-review-target');
  if (reviewTarget) {
    const selector = `[data-review-target="${escapeCssToken(reviewTarget)}"]`;
    return appendLocaleSuffix(selector, anchor, locale);
  }

  const galleryId = anchor.getAttribute('data-gallery-id');
  if (galleryId) {
    return `[data-gallery-id="${escapeCssToken(galleryId)}"]`;
  }

  const interactiveSelector = buildInteractiveSelector(anchor, locale);
  if (interactiveSelector) return interactiveSelector;

  const reviewId = anchor.getAttribute('data-review-id');
  if (reviewId) {
    return `[data-review-id="${escapeCssToken(reviewId)}"]`;
  }

  if (anchor.id && (anchor.tagName === 'SECTION' || anchor.tagName === 'ARTICLE')) {
    return `#${escapeCssToken(anchor.id)}`;
  }

  const tag = anchor.tagName.toLowerCase();
  if (tag === 'header' || tag === 'footer' || tag === 'main') return tag;

  return 'body';
}

function isElementVisible(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return rect.width > 0 || rect.height > 0;
}

function resolveAnchorElement(selector: string, locale: Locale): HTMLElement | null {
  const direct = document.querySelector(selector);
  if (direct instanceof HTMLElement && isElementVisible(direct)) return direct;

  if (!selector.includes('[data-lang=')) {
    const localized = document.querySelector(
      `${selector}[data-lang="${escapeCssToken(locale)}"]`,
    );
    if (localized instanceof HTMLElement && isElementVisible(localized)) return localized;
  }

  for (const match of document.querySelectorAll(selector)) {
    if (match instanceof HTMLElement && isElementVisible(match)) return match;
  }

  if (direct instanceof HTMLElement) return direct;
  return null;
}

function resolvePinAnchorAndSelector(target: HTMLElement): { anchor: HTMLElement; selector: string } {
  const anchor = resolveStablePinAnchor(target);
  const selector = buildStableSelector(anchor, readLocale());
  return { anchor, selector };
}

function isMobileLikeViewport(): boolean {
  return window.matchMedia('(max-width: 1024px)').matches;
}

function isReviewUiTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(
    target.closest('#review-toolbar') ||
      target.closest('#review-editor') ||
      target.closest('#review-code-modal') ||
      target.closest('#review-send-confirm-modal') ||
      target.closest('.review-pin-badge') ||
      target.closest('#review-pin-detail') ||
      target.closest('.review-pin-card') ||
      target.closest('.review-pin-delete'),
  );
}

function isPageInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (isReviewUiTarget(target)) return false;
  return Boolean(
    target.closest('a, button, input, textarea, select, label, [role="button"], [tabindex]:not([tabindex="-1"])'),
  );
}

function blockPageInteraction(event: Event): void {
  if (!gateEnabled || !modeEnabled || reviewLocked) return;
  if (isReviewUiTarget(event.target)) return;
  if (!isPageInteractiveTarget(event.target)) return;
  event.preventDefault();
  event.stopPropagation();
}

function getViewportBounds(): { left: number; top: number; width: number; height: number } {
  const viewport = window.visualViewport;
  return {
    left: viewport?.offsetLeft ?? 0,
    top: viewport?.offsetTop ?? 0,
    width: viewport?.width ?? window.innerWidth,
    height: viewport?.height ?? window.innerHeight,
  };
}

function positionFloatingPanel(element: HTMLElement, clientX: number, clientY: number): void {
  const pad = 12;
  const gap = 12;
  const viewport = getViewportBounds();
  element.style.position = 'fixed';
  element.style.visibility = 'hidden';
  element.style.transform = 'none';

  const rect = element.getBoundingClientRect();
  const minLeft = viewport.left + pad;
  const minTop = viewport.top + pad;
  const maxLeft = viewport.left + viewport.width - rect.width - pad;
  const maxTop = viewport.top + viewport.height - rect.height - pad;

  let left = clientX + gap;
  let top = clientY + gap;

  if (left + rect.width > viewport.left + viewport.width - pad) {
    left = clientX - rect.width - gap;
  }

  if (left < minLeft) left = minLeft;
  if (left > maxLeft) left = Math.max(minLeft, maxLeft);
  if (top + rect.height > viewport.top + viewport.height - pad) {
    top = clientY - rect.height - gap;
  }
  if (top < minTop) top = minTop;
  if (top > maxTop) top = Math.max(minTop, maxTop);

  element.style.left = `${Math.round(left)}px`;
  element.style.top = `${Math.round(top)}px`;
  element.style.visibility = 'visible';
}

function positionReviewEditor(editor: HTMLElement, clientX: number, clientY: number): void {
  document.body.appendChild(editor);
  positionFloatingPanel(editor, clientX, clientY);
}

function getScrollOffsets(): { scrollX: number; scrollY: number } {
  if (isMobileLikeViewport() && window.visualViewport) {
    return {
      scrollX: window.visualViewport.pageLeft,
      scrollY: window.visualViewport.pageTop,
    };
  }
  return { scrollX: window.scrollX, scrollY: window.scrollY };
}

function getDocumentPoint(clientX: number, clientY: number): { docX: number; docY: number } {
  if (isMobileLikeViewport() && window.visualViewport) {
    const viewport = window.visualViewport;
    return {
      docX: clientX + viewport.pageLeft,
      docY: clientY + viewport.pageTop,
    };
  }
  return {
    docX: window.scrollX + clientX,
    docY: window.scrollY + clientY,
  };
}

function ensureStyles(): void {
  if (document.getElementById('review-mode-style')) return;
  const style = document.createElement('style');
  style.id = 'review-mode-style';
  style.textContent = `
    html[data-review-mode="1"], html[data-review-mode="1"] body { cursor: crosshair; }
    #review-comments-layer {
      position: absolute;
      inset: 0 auto auto 0;
      width: 100%;
      pointer-events: none;
      z-index: 9995;
    }
    .review-deposit-gate {
      position: fixed;
      left: 16px;
      right: 16px;
      bottom: 16px;
      z-index: 10010;
      max-width: 520px;
      margin: 0 auto;
      padding: 12px 16px;
      border-radius: 12px;
      background: #111827;
      color: #f9fafb;
      border: 1px solid #374151;
      box-shadow: 0 10px 28px rgba(0, 0, 0, 0.35);
      font: 500 13px/1.45 system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      text-align: center;
    }
    .review-toolbar {
      position: fixed;
      right: 16px;
      bottom: 16px;
      z-index: 10020;
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: min(320px, calc(100vw - 32px));
      border: 1px solid #111827;
      border-radius: 12px;
      background: #111827;
      color: #f9fafb;
      padding: 12px;
      box-shadow: 0 10px 28px rgba(0, 0, 0, 0.35);
      font: 500 12px/1.4 system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      pointer-events: auto;
    }
    .review-toolbar-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .review-toggle-btn {
      border: 0;
      border-radius: 999px;
      background: #c4a46b;
      color: #111827;
      padding: 6px 10px;
      font-weight: 700;
      cursor: pointer;
    }
    .review-pin-dot {
      position: absolute;
      width: 12px;
      height: 12px;
      margin-left: -6px;
      margin-top: -6px;
      border-radius: 999px;
      border: 1px solid #fff;
      background: #dc2626;
      box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.25);
      pointer-events: none;
    }
    .review-pin-dot[data-pending="1"] { background: #f59e0b; }
    .review-pin-badge {
      position: absolute;
      z-index: 9998;
      min-width: 26px;
      height: 26px;
      margin-left: -13px;
      margin-top: -13px;
      padding: 0 7px;
      border: 2px solid #fff;
      border-radius: 999px;
      background: #dc2626;
      color: #fff;
      box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.25);
      font: 700 11px/22px system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      cursor: pointer;
      pointer-events: auto;
    }
    .review-pin-badge[data-pending="1"] { background: #f59e0b; }
    .review-pin-badge[data-active="1"] {
      background: #111827;
      box-shadow: 0 0 0 2px rgba(17, 24, 39, 0.35);
    }
    .review-region-box {
      position: absolute;
      border: 1px solid rgba(196, 164, 107, 0.85);
      background: rgba(196, 164, 107, 0.12);
      border-radius: 4px;
      pointer-events: none;
    }
    .review-region-draft {
      position: absolute;
      border: 1px dashed rgba(196, 164, 107, 0.95);
      background: rgba(196, 164, 107, 0.08);
      border-radius: 4px;
      pointer-events: none;
      z-index: 9996;
    }
    .review-pin-card, .review-pin-detail {
      max-width: min(280px, calc(100vw - 24px));
      min-width: 160px;
      border-radius: 8px;
      border: 1px solid #f59e0b;
      background: #fffbeb;
      color: #111827;
      padding: 8px 10px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
      font: 500 12px/1.45 system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      white-space: pre-wrap;
      pointer-events: auto;
    }
    .review-pin-detail {
      position: fixed;
      z-index: 10024;
    }
    .review-pin-card {
      position: absolute;
      transform: translate(8px, 8px);
    }
    .review-pin-card[data-detached="1"], .review-pin-detail[data-detached="1"] { border-style: dashed; }
    .review-pin-meta {
      margin-top: 6px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      color: #6b7280;
      font-size: 11px;
    }
    .review-pin-delete {
      border: 0;
      border-radius: 6px;
      background: #fee2e2;
      color: #991b1b;
      padding: 2px 6px;
      font: 600 11px/1.2 system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      cursor: pointer;
    }
    .review-editor, .review-code-modal {
      z-index: 10025;
      width: min(320px, calc(100vw - 24px));
      border-radius: 10px;
      border: 1px solid #d1d5db;
      background: #fff;
      color: #111827;
      padding: 10px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
      pointer-events: auto;
      font: 500 12px/1.4 system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
    }
    .review-editor { position: fixed; }
    .review-code-modal {
      position: fixed;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      z-index: 10030;
    }
    .review-code-modal h3 {
      margin: 0 0 8px;
      font: 700 14px/1.3 system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
    }
    .review-code-modal p {
      margin: 0 0 10px;
      color: #4b5563;
      font-size: 12px;
    }
    .review-editor textarea, .review-code-modal input {
      width: 100%;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      padding: 8px;
      font: 500 12px/1.4 system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
    }
    .review-editor textarea { min-height: 80px; resize: vertical; }
    .review-editor-actions, .review-code-actions {
      margin-top: 8px;
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }
    .review-editor button, .review-code-modal button {
      border: 0;
      border-radius: 8px;
      padding: 6px 10px;
      font: 600 12px/1 system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      cursor: pointer;
    }
    .review-editor-save, .review-code-submit { background: #111827; color: #fff; }
    .review-editor-cancel, .review-code-cancel { background: #f3f4f6; color: #111827; }
    .review-code-error { margin-top: 8px; color: #b91c1c; font-size: 11px; min-height: 14px; }
    .review-toolbar-production {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding-top: 8px;
      border-top: 1px solid rgba(249, 250, 251, 0.12);
    }
    .review-send-production-btn {
      width: 100%;
      border: 0;
      border-radius: 8px;
      background: #c4a46b;
      color: #111827;
      padding: 8px 10px;
      font: 700 12px/1.2 system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      cursor: pointer;
    }
    .review-send-production-btn:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
    .review-send-help, .review-send-error {
      color: #d1d5db;
      font-size: 11px;
      line-height: 1.45;
    }
    .review-send-error { color: #fca5a5; }
    .review-toolbar-success {
      border-radius: 8px;
      background: rgba(34, 197, 94, 0.15);
      border: 1px solid rgba(34, 197, 94, 0.35);
      color: #bbf7d0;
      padding: 8px 10px;
      font-size: 11px;
      line-height: 1.45;
    }
  `;
  document.head.appendChild(style);
}

function ensureCommentsLayer(): HTMLDivElement {
  let layer = document.getElementById('review-comments-layer') as HTMLDivElement | null;
  if (layer) return layer;
  layer = document.createElement('div');
  layer.id = 'review-comments-layer';
  document.body.appendChild(layer);
  return layer;
}

function updateLayerHeight(): void {
  const layer = ensureCommentsLayer();
  layer.style.height = `${Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)}px`;
}

function resolveAnchorRect(selector: string, locale: Locale): DOMRect | null {
  const target = resolveAnchorElement(selector, locale);
  if (!target) return null;
  return target.getBoundingClientRect();
}

function resolveDocPosition(comment: RenderComment): {
  x: number;
  y: number;
  width: number;
  height: number;
  detached: boolean;
} {
  const rect = resolveAnchorRect(comment.selector, comment.locale);
  if (rect) {
    const { scrollX, scrollY } = getScrollOffsets();
    const x = scrollX + rect.left + clamp01(comment.relX) * Math.max(rect.width, 1);
    const y = scrollY + rect.top + clamp01(comment.relY) * Math.max(rect.height, 1);
    const width =
      comment.annotationType === 'region' && comment.relW !== null
        ? clamp01(comment.relW) * Math.max(rect.width, 1)
        : 0;
    const height =
      comment.annotationType === 'region' && comment.relH !== null
        ? clamp01(comment.relH) * Math.max(rect.height, 1)
        : 0;
    return { x, y, width, height, detached: false };
  }
  return { x: comment.docX, y: comment.docY, width: 0, height: 0, detached: true };
}

function removePinDetail(): void {
  const detail = document.getElementById('review-pin-detail');
  if (detail) detail.remove();
}

function renderPinDetail(comment: RenderComment, detached: boolean, anchorClientX: number, anchorClientY: number): void {
  removePinDetail();
  const card = document.createElement('div');
  card.id = 'review-pin-detail';
  card.className = 'review-pin-detail';
  card.dataset.detached = detached ? '1' : '0';

  const text = document.createElement('div');
  text.textContent = comment.message;
  card.appendChild(text);

  const meta = document.createElement('div');
  meta.className = 'review-pin-meta';
  const info = document.createElement('span');
  const prefix = detached ? t('detached') : comment.pending ? t('saving') : '';
  info.textContent = `${prefix ? `${prefix} · ` : ''}${new Date(comment.createdAt).toLocaleString()}`;
  meta.appendChild(info);

  if (editAuthorized && !reviewLocked && !comment.pending) {
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'review-pin-delete';
    deleteBtn.textContent = t('delete');
    deleteBtn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      activePinKey = null;
      void handleDeleteComment(comment);
    });
    meta.appendChild(deleteBtn);
  }

  card.appendChild(meta);
  document.body.appendChild(card);
  positionFloatingPanel(card, anchorClientX, anchorClientY);
}

function renderComments(): void {
  const layer = ensureCommentsLayer();
  updateLayerHeight();
  layer.innerHTML = '';
  removePinDetail();

  const ordered = [...comments].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  let activeAnchor: { x: number; y: number } | null = null;
  let activeComment: RenderComment | null = null;
  let activeDetached = false;

  for (let index = 0; index < ordered.length; index += 1) {
    const comment = ordered[index];
    const point = resolveDocPosition(comment);
    const pinNumber = index + 1;

    if (comment.annotationType === 'region' && point.width > 0 && point.height > 0) {
      const region = document.createElement('div');
      region.className = 'review-region-box';
      region.style.left = `${Math.round(point.x)}px`;
      region.style.top = `${Math.round(point.y)}px`;
      region.style.width = `${Math.round(point.width)}px`;
      region.style.height = `${Math.round(point.height)}px`;
      layer.appendChild(region);
    }

    const badge = document.createElement('button');
    badge.type = 'button';
    badge.className = 'review-pin-badge';
    badge.textContent = `#${pinNumber}`;
    badge.dataset.pending = comment.pending ? '1' : '0';
    badge.dataset.active = activePinKey === comment.key ? '1' : '0';
    badge.style.left = `${Math.round(point.x)}px`;
    badge.style.top = `${Math.round(point.y)}px`;
    badge.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      activePinKey = activePinKey === comment.key ? null : comment.key;
      scheduleRender();
    });
    layer.appendChild(badge);

    if (activePinKey === comment.key) {
      const badgeRect = badge.getBoundingClientRect();
      activeAnchor = {
        x: badgeRect.left + badgeRect.width / 2,
        y: badgeRect.top + badgeRect.height / 2,
      };
      activeComment = comment;
      activeDetached = point.detached;
    }
  }

  if (activeComment && activeAnchor) {
    renderPinDetail(activeComment, activeDetached, activeAnchor.x, activeAnchor.y);
  }
}

function scheduleRender(): void {
  if (renderScheduled) return;
  renderScheduled = true;
  requestAnimationFrame(() => {
    renderScheduled = false;
    renderComments();
  });
}

function removeEditor(): void {
  const editor = document.getElementById('review-editor');
  if (editor) editor.remove();
  activePinKey = null;
  removePinDetail();
}

function removeCodeModal(): void {
  const modal = document.getElementById('review-code-modal');
  if (modal) modal.remove();
}

function ensureToolbar(): void {
  if (document.getElementById('review-toolbar')) return;
  const toolbar = document.createElement('div');
  toolbar.id = 'review-toolbar';
  toolbar.className = 'review-toolbar';
  const row = document.createElement('div');
  row.className = 'review-toolbar-row';
  const status = document.createElement('span');
  status.id = 'review-status';
  const toggleBtn = document.createElement('button');
  toggleBtn.type = 'button';
  toggleBtn.id = 'review-toggle-btn';
  toggleBtn.className = 'review-toggle-btn';
  row.appendChild(status);
  row.appendChild(toggleBtn);
  const help = document.createElement('div');
  help.id = 'review-help';

  const production = document.createElement('div');
  production.id = 'review-toolbar-production';
  production.className = 'review-toolbar-production';
  const sendBtn = document.createElement('button');
  sendBtn.type = 'button';
  sendBtn.id = 'review-send-production-btn';
  sendBtn.className = 'review-send-production-btn';
  sendBtn.textContent = t('send_production');
  const sendHelp = document.createElement('div');
  sendHelp.id = 'review-send-help';
  sendHelp.className = 'review-send-help';
  const sendErrorEl = document.createElement('div');
  sendErrorEl.id = 'review-send-error';
  sendErrorEl.className = 'review-send-error';
  production.appendChild(sendBtn);
  production.appendChild(sendHelp);
  production.appendChild(sendErrorEl);

  const success = document.createElement('div');
  success.id = 'review-toolbar-success';
  success.className = 'review-toolbar-success';
  success.hidden = true;
  success.textContent = t('success_sent');

  toolbar.appendChild(row);
  toolbar.appendChild(help);
  toolbar.appendChild(production);
  toolbar.appendChild(success);
  document.body.appendChild(toolbar);
}

function updateToolbarState(): void {
  const status = document.getElementById('review-status');
  const toggle = document.getElementById('review-toggle-btn') as HTMLButtonElement | null;
  const help = document.getElementById('review-help');
  const production = document.getElementById('review-toolbar-production');
  const sendBtn = document.getElementById('review-send-production-btn') as HTMLButtonElement | null;
  const sendHelp = document.getElementById('review-send-help');
  const sendErrorEl = document.getElementById('review-send-error');
  const success = document.getElementById('review-toolbar-success');
  if (!status || !toggle || !help) return;

  if (reviewLocked) {
    status.textContent = t('review_submitted');
    toggle.hidden = true;
    help.textContent = t('feedback_locked_help');
    if (production) production.hidden = true;
    if (success) {
      success.textContent = t('success_sent');
      success.hidden = false;
    }
    document.documentElement.dataset.reviewMode = '0';
    return;
  }

  if (success) success.hidden = true;
  if (toggle) toggle.hidden = false;

  status.textContent = modeEnabled ? t('feedback_enabled') : t('feedback_disabled');
  toggle.textContent = modeEnabled ? t('disable') : t('enable');
  help.textContent = modeEnabled
    ? t('help_mode_on')
    : editAuthorized
      ? t('help_mode_off_auth')
      : t('help_mode_off');
  document.documentElement.dataset.reviewMode = modeEnabled ? '1' : '0';

  if (!production || !sendBtn || !sendHelp || !sendErrorEl) return;

  production.hidden = !editAuthorized;
  sendBtn.textContent = t('send_production');
  sendErrorEl.textContent = sendError;

  if (!editAuthorized) return;

  const canSend = commentCount >= 1 && !submitInFlight;
  sendBtn.disabled = !canSend;
  sendHelp.textContent = canSend
    ? t('send_help_ready')
    : commentCount < 1
      ? t('send_help_need_comment')
      : t('send_help_submitting');
}

async function fetchReviewSummary(): Promise<void> {
  try {
    const response = await fetch('/api/review-summary', { method: 'GET' });
    if (!response.ok) return;
    const payload = (await response.json()) as { commentCount?: unknown };
    if (typeof payload.commentCount === 'number' && Number.isFinite(payload.commentCount)) {
      commentCount = payload.commentCount;
      updateToolbarState();
    }
  } catch {
    // Non-blocking — toolbar falls back to disabled send until next refresh.
  }
}

function removeSendConfirmModal(): void {
  const modal = document.getElementById('review-send-confirm-modal');
  if (modal) modal.remove();
}

function openSendConfirmModal(onConfirm: () => void): void {
  removeSendConfirmModal();
  const modal = document.createElement('div');
  modal.id = 'review-send-confirm-modal';
  modal.className = 'review-code-modal';

  const title = document.createElement('h3');
  title.textContent = t('send_confirm_title');
  modal.appendChild(title);

  const description = document.createElement('p');
  description.textContent = t('send_confirm_body');
  modal.appendChild(description);

  const actions = document.createElement('div');
  actions.className = 'review-code-actions';

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'review-code-cancel';
  cancelBtn.textContent = t('cancel');
  cancelBtn.addEventListener('click', () => removeSendConfirmModal());

  const confirmBtn = document.createElement('button');
  confirmBtn.type = 'button';
  confirmBtn.className = 'review-code-submit';
  confirmBtn.textContent = t('send_production');
  confirmBtn.addEventListener('click', () => {
    removeSendConfirmModal();
    onConfirm();
  });

  actions.appendChild(cancelBtn);
  actions.appendChild(confirmBtn);
  modal.appendChild(actions);
  document.body.appendChild(modal);
}

async function submitReviewComplete(): Promise<void> {
  if (!authToken || reviewLocked || submitInFlight || commentCount < 1) return;

  submitInFlight = true;
  sendError = '';
  updateToolbarState();

  try {
    const response = await fetch('/api/review-complete', {
      method: 'POST',
      headers: authHeaders(),
    });

    if (response.status === 401) {
      clearStoredAuth();
      applyAuthState();
      modeEnabled = false;
      saveModeEnabled(false);
      sendError = t('session_expired');
      return;
    }

    const payload = (await response.json()) as {
      ok?: boolean;
      mock?: boolean;
      duplicate?: boolean;
      error?: string;
      message?: string;
    };

    if (response.ok && payload.ok !== false) {
      reviewLocked = true;
      saveReviewLocked(true);
      modeEnabled = false;
      saveModeEnabled(false);
      removeEditor();
      removeDraftRegion();
      sendError = '';
      updateToolbarState();
      return;
    }

    if (payload.error === 'session_not_found' && typeof payload.message === 'string') {
      sendError = payload.message;
      return;
    }

    if (payload.error === 'no_feedback') {
      sendError = t('send_help_need_comment');
      await fetchReviewSummary();
      return;
    }

    sendError =
      typeof payload.message === 'string' ? payload.message : t('submit_failed');
  } catch {
    sendError = t('submit_offline');
  } finally {
    submitInFlight = false;
    updateToolbarState();
  }
}

function wireSendProduction(): void {
  const sendBtn = document.getElementById('review-send-production-btn') as HTMLButtonElement | null;
  if (!sendBtn || sendBtn.dataset.bound === '1') return;
  sendBtn.dataset.bound = '1';
  sendBtn.addEventListener('click', () => {
    if (reviewLocked || !editAuthorized || commentCount < 1 || submitInFlight) return;
    openSendConfirmModal(() => {
      void submitReviewComplete();
    });
  });
}

async function verifyFeedbackCode(code: string): Promise<boolean> {
  const response = await fetch('/api/review-verify-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  if (!response.ok) return false;
  const payload = (await response.json()) as {
    success?: boolean;
    token?: string;
    role?: ReviewRole;
  };
  if (!payload.success || typeof payload.token !== 'string') return false;
  if (payload.role !== 'client' && payload.role !== 'admin') return false;
  saveStoredAuth(payload.token, payload.role);
  applyAuthState();
  return true;
}

function openCodeModal(onSuccess: () => void): void {
  removeCodeModal();
  const modal = document.createElement('div');
  modal.id = 'review-code-modal';
  modal.className = 'review-code-modal';

  const title = document.createElement('h3');
  title.textContent = t('code_title');
  modal.appendChild(title);

  const description = document.createElement('p');
  description.textContent = import.meta.env.DEV ? t('code_desc_dev') : t('code_desc');
  modal.appendChild(description);

  const input = document.createElement('input');
  input.type = 'password';
  input.autocomplete = 'off';
  input.placeholder = t('code_placeholder');
  modal.appendChild(input);

  const error = document.createElement('div');
  error.className = 'review-code-error';
  modal.appendChild(error);

  const actions = document.createElement('div');
  actions.className = 'review-code-actions';

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'review-code-cancel';
  cancelBtn.textContent = t('cancel');
  cancelBtn.addEventListener('click', () => removeCodeModal());

  const submitBtn = document.createElement('button');
  submitBtn.type = 'button';
  submitBtn.className = 'review-code-submit';
  submitBtn.textContent = t('unlock');
  submitBtn.addEventListener('click', () => {
    void (async () => {
      const code = input.value.trim();
      if (!code) {
        error.textContent = t('code_required');
        input.focus();
        return;
      }
      submitBtn.disabled = true;
      const ok = await verifyFeedbackCode(code);
      submitBtn.disabled = false;
      if (!ok) {
        error.textContent = t('code_invalid');
        input.focus();
        return;
      }
      removeCodeModal();
      onSuccess();
      scheduleRender();
    })();
  });

  actions.appendChild(cancelBtn);
  actions.appendChild(submitBtn);
  modal.appendChild(actions);
  document.body.appendChild(modal);
  input.focus();
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') submitBtn.click();
  });
}

function wireToolbar(): void {
  const toggle = document.getElementById('review-toggle-btn') as HTMLButtonElement | null;
  if (!toggle || toggle.dataset.bound === '1') return;
  toggle.dataset.bound = '1';
  toggle.addEventListener('click', () => {
    if (reviewLocked) return;
    if (modeEnabled) {
      modeEnabled = false;
      saveModeEnabled(false);
      updateToolbarState();
      removeEditor();
      removeDraftRegion();
      return;
    }

    const enableEditing = () => {
      modeEnabled = true;
      saveModeEnabled(true);
      updateToolbarState();
    };

    if (!editAuthorized) {
      openCodeModal(enableEditing);
      return;
    }
    enableEditing();
  });
}

async function fetchServerComments(): Promise<ApiComment[]> {
  const params = new URLSearchParams({ page_path: pagePath(), locale: readLocale() });
  const response = await fetch(`/api/review-comment?${params.toString()}`, { method: 'GET' });
  if (!response.ok) return [];
  const payload = (await response.json()) as unknown;
  if (!payload || typeof payload !== 'object') return [];
  const rows = (payload as { comments?: unknown }).comments;
  if (!Array.isArray(rows)) return [];
  return rows.filter((row): row is ApiComment => {
    if (!row || typeof row !== 'object') return false;
    const r = row as Record<string, unknown>;
    const annotationType = r.annotation_type;
    return (
      typeof r.id === 'string' &&
      typeof r.message === 'string' &&
      typeof r.page_path === 'string' &&
      (r.locale === 'en' || r.locale === 'pl' || r.locale === 'es') &&
      typeof r.selector === 'string' &&
      typeof r.rel_x === 'number' &&
      typeof r.rel_y === 'number' &&
      typeof r.doc_x === 'number' &&
      typeof r.doc_y === 'number' &&
      (annotationType === 'point' || annotationType === 'region') &&
      (r.status === 'open' || r.status === 'detached') &&
      typeof r.created_at === 'string'
    );
  });
}

function mergeComments(serverRows: ApiComment[], pendingRows: PendingComment[]): void {
  comments = serverRows.map((row) => ({
    key: row.id,
    id: row.id,
    message: row.message,
    selector: row.selector,
    relX: row.rel_x,
    relY: row.rel_y,
    relW: row.rel_w,
    relH: row.rel_h,
    docX: row.doc_x,
    docY: row.doc_y,
    locale: row.locale,
    annotationType: row.annotation_type,
    createdAt: row.created_at,
    detached: row.status === 'detached',
    pending: false,
  }));

  for (const pending of pendingRows) {
    comments.push({
      key: pending.temp_id,
      id: pending.temp_id,
      message: pending.message,
      selector: pending.selector,
      relX: pending.rel_x,
      relY: pending.rel_y,
      relW: pending.rel_w ?? null,
      relH: pending.rel_h ?? null,
      docX: pending.doc_x,
      docY: pending.doc_y,
      locale: pending.locale,
      annotationType: pending.annotation_type,
      createdAt: pending.created_at,
      detached: false,
      pending: true,
    });
  }
}

function authHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${authToken}`,
  };
}

async function postComment(payload: PendingComment): Promise<ApiComment | null> {
  if (!authToken) return null;
  const response = await fetch('/api/review-comment', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (response.status === 401) {
    clearStoredAuth();
    applyAuthState();
    modeEnabled = false;
    saveModeEnabled(false);
    updateToolbarState();
    return null;
  }
  if (!response.ok) return null;
  const body = (await response.json()) as { comment?: ApiComment };
  return body.comment ?? null;
}

async function deleteComment(id: string): Promise<boolean> {
  if (!authToken) return false;
  const response = await fetch('/api/review-comment', {
    method: 'DELETE',
    headers: authHeaders(),
    body: JSON.stringify({ id }),
  });
  if (response.status === 401) {
    clearStoredAuth();
    applyAuthState();
    modeEnabled = false;
    saveModeEnabled(false);
    updateToolbarState();
    return false;
  }
  return response.ok;
}

async function handleDeleteComment(comment: RenderComment): Promise<void> {
  if (reviewLocked || !editAuthorized || comment.pending) return;
  if (!window.confirm(t('delete_confirm'))) return;

  const previous = [...comments];
  const previousActive = activePinKey;
  comments = comments.filter((item) => item.id !== comment.id);
  activePinKey = null;
  scheduleRender();

  const ok = await deleteComment(comment.id);
  if (!ok) {
    comments = previous;
    activePinKey = previousActive;
    scheduleRender();
    window.alert(t('delete_failed'));
    return;
  }
  void fetchReviewSummary();
}

async function flushPendingQueue(): Promise<void> {
  if (!authToken) return;
  const queue = readPending();
  if (queue.length === 0) return;
  const remaining: PendingComment[] = [];
  for (const pending of queue) {
    const saved = await postComment(pending);
    if (!saved) {
      remaining.push(pending);
      continue;
    }
    comments = comments.filter((item) => item.id !== pending.temp_id);
    comments.push({
      key: saved.id,
      id: saved.id,
      message: saved.message,
      selector: saved.selector,
      relX: saved.rel_x,
      relY: saved.rel_y,
      relW: saved.rel_w,
      relH: saved.rel_h,
      docX: saved.doc_x,
      docY: saved.doc_y,
      locale: saved.locale,
      annotationType: saved.annotation_type,
      createdAt: saved.created_at,
      detached: saved.status === 'detached',
      pending: false,
    });
  }
  writePending(remaining);
  scheduleRender();
  void fetchReviewSummary();
}

type EditorContext = {
  target: HTMLElement;
  clientX: number;
  clientY: number;
  docX: number;
  docY: number;
  annotationType: AnnotationType;
  relW?: number;
  relH?: number;
};

function makePendingFromContext(message: string, context: EditorContext): PendingComment {
  const { anchor, selector } = resolvePinAnchorAndSelector(context.target);
  const rect = anchor.getBoundingClientRect();
  const relX = clamp01((context.clientX - rect.left) / Math.max(rect.width, 1));
  const relY = clamp01((context.clientY - rect.top) / Math.max(rect.height, 1));
  return {
    temp_id: `tmp-${crypto.randomUUID()}`,
    message,
    page_path: pagePath(),
    locale: readLocale(),
    selector,
    rel_x: relX,
    rel_y: relY,
    rel_w: context.relW,
    rel_h: context.relH,
    doc_x: Math.round(context.docX),
    doc_y: Math.round(context.docY),
    annotation_type: context.annotationType,
    created_at: new Date().toISOString(),
  };
}

function openEditor(context: EditorContext): void {
  if (reviewLocked) return;
  removeEditor();
  const editor = document.createElement('div');
  editor.id = 'review-editor';
  editor.className = 'review-editor';
  const input = document.createElement('textarea');
  input.placeholder =
    context.annotationType === 'region'
      ? t('editor_placeholder_region')
      : t('editor_placeholder_point');
  editor.appendChild(input);
  const actions = document.createElement('div');
  actions.className = 'review-editor-actions';
  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'review-editor-cancel';
  cancelBtn.textContent = t('cancel');
  cancelBtn.addEventListener('click', () => removeEditor());
  const saveBtn = document.createElement('button');
  saveBtn.type = 'button';
  saveBtn.className = 'review-editor-save';
  saveBtn.textContent = t('save');
  saveBtn.addEventListener('click', () => {
    const message = input.value.trim();
    if (message.length < 3) {
      input.focus();
      return;
    }
    const pending = makePendingFromContext(message, context);
    const queue = [...readPending(), pending];
    writePending(queue);
    comments.push({
      key: pending.temp_id,
      id: pending.temp_id,
      message: pending.message,
      selector: pending.selector,
      relX: pending.rel_x,
      relY: pending.rel_y,
      relW: pending.rel_w ?? null,
      relH: pending.rel_h ?? null,
      docX: pending.doc_x,
      docY: pending.doc_y,
      locale: pending.locale,
      annotationType: pending.annotation_type,
      createdAt: pending.created_at,
      detached: false,
      pending: true,
    });
    removeEditor();
    scheduleRender();
    void flushPendingQueue();
  });
  actions.appendChild(cancelBtn);
  actions.appendChild(saveBtn);
  editor.appendChild(actions);
  positionReviewEditor(editor, context.clientX, context.clientY);
  input.focus();
}

function removeDraftRegion(): void {
  if (draftRegionEl) {
    draftRegionEl.remove();
    draftRegionEl = null;
  }
}

function ensureDraftRegion(): HTMLDivElement {
  if (draftRegionEl) return draftRegionEl;
  draftRegionEl = document.createElement('div');
  draftRegionEl.className = 'review-region-draft';
  ensureCommentsLayer().appendChild(draftRegionEl);
  return draftRegionEl;
}

function updateDraftRegion(startX: number, startY: number, currentX: number, currentY: number): void {
  const left = Math.min(startX, currentX);
  const top = Math.min(startY, currentY);
  const width = Math.abs(currentX - startX);
  const height = Math.abs(currentY - startY);
  const draft = ensureDraftRegion();
  draft.style.left = `${Math.round(left)}px`;
  draft.style.top = `${Math.round(top)}px`;
  draft.style.width = `${Math.round(width)}px`;
  draft.style.height = `${Math.round(height)}px`;
}

function buildRegionContext(
  target: HTMLElement,
  startClientX: number,
  startClientY: number,
  endClientX: number,
  endClientY: number,
): EditorContext | null {
  const { anchor } = resolvePinAnchorAndSelector(target);
  const rect = anchor.getBoundingClientRect();
  const left = Math.min(startClientX, endClientX);
  const top = Math.min(startClientY, endClientY);
  const right = Math.max(startClientX, endClientX);
  const bottom = Math.max(startClientY, endClientY);
  const width = right - left;
  const height = bottom - top;
  if (width < MIN_REGION_PX || height < MIN_REGION_PX) return null;

  const docPoint = getDocumentPoint(left, top);

  return {
    target,
    clientX: left,
    clientY: top,
    docX: docPoint.docX,
    docY: docPoint.docY,
    annotationType: 'region',
    relW: clamp01(width / Math.max(rect.width, 1)),
    relH: clamp01(height / Math.max(rect.height, 1)),
  };
}

function onPointerDown(event: PointerEvent): void {
  if (!gateEnabled || !modeEnabled || reviewLocked) return;
  if (event.button !== 0) return;
  if (isReviewUiTarget(event.target)) return;
  if (!(event.target instanceof HTMLElement)) return;

  if (isPageInteractiveTarget(event.target)) {
    event.preventDefault();
  }

  pointerStart = { x: event.clientX, y: event.clientY, target: event.target };
  isDragging = false;
}

function onPointerMove(event: PointerEvent): void {
  if (!pointerStart || !modeEnabled) return;
  const deltaX = Math.abs(event.clientX - pointerStart.x);
  const deltaY = Math.abs(event.clientY - pointerStart.y);
  if (!isDragging && (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD)) {
    isDragging = true;
  }
  if (!isDragging) return;

  const startDoc = getDocumentPoint(pointerStart.x, pointerStart.y);
  const currentDoc = getDocumentPoint(event.clientX, event.clientY);
  updateDraftRegion(startDoc.docX, startDoc.docY, currentDoc.docX, currentDoc.docY);
}

function onPointerUp(event: PointerEvent): void {
  if (!pointerStart || !modeEnabled) {
    pointerStart = null;
    isDragging = false;
    removeDraftRegion();
    return;
  }

  const start = pointerStart;
  pointerStart = null;
  removeDraftRegion();

  if (isDragging) {
    isDragging = false;
    const context = buildRegionContext(start.target, start.x, start.y, event.clientX, event.clientY);
    if (!context) return;
    event.preventDefault();
    event.stopPropagation();
    openEditor(context);
    return;
  }

  isDragging = false;
  if (isReviewUiTarget(event.target)) return;
  event.preventDefault();
  event.stopPropagation();
  const docPoint = getDocumentPoint(event.clientX, event.clientY);
  openEditor({
    target: start.target,
    clientX: event.clientX,
    clientY: event.clientY,
    docX: docPoint.docX,
    docY: docPoint.docY,
    annotationType: 'point',
  });
}

function onClosePinDetail(event: MouseEvent): void {
  if (!activePinKey) return;
  if (!(event.target instanceof HTMLElement)) return;
  if (event.target.closest('.review-pin-badge') || event.target.closest('#review-pin-detail')) return;
  activePinKey = null;
  scheduleRender();
}

function attachRepositionListeners(): void {
  if ((window as unknown as { __reviewRepositionBound?: boolean }).__reviewRepositionBound) return;
  (window as unknown as { __reviewRepositionBound?: boolean }).__reviewRepositionBound = true;
  window.addEventListener('scroll', scheduleRender, { passive: true });
  window.addEventListener('resize', scheduleRender);

  if (window.visualViewport) {
    window.visualViewport.addEventListener('scroll', scheduleRender);
    window.visualViewport.addEventListener('resize', scheduleRender);
  }
}

async function hydrateComments(): Promise<void> {
  const pending = readPending();
  const server = await fetchServerComments();
  mergeComments(server, pending);
  scheduleRender();
  void flushPendingQueue();
}

export async function setupReviewMode(): Promise<void> {
  const hostnameGate = isReviewGateEnabled();
  if (!hostnameGate) {
    gateEnabled = false;
    modeEnabled = false;
    editAuthorized = false;
    authToken = '';
    comments = [];
    document.documentElement.dataset.reviewMode = '0';
    removeDepositGateBanner();
    const toolbar = document.getElementById('review-toolbar');
    if (toolbar) toolbar.remove();
    const layer = document.getElementById('review-comments-layer');
    if (layer) layer.remove();
    return;
  }

  const access = await fetchReviewAccess();
  depositGateReason = access.reason;
  gateEnabled = access.allowed;
  reviewLocked = access.feedbackLocked || readReviewLocked();

  if (!access.viewable) {
    modeEnabled = false;
    editAuthorized = false;
    authToken = '';
    comments = [];
    document.documentElement.dataset.reviewMode = '0';
    ensureStyles();
    ensureDepositGateBanner();
    const toolbar = document.getElementById('review-toolbar');
    if (toolbar) toolbar.remove();
    const layer = document.getElementById('review-comments-layer');
    if (layer) layer.remove();
    return;
  }

  if (!gateEnabled) {
    modeEnabled = false;
    editAuthorized = false;
    authToken = '';
    comments = [];
    document.documentElement.dataset.reviewMode = '0';
    removeDepositGateBanner();
    if (access.feedbackLocked) {
      ensureStyles();
      ensureDepositGateBanner();
    }
    const toolbar = document.getElementById('review-toolbar');
    if (toolbar) toolbar.remove();
    const layer = document.getElementById('review-comments-layer');
    if (layer) layer.remove();
    return;
  }

  removeDepositGateBanner();
  ensureStyles();
  ensureToolbar();
  ensureCommentsLayer();
  reviewLocked = access.feedbackLocked || readReviewLocked();
  applyAuthState();
  wireToolbar();
  wireSendProduction();
  attachRepositionListeners();
  modeEnabled = !reviewLocked && readModeEnabled() && editAuthorized;
  updateToolbarState();
  void fetchReviewSummary();
  void hydrateComments();

  if (initialized) return;
  initialized = true;
  document.addEventListener('pointerdown', onPointerDown, true);
  document.addEventListener('pointermove', onPointerMove, true);
  document.addEventListener('pointerup', onPointerUp, true);
  document.addEventListener('pointercancel', onPointerUp, true);
  document.addEventListener('click', blockPageInteraction, true);
  document.addEventListener('click', onClosePinDetail, true);
}

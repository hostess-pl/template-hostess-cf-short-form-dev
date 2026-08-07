/**
 * Shared Tally → hostess transform. Used by provision-from-payload.mjs.
 * Core logic lives in tally-normalize-core.mjs (sync with hostesses/n8n/).
 */

import {
  TALLY_FIELD_MAP,
  buildSlug,
  extractFields,
  normalizeTallySubmission,
} from './tally-normalize-core.mjs';

export function isNormalizedHostessPayload(input) {
  return Boolean(
    input &&
      typeof input === 'object' &&
      typeof input.submissionId === 'string' &&
      input.submissionId.trim() &&
      typeof input.slug === 'string' &&
      input.profile &&
      typeof input.profile.displayName === 'string',
  );
}

export function tallyToHostess(input) {
  if (isNormalizedHostessPayload(input)) {
    const assets = input.assets ?? { hero: null, events: [] };
    const { assets: _ignored, callbackUrl: _cb, ...hostess } = input;
    return { hostess, assets, repoName: `${hostess.slug}` };
  }

  const { normalized, repoName, githubDispatchPayload } = normalizeTallySubmission(input);
  return {
    hostess: normalized,
    assets: normalized.assets,
    repoName,
    githubDispatchPayload,
  };
}

export { TALLY_FIELD_MAP, buildSlug, extractFields, normalizeTallySubmission };

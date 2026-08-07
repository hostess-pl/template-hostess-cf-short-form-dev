import { createHmac, timingSafeEqual } from 'node:crypto';

import {
  RATE_LIMIT_SALT,
  REVIEW_ADMIN_CODE,
  REVIEW_AUTH_SALT,
  REVIEW_CLIENT_CODE,
} from 'astro:env/server';

import siteConfig from '@/config/site.config';
import { readEnvString } from '@/lib/runtimeEnv';

export type ReviewRole = 'client' | 'admin';

type ReviewTokenPayload = {
  site_key: string;
  role: ReviewRole;
  exp: number;
};

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

/** Fail closed: empty salt makes verify/create refuse to succeed. */
function getAuthSalt(): string {
  return (
    REVIEW_AUTH_SALT ||
    readEnvString('REVIEW_AUTH_SALT') ||
    RATE_LIMIT_SALT ||
    readEnvString('RATE_LIMIT_SALT') ||
    ''
  );
}

export function reviewSiteKey(): string {
  try {
    return new URL(siteConfig.url).hostname.toLowerCase();
  } catch {
    return 'hostess-template';
  }
}

function hashCode(code: string): string {
  const salt = getAuthSalt();
  if (!salt) return '';
  return createHmac('sha256', salt).update(code).digest('hex');
}

function safeCompareCode(input: string, expected: string): boolean {
  if (!expected) return false;
  const left = hashCode(input.trim());
  const right = hashCode(expected.trim());
  if (!left || !right || left.length !== right.length) return false;
  return timingSafeEqual(Buffer.from(left), Buffer.from(right));
}

export function verifyAccessCode(code: string): ReviewRole | null {
  if (!getAuthSalt()) return null;
  const clientCode = REVIEW_CLIENT_CODE || readEnvString('REVIEW_CLIENT_CODE');
  const adminCode = REVIEW_ADMIN_CODE || readEnvString('REVIEW_ADMIN_CODE');
  if (safeCompareCode(code, adminCode)) return 'admin';
  if (safeCompareCode(code, clientCode)) return 'client';
  return null;
}

function encodeBase64Url(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function decodeBase64Url(value: string): string | null {
  try {
    return Buffer.from(value, 'base64url').toString('utf8');
  } catch {
    return null;
  }
}

function signPayload(encodedPayload: string): string {
  const salt = getAuthSalt();
  if (!salt) return '';
  return createHmac('sha256', salt).update(encodedPayload).digest('base64url');
}

export function createReviewToken(role: ReviewRole): { token: string; expiresAt: string } {
  if (!getAuthSalt()) {
    throw new Error('REVIEW_AUTH_SALT (or RATE_LIMIT_SALT) is required for review auth');
  }
  const exp = Date.now() + TOKEN_TTL_MS;
  const payload: ReviewTokenPayload = {
    site_key: reviewSiteKey(),
    role,
    exp,
  };
  const encoded = encodeBase64Url(JSON.stringify(payload));
  const signature = signPayload(encoded);
  return {
    token: `${encoded}.${signature}`,
    expiresAt: new Date(exp).toISOString(),
  };
}

export function verifyReviewToken(token: string): { role: ReviewRole } | null {
  if (!getAuthSalt()) return null;
  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) return null;
  const expected = signPayload(encoded);
  if (!expected || expected.length !== signature.length) return null;
  if (!timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) return null;

  const raw = decodeBase64Url(encoded);
  if (!raw) return null;

  let payload: ReviewTokenPayload;
  try {
    payload = JSON.parse(raw) as ReviewTokenPayload;
  } catch {
    return null;
  }

  if (payload.site_key !== reviewSiteKey()) return null;
  if (payload.role !== 'client' && payload.role !== 'admin') return null;
  if (typeof payload.exp !== 'number' || payload.exp < Date.now()) return null;

  return { role: payload.role };
}

export function parseAuthHeader(request: Request): string | null {
  const header = request.headers.get('Authorization');
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match?.[1]?.trim() || null;
}

export function requireReviewAuth(request: Request): { role: ReviewRole } | null {
  const token = parseAuthHeader(request);
  if (!token) return null;
  return verifyReviewToken(token);
}

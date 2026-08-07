export const prerender = false;

import type { APIRoute } from 'astro';
import { z } from 'astro/zod';

import { createReviewToken, verifyAccessCode } from '@/lib/reviewAuth';
import { getReviewAccess } from '@/lib/reviewAccess';
import { isReviewModeEnabled, reviewModeDisabledResponse } from '@/lib/reviewFlags';

const verifySchema = z.object({
  code: z.string().trim().min(1).max(120),
});

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 10;

type RateBucket = { count: number; resetAt: number };
const verifyAttempts = new Map<string, RateBucket>();

function clientIp(request: Request): string {
  const cf = request.headers.get('cf-connecting-ip')?.trim();
  if (cf) return cf;
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  if (forwarded) return forwarded;
  return 'unknown';
}

/** In-memory per-IP limit. Fail closed when exceeded (429). */
function consumeVerifyAttempt(ip: string): { allowed: true } | { allowed: false; retryAfterSec: number } {
  const now = Date.now();
  const existing = verifyAttempts.get(ip);
  if (!existing || existing.resetAt <= now) {
    verifyAttempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }
  if (existing.count >= RATE_LIMIT_MAX) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }
  existing.count += 1;
  return { allowed: true };
}

export const POST: APIRoute = async ({ request }) => {
  if (!isReviewModeEnabled()) return reviewModeDisabledResponse();

  const rate = consumeVerifyAttempt(clientIp(request));
  if (!rate.allowed) {
    return new Response(JSON.stringify({ success: false, message: 'Too many attempts.' }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(rate.retryAfterSec),
      },
    });
  }

  const access = await getReviewAccess();
  if (!access.allowed) {
    return new Response(
      JSON.stringify({ success: false, message: 'Review not open yet.', reason: access.reason }),
      { status: 403, headers: { 'Content-Type': 'application/json' } },
    );
  }

  let parsedJson: unknown;
  try {
    parsedJson = await request.json();
  } catch {
    return new Response(JSON.stringify({ success: false, message: 'Invalid payload.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const result = verifySchema.safeParse(parsedJson);
  if (!result.success) {
    return new Response(JSON.stringify({ success: false, message: 'Invalid payload.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const role = verifyAccessCode(result.data.code);
  if (!role) {
    return new Response(JSON.stringify({ success: false, message: 'Invalid code.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let token: string;
  let expiresAt: string;
  try {
    ({ token, expiresAt } = createReviewToken(role));
  } catch {
    return new Response(JSON.stringify({ success: false, message: 'Auth is not configured.' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(
    JSON.stringify({
      success: true,
      role,
      token,
      expires_at: expiresAt,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  );
};

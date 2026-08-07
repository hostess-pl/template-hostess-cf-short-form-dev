export const prerender = false

import type { APIRoute } from 'astro'
import { getSessionUser } from '@/lib/supabaseAuth'
import { jsonError, requireCmsProMember } from '@/lib/cms/access'
import { isShortFormProductMode } from '@/lib/portfolioMode'
import { countPublishedPortfoliosForEarlyAdopter } from '@/lib/cms/earlyAdopter'

export const GET: APIRoute = async ({ cookies, request }) => {
  if (!isShortFormProductMode()) {
    return jsonError(404, 'Not found')
  }

  const { supabase, user } = await getSessionUser(
    cookies,
    request.headers.get('cookie') ?? undefined,
  )
  if (!supabase || !user) return jsonError(401, 'Sign in required')
  const member = await requireCmsProMember(supabase, user)
  if (member instanceof Response) return member

  const snapshot = await countPublishedPortfoliosForEarlyAdopter()
  return new Response(
    JSON.stringify({
      claimed: snapshot.claimed,
      cap: snapshot.cap,
      remaining: snapshot.remaining,
      eligible: snapshot.eligible,
      soldOutHint: snapshot.soldOutHint,
      ok: snapshot.ok,
    }),
    {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'Cache-Control': 'private, max-age=60',
      },
    },
  )
}

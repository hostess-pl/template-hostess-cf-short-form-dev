import type { APIRoute } from 'astro'
import { readEnvString } from '@/lib/runtimeEnv'

export const GET: APIRoute = async () => {
  return Response.json(
    {
      product: 'hostesswebs-short-form',
      templateReleaseSha: readEnvString('TEMPLATE_RELEASE_SHA').trim() || null,
      siteSlug: readEnvString('CMS_SITE_SLUG').trim() || null,
    },
    {
      headers: {
        'cache-control': 'no-store',
        'x-content-type-options': 'nosniff',
      },
    },
  )
}

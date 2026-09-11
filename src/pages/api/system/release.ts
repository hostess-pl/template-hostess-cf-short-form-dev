import type { APIRoute } from 'astro'
import { readEnvString } from '@/lib/runtimeEnv'
import { TEMPLATE_RELEASE_SHA } from '@/generated/template-release'

export const GET: APIRoute = async () => {
  return Response.json(
    {
      product: 'hostesswebs-short-form',
      templateReleaseSha: TEMPLATE_RELEASE_SHA.trim() || readEnvString('TEMPLATE_RELEASE_SHA').trim() || null,
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

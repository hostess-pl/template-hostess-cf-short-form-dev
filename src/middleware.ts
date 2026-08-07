import { defineMiddleware } from 'astro:middleware'
import { withCmsHostessOverlay } from '@/lib/cms/withOverlay'
import { createSupabaseServer } from '@/lib/supabaseAuth'
import { getDefaultLocale } from '@/config/site.config'
import { isEnabledLocale, localeFromPath, localePath } from '@/config/seo'
import { resolveCmsSite } from '@/lib/cms/site'
import { isDraftPortfolioStatus, isShortFormProductMode, shouldAuthLockPublicPortfolio } from '@/lib/portfolioMode'

function isRoutablePath(pathname: string): boolean {
  if (pathname === '/' || pathname === '') return true
  if (pathname === '/404') return true
  if (/^\/(en|pl|es)\/?$/.test(pathname)) return true
  if (pathname.startsWith('/api/')) return true
  if (pathname.startsWith('/edit')) return true
  if (pathname.startsWith('/_astro/')) return true
  if (pathname === '/_image' || pathname.startsWith('/_image/')) return true
  if (pathname.startsWith('/_server-islands/')) return true
  if (pathname.startsWith('/videos/')) return true
  if (pathname.startsWith('/cms-')) return true
  if (pathname === '/favicon.svg' || pathname === '/robots.txt') return true
  if (pathname.startsWith('/sitemap')) return true
  return false
}

function isPublicPortfolioPath(pathname: string): boolean {
  if (pathname === '/' || pathname === '') return true
  if (/^\/(en|pl|es)\/?$/.test(pathname)) return true
  return false
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url

  if (pathname.startsWith('/edit/app')) {
    const supabase = createSupabaseServer(
      context.cookies,
      context.request.headers.get('cookie') ?? undefined,
    )
    if (!supabase) return context.redirect('/edit/login?error=config')
    const { data } = await supabase.auth.getUser()
    if (!data.user) return context.redirect('/edit/login')
    return next()
  }

  if (pathname.startsWith('/edit') || pathname.startsWith('/api/edit')) {
    return next()
  }

  // Short-form MVP: auth-lock public portfolio while draft or suspended.
  if (
    isShortFormProductMode() &&
    isPublicPortfolioPath(pathname) &&
    !pathname.startsWith('/api/')
  ) {
    const site = await resolveCmsSite()
    const status = site?.portfolio_status
    if (site && shouldAuthLockPublicPortfolio(status)) {
      const supabase = createSupabaseServer(
        context.cookies,
        context.request.headers.get('cookie') ?? undefined,
      )
      const user = supabase ? (await supabase.auth.getUser()).data.user : null
      if (!user) {
        const nextUrl = encodeURIComponent(pathname || '/')
        return context.redirect(`/edit/login?next=${nextUrl}`)
      }
      context.locals.portfolioDraft = isDraftPortfolioStatus(status)
      context.locals.portfolioSuspended = String(status || '').toLowerCase() === 'suspended'
      context.locals.portfolioAwaitingPayment = false
    } else {
      context.locals.portfolioDraft = false
      context.locals.portfolioSuspended = false
      context.locals.portfolioAwaitingPayment =
        String(status || '').toLowerCase() === 'awaiting_payment'
    }
  }

  return withCmsHostessOverlay(async (data) => {
    if (data) context.locals.cmsHostess = data

    const { pathname: path } = context.url
    const segmentMatch = path.match(/^\/(en|pl|es)(?:\/|$)/)
    const segmentLocale = segmentMatch?.[1]
    const defaultLocale = getDefaultLocale()

    if (segmentLocale && !isEnabledLocale(segmentLocale)) {
      return context.redirect(localePath(defaultLocale), 302)
    }

    if (segmentLocale === defaultLocale) {
      return context.redirect(localePath(defaultLocale), 302)
    }

    const pathLocale = localeFromPath(path)
    if (pathLocale) {
      context.locals.locale = pathLocale
      return await next()
    }

    const cookieLocale = context.cookies.get('locale')?.value
    if (path === '/' || path === '') {
      if (isEnabledLocale(cookieLocale) && cookieLocale !== defaultLocale) {
        return context.redirect(localePath(cookieLocale))
      }
      context.locals.locale = defaultLocale
      return await next()
    }

    context.locals.locale = isEnabledLocale(cookieLocale) ? cookieLocale : defaultLocale

    if (!isRoutablePath(path)) {
      return context.rewrite('/404')
    }

    return await next()
  })
})

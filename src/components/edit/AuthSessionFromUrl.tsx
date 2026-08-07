import { useEffect, useState } from 'react'
import { createSupabaseBrowser } from '@/lib/supabaseAuth'
import type { EmailOtpType } from '@supabase/supabase-js'

type Props = {
  supabaseUrl: string
  supabaseAnonKey: string
}

/**
 * Completes magic-link sign-in for:
 * - ?token_hash=&type= (ops cms:login-link + email verify deep links) — preferred, no PKCE
 * - ?code= (PKCE — verifier must be in this browser's localStorage from signInWithOtp)
 * - #access_token / #refresh_token (implicit)
 */
export function AuthSessionFromUrl({ supabaseUrl, supabaseAnonKey }: Props) {
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function complete() {
      const url = new URL(window.location.href)
      const code = url.searchParams.get('code')
      const tokenHash =
        url.searchParams.get('token_hash') || url.searchParams.get('token')
      const otpType = (url.searchParams.get('type') as EmailOtpType | null) || 'magiclink'
      const hash = new URLSearchParams(url.hash.replace(/^#/, ''))
      const accessToken = hash.get('access_token')
      const refreshToken = hash.get('refresh_token')
      const errorDescription =
        url.searchParams.get('error_description') || url.searchParams.get('error')

      if (errorDescription && !code && !tokenHash && !(accessToken && refreshToken)) {
        console.warn('[edit] auth redirect error', errorDescription)
        window.location.replace('/edit/login?error=auth')
        return
      }

      if (!code && !(accessToken && refreshToken) && !tokenHash) {
        if (!cancelled) setMessage(null)
        return
      }

      setMessage('Completing sign-in…')
      const supabase = createSupabaseBrowser(supabaseUrl, supabaseAnonKey)
      if (!supabase) {
        if (!cancelled) {
          setMessage('Auth is not configured')
          window.location.replace('/edit/login?error=config')
        }
        return
      }

      try {
        // Prefer token_hash before PKCE code — ops links and many email templates use it.
        if (tokenHash) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: otpType,
          })
          if (error) throw error
        } else if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error
        } else if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          if (error) throw error
        }

        if (cancelled) return
        window.history.replaceState({}, '', '/edit/auth/callback')
        const next = url.searchParams.get('next')
        const type = otpType || hash.get('type') || ''
        const isRecovery =
          next === 'recovery' || type === 'recovery' || hash.get('type') === 'recovery'
        window.location.replace(isRecovery ? '/edit/app?recovery=1&section=account' : '/edit/app')
      } catch (error) {
        if (cancelled) return
        console.warn('[edit] session-from-url', error)
        window.location.replace('/edit/login?error=auth')
      }
    }

    void complete()
    return () => {
      cancelled = true
    }
  }, [supabaseUrl, supabaseAnonKey])

  if (!message) return null
  return (
    <p className="cms-login__lede" style={{ textAlign: 'center' }} role="status">
      {message}
    </p>
  )
}

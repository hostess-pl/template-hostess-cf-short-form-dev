import type { APIRoute } from 'astro'
import { createSupabaseServer } from '@/lib/supabaseAuth'

export const prerender = false

export const GET: APIRoute = async ({ cookies, request, redirect }) => {
  const supabase = createSupabaseServer(cookies, request.headers.get('cookie') ?? undefined)
  if (supabase) await supabase.auth.signOut()
  return redirect('/edit/login')
}

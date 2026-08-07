import { getSupabaseAdmin } from '@/lib/supabase';

export async function countSiteComments(siteKey: string): Promise<number> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return 0;

  const { count, error } = await supabase
    .from('preview_feedback_comments')
    .select('*', { count: 'exact', head: true })
    .eq('site_key', siteKey);

  if (error) {
    console.error('review summary count error:', error.message);
    return 0;
  }

  return count ?? 0;
}

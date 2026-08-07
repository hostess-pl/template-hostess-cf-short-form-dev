import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

function loadEnv(path) {
  const env = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

const env = loadEnv('.env');
const url = env.SUPABASE_URL ?? '';
const key = env.SUPABASE_SERVICE_ROLE_KEY ?? '';
console.log('url', url);
console.log('key_len', key.length);

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const rpc = await supabase.rpc('api_try_consume_quota', {
  p_route: 'analytics_page_view',
  p_ip_hash: 'devtest',
  p_max: 120,
  p_window_minutes: 60,
});
console.log('rpc error', rpc.error?.message ?? null);
console.log('rpc data', rpc.data);

const insert = await supabase
  .from('preview_feedback_comments')
  .insert({
    site_key: 'localhost',
    page_path: '/test-script',
    locale: 'en',
    selector: 'body',
    rel_x: 0.1,
    rel_y: 0.1,
    doc_x: 1,
    doc_y: 1,
    annotation_type: 'point',
    message: 'script test',
    status: 'open',
  })
  .select('id')
  .single();

console.log('insert error', insert.error?.message ?? null);
console.log('insert data', insert.data);

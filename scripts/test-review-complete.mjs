import { readFileSync } from 'node:fs';
import { createHmac } from 'node:crypto';

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
const submissionId = process.argv[2] || 'DqvqE25';
const siteKey = process.argv[3] || 'localhost';
const previewUrl = process.argv[4] || 'http://localhost:4321';

const payload = {
  event: 'review_complete',
  triggeredBy: 'user',
  submissionId,
  siteKey,
  previewUrl,
  repo: 'hostess-pl/aog-dqvqe25',
  submittedAt: new Date().toISOString(),
};

const body = JSON.stringify(payload);
const sig = `sha256=${createHmac('sha256', env.REVIEW_WEBHOOK_SECRET).update(body).digest('hex')}`;

const res = await fetch(env.N8N_REVIEW_COMPLETE_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Hostess-Signature': sig,
  },
  body,
});

console.log('payload', payload);
console.log('status', res.status);
console.log('body', await res.text());

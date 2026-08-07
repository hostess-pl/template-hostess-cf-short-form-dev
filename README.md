# Hostess portfolio template — Modern (Cloudflare Workers)

Modern editorial variant of the hostess portfolio factory blueprint. Same `hostess.json` contract, provision scripts, and APIs as [`template-hostess-cf`](../template-hostess-cf/), with a two-column magazine-style layout.

## Local development

```bash
pnpm install
cp .env.example .env   # or use the bundled .env with dev-admin / dev-client
pnpm dev
```

Open `http://localhost:4321/` — the review toolbar appears automatically during `pnpm dev` on localhost.

Use **`pnpm dev:local`** when you need Supabase (save comments, Send for production). Standard `pnpm dev` uses the Cloudflare workerd runtime; outbound HTTPS to Supabase can fail locally with `internal error; reference = …`.

| Code | Role |
|------|------|
| `dev-admin` | Admin unlock (local `.env` default) |
| `dev-client` | Client unlock (local `.env` default) |

Production preview uses per-deploy codes from `pnpm deploy:preview` output, not these dev values.

To save comments or test **Send for production**, add `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and review webhook secrets to `.env` (sync from ops via `sync-gh-secrets.sh`).

Site content lives in `src/content/hostess.json` (Andreu fixture bundled for CI). Config, SEO, analytics keys, and gallery images are derived from that file at build time.

## Environment

Copy `.env.example` to `.env`. Key variables:

| Variable | Purpose |
|----------|---------|
| `SITE_URL` | Canonical URL baked into build |
| `RESEND_FROM` / `RESEND_TO` | Contact form email routing |
| `PREVIEW_ID` | Override preview Worker suffix (default: `hostess.json` → `submissionId`) |
| `WORKERS_DEV_SUBDOMAIN` | Cloudflare account workers.dev subdomain (e.g. `hostesspl`) |
| `REVIEW_ADMIN_CODE` / `REVIEW_AUTH_SALT` | Preview feedback toolbar auth |
| `REVIEW_WEBHOOK_SECRET` / `N8N_REVIEW_COMPLETE_URL` | Signed webhook when client sends review for production |

Sync review webhook secrets from ops to each generated repo:

```bash
hostesses/scripts/sync-gh-secrets.sh hostess-pl <repo-slug>
```

Requires ops `.env` vars `WF_REVIEW_WEBHOOK_SECRET` and `WF_N8N_REVIEW_COMPLETE_URL`.

## Provision from payload

```bash
node scripts/provision-from-payload.mjs ../hostesses/fixtures/andreu-example.json
pnpm check && pnpm build
```

Downloads images when `assets.hero` / `assets.events` URLs are present. Updates `package.json` name to `hostess-{slug}`.

## Deploy preview

```bash
pnpm deploy:preview
```

Builds with `REVIEW_MODE_ENABLED=true`, deploys `preview-{submissionId}.{subdomain}.workers.dev`, syncs Supabase secrets, prints JSON:

```json
{"previewUrl":"https://preview-dqvqe25.hostesspl.workers.dev","clientCode":"…","workerName":"preview-dqvqe25","submissionId":"DqvqE25","analyticsEnv":"preview-dqvqe25","workersDevSubdomain":"hostesspl"}
```

Requires `wrangler login` or `CLOUDFLARE_API_TOKEN`, and `WORKERS_DEV_SUBDOMAIN` for account-scoped preview URLs.

## GitHub Actions

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | push / PR | `pnpm check` + `pnpm build` |
| `provision-hostess.yml` | `repository_dispatch` type `provision` | Provision + deploy + n8n callback |

### Manual `repository_dispatch` test

GitHub allows **at most 10** `client_payload` properties. Use the compact shape:

```bash
node hostesses/scripts/dispatch-fixture.mjs YOUR-REPO-NAME
```

Or via `gh api` (payload is `submissionId`, `callbackUrl`, and `hostess` as a JSON string):

```json
{
  "event_type": "provision",
  "client_payload": {
    "submissionId": "DqvqE25",
    "callbackUrl": "",
    "hostess": "<stringified contents of hostesses/fixtures/andreu-example.json>"
  }
}
```

Org secrets: `CLOUDFLARE_API_TOKEN`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `REVIEW_ADMIN_CODE`, `REVIEW_AUTH_SALT`, `REVIEW_WEBHOOK_SECRET`, `N8N_REVIEW_COMPLETE_URL`.

## Factory pipeline (n8n)

See `hostesses/n8n/workflow-outline.md` and `hostesses/init.md` Phase 2.

1. Tally form `44DDEb` → n8n normalize
2. Resend confirmation (no feedback code)
3. GitHub generate repo from this template
4. `repository_dispatch` provision → preview URL + `clientCode` callback

## E2E verification checklist

1. `pnpm check && pnpm build` — no Karolina strings in `dist/`
2. `node hostesses/scripts/submit-tally-example.mjs` — new Tally submission (requires `TALLY_API_KEY` in `hostesses/.env`)
3. n8n Code output matches `hostesses/fixtures/andreu-example.json` shape
4. Manual `repository_dispatch` provisions images and deploys `preview-{submissionId}`
5. Second hostess deploy uses distinct Worker name and analytics keys (`hostess.slug` prefix)
6. `POST /api/review-comment` without token returns 401 on preview
7. Preview toolbar: add comment → **Send for production** → ops Telegram (requires review-open + synced webhook secrets)

## SQL

Karolina-specific analytics seeds moved to `hostesses/sql/`. Generic preview-feedback migrations remain in `scripts/`.

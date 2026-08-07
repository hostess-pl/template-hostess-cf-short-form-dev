import { defineConfig, envField } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';

const useNodeDev = process.env.ASTRO_DEV_NODE === '1';

function resolveSiteUrl() {
  const raw = process.env.SITE_URL || 'https://hostess-template.workers.dev';
  try {
    return new URL(raw).toString().replace(/\/$/, '');
  } catch {
    return 'https://hostess-template.workers.dev';
  }
}

const site = resolveSiteUrl();
const allowedDomains = [];

try {
  const parsed = new URL(site);
  const protocol = parsed.protocol.replace(':', '');
  const base = {
    protocol,
    ...(parsed.port ? { port: parsed.port } : {}),
  };
  allowedDomains.push({ hostname: parsed.hostname, ...base });

  if (parsed.hostname.startsWith('www.')) {
    allowedDomains.push({ hostname: parsed.hostname.slice(4), ...base });
  } else {
    allowedDomains.push({ hostname: `www.${parsed.hostname}`, ...base });
  }
} catch {
  // allowedDomains stays empty; checkOrigin can be disabled via CHECK_ORIGIN=false
}

export default defineConfig({
  output: 'server',
  adapter: useNodeDev
    ? node({ mode: 'middleware' })
    : cloudflare({
        // Avoid compile-image workerd boots; pin wrangler/workerd separately for GHA
        // (_cf_ALARM 2-vs-3 column bug in workerd 1.20260701.1).
        imageService: 'passthrough',
        prerenderEnvironment: 'node',
      }),
  session: {
    driver: {
      entrypoint: 'unstorage/drivers/null',
    },
  },
  site,
  integrations: [sitemap(), react()],
  vite: {
    plugins: [tailwindcss()],
  },
  security: {
    checkOrigin: (process.env.CHECK_ORIGIN || 'true').toLowerCase() !== 'false',
    allowedDomains,
  },
  env: {
    schema: {
      SITE_URL: envField.string({ context: 'server', access: 'public', optional: true }),
      REVIEW_MODE_ENABLED: envField.boolean({ context: 'server', access: 'public', default: false }),
      /** short_form = auth-locked draft → publish product mode (this tip only). */
      PORTFOLIO_PRODUCT_MODE: envField.string({
        context: 'server',
        access: 'public',
        optional: true,
        default: 'short_form',
      }),

      RESEND_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true, default: '' }),
      RESEND_FROM: envField.string({ context: 'server', access: 'secret', optional: true, default: '' }),
      RESEND_TO: envField.string({ context: 'server', access: 'secret', optional: true, default: '' }),

      SUPABASE_URL: envField.string({ context: 'server', access: 'secret', optional: true, default: '' }),
      SUPABASE_SERVICE_ROLE_KEY: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
        default: '',
      }),
      SUPABASE_TRACKING_ENABLED: envField.boolean({ context: 'server', access: 'secret', default: false }),
      ANALYTICS_SALT: envField.string({ context: 'server', access: 'secret', optional: true, default: '' }),
      ANALYTICS_ENV: envField.string({ context: 'server', access: 'secret', optional: true, default: '' }),
      ANALYTICS_SITE_ID: envField.string({ context: 'server', access: 'secret', optional: true, default: '' }),
      RATE_LIMIT_SALT: envField.string({ context: 'server', access: 'secret', optional: true, default: '' }),
      REVIEW_CLIENT_CODE: envField.string({ context: 'server', access: 'secret', optional: true, default: '' }),
      REVIEW_ADMIN_CODE: envField.string({ context: 'server', access: 'secret', optional: true, default: '' }),
      REVIEW_AUTH_SALT: envField.string({ context: 'server', access: 'secret', optional: true, default: '' }),
      REVIEW_WEBHOOK_SECRET: envField.string({ context: 'server', access: 'secret', optional: true, default: '' }),
      N8N_REVIEW_COMPLETE_URL: envField.string({ context: 'server', access: 'secret', optional: true, default: '' }),
      PORTFOLIO_PUBLISH_NOTIFY_URL: envField.string({ context: 'server', access: 'secret', optional: true, default: '' }),
      PORTFOLIO_PUBLISH_HMAC_SECRET: envField.string({ context: 'server', access: 'secret', optional: true, default: '' }),

      CHECK_ORIGIN: envField.boolean({ context: 'server', access: 'secret', default: true }),

      API_CONTACT_MAX_PER_HOUR: envField.number({ context: 'server', access: 'secret', default: 10 }),
      API_ANALYTICS_PAGE_VIEW_MAX_PER_HOUR: envField.number({
        context: 'server',
        access: 'secret',
        default: 120,
      }),

      PUBLIC_CONSENT_ENABLED: envField.boolean({ context: 'client', access: 'public', default: false }),
      PUBLIC_ANALYTICS_ENABLED: envField.boolean({ context: 'client', access: 'public', default: true }),
      PUBLIC_SUPABASE_URL: envField.string({
        context: 'client',
        access: 'public',
        optional: true,
        default: '',
      }),
      PUBLIC_SUPABASE_ANON_KEY: envField.string({
        context: 'client',
        access: 'public',
        optional: true,
        default: '',
      }),
      PUBLIC_CMS_SITE_SLUG: envField.string({
        context: 'client',
        access: 'public',
        optional: true,
        default: '',
      }),
      CMS_SITE_SLUG: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
        default: '',
      }),
    },
  },
});

import { z } from 'astro/zod';

export const ANALYTICS_EVENT_KEYS = [
  'page_view',
  'session_engagement',
  'interaction',
  'lead_captured',
] as const;

export type AnalyticsEventKey = (typeof ANALYTICS_EVENT_KEYS)[number];

export const METRICS_MODULE_IDS = [
  'summary_cards',
  'page_views',
  'engagement',
  'interactions',
  'utm_sources',
  'utm_campaigns',
  'device_breakdown',
  'locale_breakdown',
  'latest_events',
] as const;

export type MetricsModuleId = (typeof METRICS_MODULE_IDS)[number];

const eventFlagsSchema = z.object({
  collect: z.boolean(),
  dashboard: z.boolean(),
});

const analyticsEventsSchema = z
  .object(
    Object.fromEntries(ANALYTICS_EVENT_KEYS.map((key) => [key, eventFlagsSchema])) as Record<
      AnalyticsEventKey,
      typeof eventFlagsSchema
    >,
  )
  .partial()
  .refine((events) => Object.keys(events).length >= 1, {
    message: 'At least one analytics event must be configured',
  });

const moduleSchema = z.object({
  id: z.enum(METRICS_MODULE_IDS),
  enabled: z.boolean(),
  requires_events: z.array(z.enum(ANALYTICS_EVENT_KEYS)).optional(),
});

export const analyticsSiteProfileSchema = z.object({
  display_name: z.string().min(1).max(200),
  events: analyticsEventsSchema,
  dashboard: z.object({
    modules: z.array(moduleSchema).min(1),
  }),
});

export type AnalyticsSiteProfile = z.infer<typeof analyticsSiteProfileSchema>;

/** Portfolio profile — page views and contact form leads only. */
export function createPortfolioProfile(displayName: string): AnalyticsSiteProfile {
  const enabled = { collect: true, dashboard: true };
  return {
    display_name: displayName,
    events: {
      page_view: enabled,
      lead_captured: enabled,
    },
    dashboard: {
      modules: [
        { id: 'summary_cards', enabled: true },
        { id: 'page_views', enabled: true },
        { id: 'device_breakdown', enabled: true },
        { id: 'locale_breakdown', enabled: true },
        { id: 'utm_sources', enabled: true },
        { id: 'latest_events', enabled: true },
      ],
    },
  };
}

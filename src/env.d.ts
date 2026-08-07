// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare module '*.mp4' {
  const src: string;
  export default src;
}

type Locale = import('@/config/site.config').Locale;
type HostessData = import('@/content/hostess.schema').HostessData;

declare namespace App {
  interface Locals {
    locale: Locale;
    /** CMS overlay document for this request (set by middleware when Pro CMS is active). */
    cmsHostess?: HostessData;
    /** Short-form MVP: public view is draft and viewer is authenticated. */
    portfolioDraft?: boolean;
    portfolioSuspended?: boolean;
    portfolioAwaitingPayment?: boolean;
  }
}

// GA4 hook. Set NEXT_PUBLIC_GA_ID to enable; no-ops otherwise.
// Funnel events: view_item, add_to_cart, begin_checkout, purchase.
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "";

export function track(event: string, params: Record<string, unknown> = {}) {
  if (!GA_ID || typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", event, params);
}

export function AnalyticsScripts() {
  if (!GA_ID) return null;
  return null; // script tags live in layout; this keeps the import graph explicit
}

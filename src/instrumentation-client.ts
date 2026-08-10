import * as Sentry from "@sentry/nextjs";
import { initPostHog, trackPageview } from "@/lib/analytics/posthog";

const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    tracesSampleRate: 0.1,
    // Sin session replay por defecto — decisión de privacidad, no técnica;
    // activar explícitamente más adelante si se decide que aporta valor.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? "development",
  });
}

initPostHog();

export function onRouterTransitionStart(url: string) {
  trackPageview(url);
}

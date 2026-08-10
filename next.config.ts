import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  typedRoutes: true,
};

export default withSentryConfig(withNextIntl(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Sin SENTRY_AUTH_TOKEN (no configurado aún) esto simplemente no sube
  // source maps — el build no falla, sólo los stack traces en Sentry
  // quedan minificados hasta que se configure.
  silent: true,
  widenClientFileUpload: true,
  // Evita que el propio SDK genere ruido de build cuando no hay DSN.
  telemetry: false,
});

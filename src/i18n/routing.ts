import { defineRouting } from "next-intl/routing";

export const locales = ["es", "en"] as const;
export type AppLocale = (typeof locales)[number];
export const defaultLocale: AppLocale = "es";

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "always",
  pathnames: {
    "/": "/",
    "/plantillas": {
      es: "/plantillas",
      en: "/templates",
    },
    "/plantillas/[slug]": {
      es: "/plantillas/[slug]",
      en: "/templates/[slug]",
    },
    "/guias": {
      es: "/guias",
      en: "/guides",
    },
    "/guias/[slug]": {
      es: "/guias/[slug]",
      en: "/guides/[slug]",
    },
    "/blog": "/blog",
    "/blog/[slug]": "/blog/[slug]",
    "/cuenta": {
      es: "/cuenta",
      en: "/account",
    },
    "/mis-listas": {
      es: "/mis-listas",
      en: "/my-lists",
    },
    "/precios": {
      es: "/precios",
      en: "/pricing",
    },
  },
});

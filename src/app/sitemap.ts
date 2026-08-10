import type { MetadataRoute } from "next";
import { getGuideByKey, getGuides, getTemplateByKey, getTemplates } from "@/content";
import { type AppLocale, routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/seo/site";
import { type ContentSection, contentUrl, sectionUrl } from "@/lib/seo/urls";

/**
 * `lastModified` sale de la fecha de revisión real de cada pieza, no de
 * `new Date()`: un sitemap que dice que todo cambió hoy deja de ser una señal
 * útil y Google acaba ignorándola (docs/02-SEO.md §2.3).
 *
 * Sólo entran rutas indexables. `/l` e `/i` son `noindex` y no aparecen.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const landings: MetadataRoute.Sitemap = routing.locales.map((locale) => ({
    url: `${SITE_URL}/${locale}`,
    lastModified: mostRecent([...getTemplates(locale), ...getGuides(locale)]),
    alternates: {
      languages: Object.fromEntries(routing.locales.map((l) => [l, `${SITE_URL}/${l}`])),
    },
  }));

  const hubs: MetadataRoute.Sitemap = routing.locales.flatMap((locale) =>
    (["templates", "guides"] as const).map((section) => ({
      url: sectionUrl(section, locale),
      // Un hub cambia cuando cambia alguna de las piezas que lista.
      lastModified: mostRecent(section === "templates" ? getTemplates(locale) : getGuides(locale)),
      alternates: {
        languages: Object.fromEntries(routing.locales.map((l) => [l, sectionUrl(section, l)])),
      },
    })),
  );

  const templates: MetadataRoute.Sitemap = routing.locales.flatMap((locale) =>
    getTemplates(locale).map((template) => ({
      url: contentUrl("templates", locale, template.slug),
      lastModified: new Date(template.updatedAt),
      alternates: { languages: twinLanguages("templates", template.key, getTemplateByKey) },
    })),
  );

  const guides: MetadataRoute.Sitemap = routing.locales.flatMap((locale) =>
    getGuides(locale).map((guide) => ({
      url: contentUrl("guides", locale, guide.slug),
      lastModified: new Date(guide.updatedAt),
      alternates: { languages: twinLanguages("guides", guide.key, getGuideByKey) },
    })),
  );

  return [...landings, ...hubs, ...templates, ...guides];
}

/** Fecha de revisión más reciente de un conjunto de piezas. */
function mostRecent(entries: Array<{ updatedAt: string }>): Date {
  return entries.reduce<Date>((latest, entry) => {
    const date = new Date(entry.updatedAt);
    return date > latest ? date : latest;
  }, new Date(0));
}

/** URLs de la misma pieza en cada idioma. Los slugs difieren, así que hay que
 *  resolver el equivalente por clave, no traducir la ruta. */
function twinLanguages(
  section: ContentSection,
  key: string,
  lookup: (locale: AppLocale, key: string) => { slug: string } | undefined,
): Record<string, string> {
  const languages: Record<string, string> = {};

  for (const locale of routing.locales) {
    const twin = lookup(locale, key);
    if (twin) languages[locale] = contentUrl(section, locale, twin.slug);
  }

  return languages;
}

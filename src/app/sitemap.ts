import type { MetadataRoute } from "next";
import {
  getGuideByKey,
  getGuides,
  getPostByKey,
  getPosts,
  getPrivacy,
  getTemplateByKey,
  getTemplates,
  getTerms,
} from "@/content";
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
    lastModified: mostRecent([...getTemplates(locale), ...getGuides(locale), ...getPosts(locale)]),
    alternates: {
      languages: Object.fromEntries(routing.locales.map((l) => [l, `${SITE_URL}/${l}`])),
    },
  }));

  const hubs: MetadataRoute.Sitemap = routing.locales.flatMap((locale) =>
    (["templates", "guides", "blog"] as const).map((section) => ({
      url: sectionUrl(section, locale),
      // Un hub cambia cuando cambia alguna de las piezas que lista.
      lastModified: mostRecent(HUB_ENTRIES[section](locale)),
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

  const posts: MetadataRoute.Sitemap = routing.locales.flatMap((locale) =>
    getPosts(locale).map((post) => ({
      url: contentUrl("blog", locale, post.slug),
      lastModified: new Date(post.updatedAt),
      alternates: { languages: twinLanguages("blog", post.key, getPostByKey) },
    })),
  );

  // Páginas estáticas sin contenido versionado propio: su fecha es la del
  // documento (legal) o la del despliegue (precios), no la de ninguna pieza.
  const legal: MetadataRoute.Sitemap = routing.locales.flatMap((locale) => [
    {
      url: sectionUrl("privacy", locale),
      lastModified: new Date(getPrivacy(locale).updatedAt),
      alternates: {
        languages: Object.fromEntries(routing.locales.map((l) => [l, sectionUrl("privacy", l)])),
      },
    },
    {
      url: sectionUrl("terms", locale),
      lastModified: new Date(getTerms(locale).updatedAt),
      alternates: {
        languages: Object.fromEntries(routing.locales.map((l) => [l, sectionUrl("terms", l)])),
      },
    },
    {
      url: sectionUrl("about", locale),
      lastModified: new Date(ABOUT_UPDATED_AT),
      alternates: {
        languages: Object.fromEntries(routing.locales.map((l) => [l, sectionUrl("about", l)])),
      },
    },
    {
      url: sectionUrl("pricing", locale),
      lastModified: mostRecent([
        ...getTemplates(locale),
        ...getGuides(locale),
        ...getPosts(locale),
      ]),
      alternates: {
        languages: Object.fromEntries(routing.locales.map((l) => [l, sectionUrl("pricing", l)])),
      },
    },
  ]);

  return [...landings, ...hubs, ...templates, ...guides, ...posts, ...legal];
}

/** La página de «quiénes somos» no tiene contenido versionado: su fecha se
 *  toca a mano cuando se reescribe, como cualquier otra revisión real. */
const ABOUT_UPDATED_AT = "2026-08-11";

/** Piezas que lista cada hub, para derivar su lastmod. */
const HUB_ENTRIES = {
  templates: getTemplates,
  guides: getGuides,
  blog: getPosts,
} satisfies Record<string, (locale: AppLocale) => Array<{ updatedAt: string }>>;

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

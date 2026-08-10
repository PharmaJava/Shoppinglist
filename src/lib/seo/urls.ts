import type { AppLocale } from "@/i18n/routing";
import { SITE_URL } from "./site";

/**
 * Segmento público de cada sección, por idioma.
 *
 * Debe coincidir con `pathnames` de src/i18n/routing.ts. Ahí viven las rutas
 * *internas* (`/plantillas`, que es también la ruta de los archivos en
 * `src/app/[locale]/`); aquí las *públicas*, que son las que deben aparecer en
 * canonical, hreflang y sitemap — emitir la interna en inglés mandaría a Google
 * a `/en/plantillas`, que sólo existe como destino de una reescritura.
 */
const SECTION_SEGMENT = {
  templates: { es: "plantillas", en: "templates" },
  guides: { es: "guias", en: "guides" },
  // «blog» funciona igual en ambos idiomas; se mantiene aquí para que todo el
  // contenido pase por el mismo constructor de URLs.
  blog: { es: "blog", en: "blog" },
} as const;

export type ContentSection = keyof typeof SECTION_SEGMENT;

export function sectionPath(section: ContentSection, locale: AppLocale): string {
  return `/${locale}/${SECTION_SEGMENT[section][locale]}`;
}

export function sectionUrl(section: ContentSection, locale: AppLocale): string {
  return `${SITE_URL}${sectionPath(section, locale)}`;
}

export function contentPath(section: ContentSection, locale: AppLocale, slug: string): string {
  return `${sectionPath(section, locale)}/${slug}`;
}

export function contentUrl(section: ContentSection, locale: AppLocale, slug: string): string {
  return `${SITE_URL}${contentPath(section, locale, slug)}`;
}

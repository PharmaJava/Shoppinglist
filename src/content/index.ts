import type { AppLocale } from "@/i18n/routing";
import { guidesEn } from "./guides/en";
import { guidesEs } from "./guides/es";
import { templatesEn } from "./templates/en";
import { templatesEs } from "./templates/es";
import type { ContentKey, Guide, Template } from "./types";

const TEMPLATES: Record<AppLocale, Template[]> = { es: templatesEs, en: templatesEn };
const GUIDES: Record<AppLocale, Guide[]> = { es: guidesEs, en: guidesEn };

export function getTemplates(locale: AppLocale): Template[] {
  return TEMPLATES[locale];
}

export function getGuides(locale: AppLocale): Guide[] {
  return GUIDES[locale];
}

export function getTemplate(locale: AppLocale, slug: string): Template | undefined {
  return TEMPLATES[locale].find((template) => template.slug === slug);
}

export function getGuide(locale: AppLocale, slug: string): Guide | undefined {
  return GUIDES[locale].find((guide) => guide.slug === slug);
}

/** Resuelve la pieza equivalente en otro idioma. La necesita `hreflang`: los
 *  slugs no coinciden entre idiomas, sólo la clave. */
export function getTemplateByKey(locale: AppLocale, key: ContentKey): Template | undefined {
  return TEMPLATES[locale].find((template) => template.key === key);
}

export function getGuideByKey(locale: AppLocale, key: ContentKey): Guide | undefined {
  return GUIDES[locale].find((guide) => guide.key === key);
}

export const allTemplates: Template[] = [...templatesEs, ...templatesEn];
export const allGuides: Guide[] = [...guidesEs, ...guidesEn];

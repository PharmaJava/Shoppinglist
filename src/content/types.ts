import type { AppLocale } from "@/i18n/routing";

/**
 * Modelo de contenido de plantillas y guías.
 *
 * El contenido vive en TypeScript, no en MDX: la lista de productos de una
 * plantilla no es prosa, es un dato estructurado que alimenta tres consumidores
 * a la vez — el HTML visible, el JSON-LD de `ItemList` y el botón que crea la
 * lista real. Tenerlo tipado evita que esos tres se desincronicen.
 */

/** Une la versión española e inglesa de una misma pieza, que NO son traducción
 *  la una de la otra (ver docs/02-SEO.md §4.3) pero sí equivalentes para
 *  `hreflang`. Sin esta clave no se pueden emitir alternates correctos, porque
 *  los slugs difieren entre idiomas. */
export type ContentKey = string;

export interface TemplateItem {
  name: string;
  qty?: number;
  unit?: string;
  /** Matiz útil para el lector: marca, formato, criterio de compra. */
  note?: string;
}

/**
 * Pasillos disponibles. Refleja los identificadores de `public.categories` y
 * las claves del espacio `categories` de i18n: tipado como unión, un pasillo
 * mal escrito en una plantilla falla al compilar en vez de romper la página.
 */
export type CategoryId =
  | "produce"
  | "bakery"
  | "dairy"
  | "meat"
  | "fish"
  | "deli"
  | "frozen"
  | "pantry"
  | "drinks"
  | "snacks"
  | "breakfast"
  | "cleaning"
  | "personal"
  | "baby"
  | "pet"
  | "other";

/** Agrupación por pasillo. */
export interface TemplateSection {
  categoryId: CategoryId;
  items: TemplateItem[];
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface ContentBlock {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

interface ContentBase {
  key: ContentKey;
  slug: string;
  locale: AppLocale;
  /** H1 de la página. */
  title: string;
  metaTitle: string;
  metaDescription: string;
  /** Entradilla, también usada como resumen en el hub. */
  excerpt: string;
  body: ContentBlock[];
  faq: FaqItem[];
  /** Fecha real de última revisión. Alimenta `lastmod` del sitemap, que debe
   *  reflejar cambios de verdad: falsearlo con `new Date()` quema la señal. */
  updatedAt: string;
}

export interface Template extends ContentBase {
  /** Para cuántas personas y qué periodo cubre. */
  serves: string;
  /** Gasto orientativo, con la moneda ya escrita según mercado. */
  budget: string;
  sections: TemplateSection[];
  relatedTemplates: ContentKey[];
  relatedGuides: ContentKey[];
}

export interface Guide extends ContentBase {
  publishedAt: string;
  relatedTemplates: ContentKey[];
  relatedGuides: ContentKey[];
}

/**
 * Artículo de blog. Misma estructura editorial que una guía, pero distinta
 * intención: la guía es evergreen y atada al producto; el post ataca consultas
 * de actualidad o de opinión y puede caducar. Mantenerlos separados permite
 * que el hub del blog no diluya el cluster de guías (docs/02-SEO.md §4.1).
 */
export interface Post extends ContentBase {
  publishedAt: string;
  relatedTemplates: ContentKey[];
  relatedGuides: ContentKey[];
  relatedPosts: ContentKey[];
}

/**
 * Documento legal. No lleva `key` ni gemela por idioma como el contenido
 * editorial: privacidad y términos son la misma obligación descrita en dos
 * lenguas, y la equivalencia es por tipo de documento, no por contenido.
 */
export interface LegalDocument {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  blocks: ContentBlock[];
  updatedAt: string;
}

/** Marcador que queda por rellenar en los textos legales. Buscarlo antes de
 *  abrir al público: publicar una política con corchetes es peor que no tenerla. */
export const OPERATOR_PLACEHOLDER = /\[[A-ZÁÉÍÓÚÑ /]+\]/;

/** Total de productos de una plantilla, para el hub y los datos estructurados. */
export function countTemplateItems(template: Template): number {
  return template.sections.reduce((total, section) => total + section.items.length, 0);
}

/** Aplana las secciones al orden en que se muestran, que es el orden en que se
 *  crean los productos al usar la plantilla. */
export function flattenTemplateItems(
  template: Template,
): Array<TemplateItem & { categoryId: CategoryId }> {
  return template.sections.flatMap((section) =>
    section.items.map((item) => ({ ...item, categoryId: section.categoryId })),
  );
}

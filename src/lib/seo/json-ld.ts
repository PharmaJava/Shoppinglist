import { flattenTemplateItems, type Guide, type Post, type Template } from "@/content/types";
import type { AppLocale } from "@/i18n/routing";
import { SITE_URL } from "./site";
import { contentUrl, sectionUrl } from "./urls";

/**
 * Datos estructurados de plantillas y guías.
 *
 * No se emite `HowTo`: Google retiró sus resultados enriquecidos, así que hoy
 * sólo añade peso a la página. Tampoco `AggregateRating`, que sin valoraciones
 * reales y visibles es motivo de acción manual por spam (docs/02-SEO.md §2.2).
 */

interface Breadcrumb {
  name: string;
  url: string;
}

function breadcrumbList(items: Breadcrumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

function faqPage(faq: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: { "@type": "Answer", text: entry.answer },
    })),
  };
}

export function templateJsonLd(
  template: Template,
  locale: AppLocale,
  labels: { home: string; templates: string },
): object[] {
  const url = contentUrl("templates", locale, template.slug);

  return [
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: template.title,
      description: template.metaDescription,
      url,
      numberOfItems: flattenTemplateItems(template).length,
      itemListElement: flattenTemplateItems(template).map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
      })),
    },
    faqPage(template.faq),
    breadcrumbList([
      { name: labels.home, url: `${SITE_URL}/${locale}` },
      { name: labels.templates, url: sectionUrl("templates", locale) },
      { name: template.title, url },
    ]),
  ];
}

export function postJsonLd(
  post: Post,
  locale: AppLocale,
  labels: { home: string; blog: string; siteName: string },
): object[] {
  const url = contentUrl("blog", locale, post.slug);

  return [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.metaDescription,
      url,
      datePublished: post.publishedAt,
      dateModified: post.updatedAt,
      inLanguage: locale,
      author: { "@type": "Organization", name: labels.siteName, url: SITE_URL },
      publisher: { "@type": "Organization", name: labels.siteName, url: SITE_URL },
    },
    faqPage(post.faq),
    breadcrumbList([
      { name: labels.home, url: `${SITE_URL}/${locale}` },
      { name: labels.blog, url: sectionUrl("blog", locale) },
      { name: post.title, url },
    ]),
  ];
}

export function guideJsonLd(
  guide: Guide,
  locale: AppLocale,
  labels: { home: string; guides: string; siteName: string },
): object[] {
  const url = contentUrl("guides", locale, guide.slug);

  return [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: guide.title,
      description: guide.metaDescription,
      url,
      datePublished: guide.publishedAt,
      dateModified: guide.updatedAt,
      inLanguage: locale,
      author: { "@type": "Organization", name: labels.siteName, url: SITE_URL },
      publisher: { "@type": "Organization", name: labels.siteName, url: SITE_URL },
    },
    faqPage(guide.faq),
    breadcrumbList([
      { name: labels.home, url: `${SITE_URL}/${locale}` },
      { name: labels.guides, url: sectionUrl("guides", locale) },
      { name: guide.title, url },
    ]),
  ];
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { FaqSection, JsonLd, ProseBlocks } from "@/components/content/prose";
import { UseTemplateButton } from "@/components/content/use-template-button";
import { PrintButton } from "@/components/list/print-button";
import { PrintFooter } from "@/components/list/print-footer";
import { getGuideByKey, getTemplate, getTemplateByKey, getTemplates } from "@/content";
import { flattenTemplateItems } from "@/content/types";
import { Link } from "@/i18n/navigation";
import { type AppLocale, routing } from "@/i18n/routing";
import { templateJsonLd } from "@/lib/seo/json-ld";
import { contentUrl } from "@/lib/seo/urls";

type Props = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    getTemplates(locale).map((template) => ({ locale, slug: template.slug })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const template = getTemplate(locale, slug);
  if (!template) notFound();

  // El equivalente en el otro idioma tiene otro slug: sin resolverlo por clave,
  // los alternates apuntarían a una URL que no existe.
  const languages: Record<string, string> = {};
  for (const alternate of routing.locales) {
    const twin = getTemplateByKey(alternate, template.key);
    if (twin) {
      languages[alternate === "es" ? "es-ES" : "en-US"] = contentUrl(
        "templates",
        alternate,
        twin.slug,
      );
    }
  }
  const englishTwin = getTemplateByKey("en", template.key);
  if (englishTwin) languages["x-default"] = contentUrl("templates", "en", englishTwin.slug);

  const url = contentUrl("templates", locale, template.slug);

  return {
    title: template.metaTitle,
    description: template.metaDescription,
    alternates: { canonical: url, languages },
    openGraph: {
      type: "article",
      locale: locale === "es" ? "es_ES" : "en_US",
      url,
      title: template.metaTitle,
      description: template.metaDescription,
    },
    // Sin esto heredaría el twitter:card de la landing, y toda plantilla
    // compartiría el mismo título en X.
    twitter: {
      card: "summary_large_image",
      title: template.metaTitle,
      description: template.metaDescription,
    },
  };
}

export default async function TemplatePage({ params }: Props) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const template = getTemplate(locale, slug);
  if (!template) notFound();

  const t = await getTranslations({ locale, namespace: "templatesPage" });
  const tCategories = await getTranslations({ locale, namespace: "categories" });
  const tCrumb = await getTranslations({ locale, namespace: "breadcrumb" });
  const tNav = await getTranslations({ locale, namespace: "nav" });

  const items = flattenTemplateItems(template);
  const jsonLd = templateJsonLd(template, locale as AppLocale, {
    home: tCrumb("home"),
    templates: tNav("templates"),
  });

  const related = template.relatedTemplates
    .map((key) => getTemplateByKey(locale, key))
    .filter((entry) => entry !== undefined);
  const relatedGuides = template.relatedGuides
    .map((key) => getGuideByKey(locale, key))
    .filter((entry) => entry !== undefined);

  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-4 py-12 sm:px-6">
      <JsonLd blocks={jsonLd} />

      <nav aria-label="breadcrumb" className="text-sm text-on-surface-muted print:hidden">
        <Link href="/plantillas" className="underline">
          {tNav("templates")}
        </Link>
      </nav>

      <header className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-on-surface sm:text-4xl">
          {template.title}
        </h1>
        <p className="text-lg text-on-surface-muted">{template.excerpt}</p>
        <dl className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
          <div className="flex gap-2">
            <dt className="text-on-surface-muted">{t("serves")}</dt>
            <dd className="font-medium text-on-surface">{template.serves}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-on-surface-muted">{t("budget")}</dt>
            <dd className="font-medium text-on-surface">{template.budget}</dd>
          </div>
        </dl>
        {/* «Lista de la compra para imprimir» es una búsqueda enorme: quien
            llega aquí a veces no quiere una app, quiere un papel. */}
        <div className="flex flex-wrap items-center gap-3 print:hidden">
          <UseTemplateButton title={template.title} items={items} />
          <PrintButton className="h-tap rounded-full border border-border px-5 font-medium text-on-surface" />
        </div>
      </header>

      <section className="flex flex-col gap-5">
        <h2 className="text-2xl font-bold tracking-tight text-on-surface">{t("listTitle")}</h2>
        {template.sections.map((section) => (
          <div key={section.categoryId} className="flex flex-col gap-2">
            <h3 className="font-semibold text-brand">{tCategories(section.categoryId)}</h3>
            <ul className="flex flex-col gap-1">
              {section.items.map((item) => (
                <li
                  key={item.name}
                  className="flex flex-wrap items-baseline gap-x-2 border-border border-b py-1.5"
                >
                  {/* Sólo en papel: en pantalla la casilla no hace nada, y una
                      casilla que no se puede marcar es peor que ninguna. */}
                  <span
                    aria-hidden
                    className="hidden size-3.5 shrink-0 self-center border border-on-surface print:inline-block"
                  />
                  <span className="text-on-surface">{item.name}</span>
                  {item.qty && (
                    <span className="text-on-surface-muted text-sm">
                      {item.qty}
                      {item.unit ? ` ${item.unit}` : ""}
                    </span>
                  )}
                  {item.note && (
                    <span className="w-full text-on-surface-muted text-sm italic">{item.note}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <div className="flex flex-col gap-10 print:hidden">
        <ProseBlocks blocks={template.body} />

        <FaqSection title={t("faqTitle")} faq={template.faq} />

        <UseTemplateButton title={template.title} items={items} />
      </div>

      {related.length > 0 && (
        <section className="flex flex-col gap-3 print:hidden">
          <h2 className="text-xl font-bold text-on-surface">{t("related")}</h2>
          <ul className="flex flex-col gap-2">
            {related.map((entry) => (
              <li key={entry.slug}>
                <Link
                  href={{ pathname: "/plantillas/[slug]", params: { slug: entry.slug } }}
                  className="text-brand underline"
                >
                  {entry.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {relatedGuides.length > 0 && (
        <section className="flex flex-col gap-3 print:hidden">
          <h2 className="text-xl font-bold text-on-surface">{t("relatedGuides")}</h2>
          <ul className="flex flex-col gap-2">
            {relatedGuides.map((entry) => (
              <li key={entry.slug}>
                <Link
                  href={{ pathname: "/guias/[slug]", params: { slug: entry.slug } }}
                  className="text-brand underline"
                >
                  {entry.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-sm text-on-surface-muted print:hidden">
        {t("updated", { date: template.updatedAt })}
      </p>

      <PrintFooter />
    </article>
  );
}

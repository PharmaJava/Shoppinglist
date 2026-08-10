import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { FaqSection, JsonLd, ProseBlocks } from "@/components/content/prose";
import { getGuide, getGuideByKey, getGuides, getTemplateByKey } from "@/content";
import { Link } from "@/i18n/navigation";
import { type AppLocale, routing } from "@/i18n/routing";
import { guideJsonLd } from "@/lib/seo/json-ld";
import { contentUrl } from "@/lib/seo/urls";

type Props = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    getGuides(locale).map((guide) => ({ locale, slug: guide.slug })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const guide = getGuide(locale, slug);
  if (!guide) notFound();

  const languages: Record<string, string> = {};
  for (const alternate of routing.locales) {
    const twin = getGuideByKey(alternate, guide.key);
    if (twin) {
      languages[alternate === "es" ? "es-ES" : "en-US"] = contentUrl(
        "guides",
        alternate,
        twin.slug,
      );
    }
  }
  const englishTwin = getGuideByKey("en", guide.key);
  if (englishTwin) languages["x-default"] = contentUrl("guides", "en", englishTwin.slug);

  const url = contentUrl("guides", locale, guide.slug);

  return {
    title: guide.metaTitle,
    description: guide.metaDescription,
    alternates: { canonical: url, languages },
    openGraph: {
      type: "article",
      locale: locale === "es" ? "es_ES" : "en_US",
      url,
      title: guide.metaTitle,
      description: guide.metaDescription,
      publishedTime: guide.publishedAt,
      modifiedTime: guide.updatedAt,
    },
    twitter: {
      card: "summary_large_image",
      title: guide.metaTitle,
      description: guide.metaDescription,
    },
  };
}

export default async function GuidePage({ params }: Props) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const guide = getGuide(locale, slug);
  if (!guide) notFound();

  const t = await getTranslations({ locale, namespace: "guidesPage" });
  const tCrumb = await getTranslations({ locale, namespace: "breadcrumb" });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const tMeta = await getTranslations({ locale, namespace: "metadata" });

  const jsonLd = guideJsonLd(guide, locale as AppLocale, {
    home: tCrumb("home"),
    guides: tNav("guides"),
    siteName: tMeta("siteName"),
  });

  const relatedTemplates = guide.relatedTemplates
    .map((key) => getTemplateByKey(locale, key))
    .filter((entry) => entry !== undefined);
  const relatedGuides = guide.relatedGuides
    .map((key) => getGuideByKey(locale, key))
    .filter((entry) => entry !== undefined);

  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-4 py-12 sm:px-6">
      <JsonLd blocks={jsonLd} />

      <nav aria-label="breadcrumb" className="text-sm text-on-surface-muted">
        <Link href="/guias" className="underline">
          {tNav("guides")}
        </Link>
      </nav>

      <header className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-on-surface sm:text-4xl">
          {guide.title}
        </h1>
        <p className="text-lg text-on-surface-muted">{guide.excerpt}</p>
      </header>

      <ProseBlocks blocks={guide.body} />

      <FaqSection title={t("faqTitle")} faq={guide.faq} />

      {relatedTemplates.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-bold text-on-surface">{t("relatedTemplates")}</h2>
          <ul className="flex flex-col gap-2">
            {relatedTemplates.map((entry) => (
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
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-bold text-on-surface">{t("related")}</h2>
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

      <p className="text-sm text-on-surface-muted">{t("updated", { date: guide.updatedAt })}</p>
    </article>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { getGuides } from "@/content";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { sectionUrl } from "@/lib/seo/urls";

type Props = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const t = await getTranslations({ locale, namespace: "guidesPage" });

  return {
    title: t("hubMetaTitle"),
    description: t("hubMetaDescription"),
    alternates: {
      canonical: sectionUrl("guides", locale),
      languages: {
        "es-ES": sectionUrl("guides", "es"),
        "en-US": sectionUrl("guides", "en"),
        "x-default": sectionUrl("guides", "en"),
      },
    },
    openGraph: {
      type: "website",
      locale: locale === "es" ? "es_ES" : "en_US",
      url: sectionUrl("guides", locale),
      title: t("hubMetaTitle"),
      description: t("hubMetaDescription"),
    },
    twitter: {
      card: "summary_large_image",
      title: t("hubMetaTitle"),
      description: t("hubMetaDescription"),
    },
  };
}

export default async function GuidesHubPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const t = await getTranslations({ locale, namespace: "guidesPage" });
  const guides = getGuides(locale);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-4 py-12 sm:px-6">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold tracking-tight text-on-surface sm:text-4xl">
          {t("hubTitle")}
        </h1>
        <p className="text-lg text-on-surface-muted">{t("hubSubtitle")}</p>
      </header>

      <ul className="flex flex-col gap-4">
        {guides.map((guide) => (
          <li key={guide.slug}>
            <Link
              href={{ pathname: "/guias/[slug]", params: { slug: guide.slug } }}
              className="flex flex-col gap-2 rounded-card bg-surface-muted p-5 transition-colors hover:bg-surface-raised"
            >
              <h2 className="text-xl font-semibold text-on-surface">{guide.title}</h2>
              <p className="text-on-surface-muted">{guide.excerpt}</p>
              <span className="text-sm font-medium text-brand">{t("readMore")}</span>
            </Link>
          </li>
        ))}
      </ul>

      <p className="text-sm text-on-surface-muted">
        <Link href="/plantillas" className="font-medium text-brand underline">
          {t("relatedTemplates")}
        </Link>
      </p>
    </div>
  );
}

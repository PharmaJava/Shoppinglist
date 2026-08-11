import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { ProseBlocks } from "@/components/content/prose";
import { getTerms } from "@/content";
import { routing } from "@/i18n/routing";
import { sectionUrl } from "@/lib/seo/urls";

type Props = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const doc = getTerms(locale);

  return {
    title: doc.metaTitle,
    description: doc.metaDescription,
    alternates: {
      canonical: sectionUrl("terms", locale),
      languages: {
        "es-ES": sectionUrl("terms", "es"),
        "en-US": sectionUrl("terms", "en"),
        "x-default": sectionUrl("terms", "en"),
      },
    },
  };
}

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const doc = getTerms(locale);
  const t = await getTranslations({ locale, namespace: "legal" });

  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-12 sm:px-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-on-surface sm:text-4xl">
          {doc.title}
        </h1>
        <p className="text-sm text-on-surface-muted">{t("updated", { date: doc.updatedAt })}</p>
      </header>

      <ProseBlocks blocks={doc.blocks} />
    </article>
  );
}

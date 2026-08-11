import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { JsonLd } from "@/components/content/prose";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { AUTHOR_LINKEDIN, AUTHOR_NAME, SITE_URL } from "@/lib/seo/site";
import { sectionUrl } from "@/lib/seo/urls";

type Props = { params: Promise<{ locale: string }> };

const BLOCKS = ["why", "how", "who", "money"] as const;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const t = await getTranslations({ locale, namespace: "about" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: sectionUrl("about", locale),
      languages: {
        "es-ES": sectionUrl("about", "es"),
        "en-US": sectionUrl("about", "en"),
        "x-default": sectionUrl("about", "en"),
      },
    },
    openGraph: {
      type: "profile",
      locale: locale === "es" ? "es_ES" : "en_US",
      url: sectionUrl("about", locale),
      title: t("metaTitle"),
      description: t("metaDescription"),
    },
    twitter: {
      card: "summary_large_image",
      title: t("metaTitle"),
      description: t("metaDescription"),
    },
  };
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const t = await getTranslations({ locale, namespace: "about" });
  const tMeta = await getTranslations({ locale, namespace: "metadata" });

  // Una `Person` con nombre y `sameAs` es lo que permite a Google unir este
  // sitio con alguien real y no con un dominio anónimo: es la señal de autoría
  // que pide E-E-A-T, y media razón por la que esta página existe.
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      url: sectionUrl("about", locale),
      name: t("metaTitle"),
      mainEntity: {
        "@type": "Person",
        name: AUTHOR_NAME,
        url: AUTHOR_LINKEDIN,
        sameAs: [AUTHOR_LINKEDIN],
        worksFor: { "@type": "Organization", name: tMeta("siteName"), url: SITE_URL },
      },
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-10 px-4 py-12 sm:px-6">
      <JsonLd blocks={jsonLd} />

      <header className="flex flex-col gap-3">
        <h1 className="font-bold text-3xl text-on-surface tracking-tight sm:text-4xl">
          {t("title")}
        </h1>
        <p className="text-lg text-on-surface-muted">{t("subtitle")}</p>
      </header>

      {BLOCKS.map((key) => (
        <section key={key} className="flex flex-col gap-3">
          <h2 className="font-bold text-on-surface text-xl">{t(`${key}Title`)}</h2>
          <p className="text-on-surface-muted leading-relaxed">{t(`${key}Body`)}</p>
        </section>
      ))}

      <section className="flex flex-col gap-3 rounded-card bg-surface-muted p-6">
        <h2 className="font-bold text-on-surface text-xl">{t("contactTitle")}</h2>
        <p className="text-on-surface-muted leading-relaxed">{t("contactBody")}</p>
        <a
          href={AUTHOR_LINKEDIN}
          target="_blank"
          rel="noopener noreferrer me"
          className="h-tap flex w-full items-center justify-center rounded-full bg-brand px-6 font-semibold text-brand-contrast sm:w-auto sm:self-start"
        >
          {t("linkedin", { name: AUTHOR_NAME })}
        </a>
      </section>

      <Link href="/" className="font-semibold text-brand underline">
        {t("cta")}
      </Link>
    </div>
  );
}

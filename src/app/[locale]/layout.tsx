import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { LanguageSwitcher } from "@/components/marketing/language-switcher";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/seo/site";

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Omit<Props, "children">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const t = await getTranslations({ locale, namespace: "metadata" });

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: t("landingTitle"), template: `%s | ${t("siteName")}` },
    description: t("landingDescription"),
    alternates: {
      canonical: `/${locale}`,
      languages: {
        "es-ES": "/es",
        "en-US": "/en",
        "x-default": "/en",
      },
    },
    openGraph: {
      type: "website",
      locale,
      siteName: t("siteName"),
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const t = await getTranslations({ locale, namespace: "metadata" });

  return (
    <>
      <header className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6">
        <a href={`/${locale}`} className="text-lg font-bold text-brand">
          {t("siteName")}
        </a>
        <LanguageSwitcher />
      </header>

      <main className="flex flex-1 flex-col">{children}</main>

      <footer className="border-t border-border px-4 py-6 text-center text-sm text-on-surface-muted sm:px-6">
        © {new Date().getFullYear()} {t("siteName")}
      </footer>
    </>
  );
}

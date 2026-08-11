import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { AccountNavLink } from "@/components/auth/account-nav-link";
import { Logo } from "@/components/brand/logo";
import { LanguageSwitcher } from "@/components/marketing/language-switcher";
import { Link } from "@/i18n/navigation";
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
      // Open Graph espera el formato `idioma_PAÍS`, no el código corto.
      locale: locale === "es" ? "es_ES" : "en_US",
      siteName: t("siteName"),
      url: `/${locale}`,
      // Explícitos a propósito: `title`/`description` de arriba no se copian
      // solas a Open Graph, y sin ellas WhatsApp no muestra previsualización.
      title: t("ogTitle"),
      description: t("ogDescription"),
    },
    twitter: {
      card: "summary_large_image",
      title: t("ogTitle"),
      description: t("ogDescription"),
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const t = await getTranslations({ locale, namespace: "metadata" });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const tFooter = await getTranslations({ locale, namespace: "footer" });

  return (
    <>
      <header className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6">
        <a
          href={`/${locale}`}
          className="flex min-w-0 items-center gap-2 text-lg font-bold text-brand"
        >
          <Logo size={28} />
          {/* En pantallas muy estrechas el nombre cede el sitio al CTA de login. */}
          <span className="hidden min-[420px]:inline">{t("siteName")}</span>
        </a>
        <div className="flex items-center gap-3 sm:gap-5">
          {/* En móvil el espacio es para el CTA de login; las secciones de
              contenido siguen accesibles desde la landing y el footer. */}
          <nav className="hidden items-center gap-4 text-sm sm:flex">
            <Link href="/plantillas" className="text-on-surface-muted hover:text-on-surface">
              {tNav("templates")}
            </Link>
            <Link href="/guias" className="text-on-surface-muted hover:text-on-surface">
              {tNav("guides")}
            </Link>
            <Link href="/blog" className="text-on-surface-muted hover:text-on-surface">
              {tNav("blog")}
            </Link>
          </nav>
          <LanguageSwitcher />
          <AccountNavLink />
        </div>
      </header>

      <main className="flex flex-1 flex-col">{children}</main>

      <footer className="border-t border-border px-4 py-10 text-sm sm:px-6">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
          <div className="flex flex-col justify-between gap-8 sm:flex-row">
            <div className="flex max-w-xs flex-col gap-2">
              <span className="flex items-center gap-2 font-bold text-brand">
                <Logo size={22} />
                {t("siteName")}
              </span>
              <p className="text-on-surface-muted">{tFooter("tagline")}</p>
            </div>

            <div className="flex flex-wrap gap-10 sm:gap-16">
              <nav className="flex flex-col gap-2" aria-label={tFooter("product")}>
                <span className="font-semibold text-on-surface">{tFooter("product")}</span>
                <Link href="/" className="text-on-surface-muted hover:text-on-surface">
                  {tFooter("createList")}
                </Link>
                <Link href="/mis-listas" className="text-on-surface-muted hover:text-on-surface">
                  {tFooter("myLists")}
                </Link>
                <Link href="/cuenta" className="text-on-surface-muted hover:text-on-surface">
                  {tNav("login")}
                </Link>
              </nav>
              <nav className="flex flex-col gap-2" aria-label={tFooter("content")}>
                <span className="font-semibold text-on-surface">{tFooter("content")}</span>
                <Link href="/plantillas" className="text-on-surface-muted hover:text-on-surface">
                  {tFooter("templates")}
                </Link>
                <Link href="/guias" className="text-on-surface-muted hover:text-on-surface">
                  {tFooter("guides")}
                </Link>
                <Link href="/blog" className="text-on-surface-muted hover:text-on-surface">
                  {tFooter("blog")}
                </Link>
                <Link href="/precios" className="text-on-surface-muted hover:text-on-surface">
                  {tFooter("pricing")}
                </Link>
              </nav>
              <nav className="flex flex-col gap-2" aria-label={tFooter("legal")}>
                <span className="font-semibold text-on-surface">{tFooter("legal")}</span>
                <Link href="/privacidad" className="text-on-surface-muted hover:text-on-surface">
                  {tFooter("privacy")}
                </Link>
                <Link href="/terminos" className="text-on-surface-muted hover:text-on-surface">
                  {tFooter("terms")}
                </Link>
              </nav>
            </div>
          </div>

          <p className="text-on-surface-muted">
            © {new Date().getFullYear()} {t("siteName")}
          </p>
        </div>
      </footer>
    </>
  );
}

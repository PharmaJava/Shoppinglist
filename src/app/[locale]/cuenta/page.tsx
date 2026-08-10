import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/logo";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/**
 * Destino del botón «Iniciar sesión» mientras no existe el registro (Fase 2,
 * Supabase Auth). Página honesta de «próximamente», noindex: no aporta nada a
 * la búsqueda y no debe posicionar por «iniciar sesión».
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const t = await getTranslations({ locale, namespace: "account" });

  return {
    title: t("metaTitle"),
    robots: { index: false, follow: false },
  };
}

export default async function AccountPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const t = await getTranslations({ locale, namespace: "account" });

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 px-4 py-20 text-center sm:px-6">
      <Logo size={56} />
      <h1 className="text-3xl font-bold tracking-tight text-on-surface">{t("title")}</h1>
      <p className="text-lg text-on-surface-muted">{t("body")}</p>
      <p className="rounded-card bg-brand/10 p-4 text-sm text-on-surface">{t("guestNote")}</p>
      <Link
        href="/"
        className="h-tap flex items-center rounded-full bg-brand px-6 font-semibold text-brand-contrast"
      >
        {t("cta")}
      </Link>
    </div>
  );
}

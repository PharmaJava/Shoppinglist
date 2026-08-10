import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { AccountClient } from "@/components/auth/account-client";
import { Logo } from "@/components/brand/logo";
import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/** `noindex`: no aporta nada a la búsqueda y no debe posicionar por «iniciar
 *  sesión», que además atrae tráfico de phishing. */
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
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-8 px-4 py-16 sm:px-6">
      <Logo size={56} />
      {/* `useSearchParams` obliga a envolver en Suspense para no volver
          dinámica toda la página. */}
      <Suspense fallback={<p className="text-on-surface-muted">{t("loadingTitle")}</p>}>
        {/* Ruta pública, no la interna: en inglés es /en/account. */}
        <AccountClient callbackNext={getPathname({ locale, href: "/cuenta" })} />
      </Suspense>
    </div>
  );
}

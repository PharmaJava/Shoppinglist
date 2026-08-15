import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { PremiumGate } from "@/components/billing/premium-gate";
import { PantryClient } from "@/components/pantry/pantry-client";
import { routing } from "@/i18n/routing";
import { PREMIUM_VISIBLE } from "@/lib/flags";

type Props = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const t = await getTranslations({ locale, namespace: "pantry" });

  return {
    title: t("metaTitle"),
    robots: { index: false, follow: false },
  };
}

export default async function PantryPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  /**
   * Con el interruptor apagado la ruta **no existe**: 404, no una página
   * vacía. Una página que carga y no enseña nada invita a preguntar qué pasa;
   * un 404 dice que ahí no hay nada, que es la verdad mientras la Fase 3 no
   * esté terminada.
   */
  if (!PREMIUM_VISIBLE) notFound();

  const t = await getTranslations({ locale, namespace: "pantry" });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-12 sm:px-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-on-surface">{t("title")}</h1>
        <p className="text-on-surface-muted">{t("intro")}</p>
      </div>

      <PremiumGate titulo={t("gateTitle")} descripcion={t("gateBody")} cta={t("gateCta")}>
        <PantryClient />
      </PremiumGate>
    </div>
  );
}

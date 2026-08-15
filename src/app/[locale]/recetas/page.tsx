import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { PremiumGate } from "@/components/billing/premium-gate";
import { RecipeClient } from "@/components/recipes/recipe-client";
import { routing } from "@/i18n/routing";
import { PREMIUM_VISIBLE } from "@/lib/flags";

type Props = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const t = await getTranslations({ locale, namespace: "recipes" });

  return {
    title: t("metaTitle"),
    robots: { index: false, follow: false },
  };
}

export default async function RecipesPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  // Con el interruptor apagado la ruta no existe, igual que la despensa y las
  // listas automáticas. Ver docs/11-FASE3.md.
  if (!PREMIUM_VISIBLE) notFound();

  const t = await getTranslations({ locale, namespace: "recipes" });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-12 sm:px-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-on-surface">{t("title")}</h1>
        <p className="text-on-surface-muted">{t("intro")}</p>
      </div>

      <PremiumGate titulo={t("gateTitle")} descripcion={t("gateBody")} cta={t("gateCta")}>
        <RecipeClient />
      </PremiumGate>
    </div>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { MyTemplatesClient } from "@/components/templates/my-templates-client";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/**
 * `noindex`: son las plantillas de una persona, no el catálogo público. Las
 * que sí posicionan son las de `/plantillas`, que vienen de `src/content`.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const t = await getTranslations({ locale, namespace: "templatesMine" });

  return {
    title: t("metaTitle"),
    robots: { index: false, follow: false },
  };
}

export default async function MyTemplatesPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const t = await getTranslations({ locale, namespace: "templatesMine" });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-12 sm:px-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-on-surface">{t("title")}</h1>
        <p className="text-on-surface-muted">{t("intro")}</p>
      </div>

      <MyTemplatesClient />

      <p className="text-sm text-on-surface-muted">
        {t("publicHint")}{" "}
        <Link href="/plantillas" className="font-medium text-brand underline">
          {t("publicLink")}
        </Link>
      </p>
    </div>
  );
}

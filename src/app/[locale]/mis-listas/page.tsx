import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { MyListsClient } from "@/components/list/my-lists-client";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/** `noindex`: contenido personal, y nada que un buscador pueda ver ni indexar. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const t = await getTranslations({ locale, namespace: "myLists" });

  return {
    title: t("metaTitle"),
    robots: { index: false, follow: false },
  };
}

export default async function MyListsPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col px-4 py-12 sm:px-6">
      <MyListsClient />
    </div>
  );
}

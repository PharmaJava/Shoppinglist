import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ListView } from "@/components/list/list-view";
import { PrintFooter } from "@/components/list/print-footer";

/**
 * La previsualización es deliberadamente genérica: quien la genera es el
 * rastreador de WhatsApp o Facebook, sin sesión, así que RLS le impide leer
 * la lista — y aunque pudiera, el título de una lista privada no debe
 * acabar en el historial de un chat ajeno.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");

  return {
    title: t("sharedListTitle"),
    description: t("sharedListDescription"),
    robots: { index: false, follow: false },
    openGraph: {
      type: "website",
      siteName: t("siteName"),
      title: t("sharedListTitle"),
      description: t("sharedListDescription"),
    },
    twitter: {
      card: "summary_large_image",
      title: t("sharedListTitle"),
      description: t("sharedListDescription"),
    },
  };
}

export default async function ListPage({ params }: { params: Promise<{ listId: string }> }) {
  const { listId } = await params;
  return (
    <>
      <ListView listId={listId} />
      <PrintFooter />
    </>
  );
}

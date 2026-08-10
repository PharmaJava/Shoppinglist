import { getTranslations } from "next-intl/server";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/seo/og-image";

export const alt = "ListaSupermercado";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  const t = await getTranslations("metadata");

  return renderOgImage({
    title: t("sharedListTitle"),
    description: t("sharedListDescription"),
  });
}

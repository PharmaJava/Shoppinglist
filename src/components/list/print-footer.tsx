import { getTranslations } from "next-intl/server";

/**
 * Pie que sólo existe en papel.
 *
 * Una lista impresa acaba en la puerta de la nevera o en el bolsillo de quien
 * hace la compra, y la ve más gente que la pantalla donde se escribió. Que
 * lleve de dónde salió cuesta una línea.
 */
export async function PrintFooter() {
  const t = await getTranslations("list");

  return (
    <p className="mt-6 hidden border-border border-t pt-3 text-on-surface-muted text-xs print:block">
      {t("printFootnote")}
    </p>
  );
}

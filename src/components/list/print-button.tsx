"use client";

import { useTranslations } from "next-intl";

/**
 * Manda la página a imprimir. No genera un PDF propio: el diálogo del sistema
 * ya ofrece «Guardar como PDF» en todos lados, y el navegador imprime mejor
 * que cualquier maquetación que hiciéramos por nuestra cuenta —lo único que
 * hace falta es que la hoja esté limpia, y de eso se encarga `@media print`.
 */
export function PrintButton({ className }: { className?: string }) {
  const t = useTranslations("list");

  return (
    <button type="button" onClick={() => window.print()} className={className}>
      {t("print")}
    </button>
  );
}

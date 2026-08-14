"use client";

import { useTranslations } from "next-intl";
import type { WakeLockState } from "@/features/list/use-wake-lock";

/**
 * La barra de la compra, encima de la de añadir productos.
 *
 * Antes el modo compra se activaba con un 🛒 suelto en la cabecera y se salía
 * con una ✕. Nadie lo encontraba, y quien lo encontraba no sabía cómo
 * terminar: la pantalla se quedaba encendida hasta cerrar la pestaña. Ahora
 * hay un sitio donde empieza y un botón que dice «Finalizar».
 */
export function ShoppingBar({
  activa,
  pendientes,
  marcados,
  pantalla,
  onEmpezar,
  onFinalizar,
}: {
  activa: boolean;
  pendientes: number;
  marcados: number;
  pantalla: WakeLockState;
  onEmpezar: () => void;
  onFinalizar: () => void;
}) {
  const t = useTranslations("shopping");
  const total = pendientes + marcados;

  // Sin productos no hay compra que empezar; sí la hay si ya está en marcha
  // (alguien puede haber vaciado la lista desde otro móvil).
  if (total === 0 && !activa) return null;

  if (!activa) {
    return (
      <div className="border-t border-border bg-surface px-4 py-2 print:hidden">
        <button
          type="button"
          onClick={onEmpezar}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-brand font-semibold text-brand"
        >
          <span aria-hidden>🛒</span>
          {t("start")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 border-t border-border bg-brand/10 px-4 py-2 print:hidden">
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-semibold text-on-surface">
          {t("progress", { checked: marcados, total })}
        </span>
        {/* Se dice si la pantalla se queda encendida o no. Prometerlo y que se
            apague es peor que no prometer nada. */}
        <span className="truncate text-xs text-on-surface-muted">
          {pantalla === "encendida"
            ? t("screenOn")
            : pantalla === "no-soportado"
              ? t("screenUnsupported")
              : t("screenOff")}
        </span>
      </div>

      <button
        type="button"
        onClick={onFinalizar}
        className="h-11 shrink-0 rounded-full bg-brand px-5 font-semibold text-brand-contrast"
      >
        {t("finish")}
      </button>
    </div>
  );
}

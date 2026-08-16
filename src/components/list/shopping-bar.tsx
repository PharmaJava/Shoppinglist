"use client";

import { useTranslations } from "next-intl";
import type { WakeLockState } from "@/features/list/use-wake-lock";

/**
 * La barra de la compra, encima de la de añadir productos.
 *
 * Ya no hay que empezar nada: **abrir la lista es estar comprando**. Antes
 * había un botón de empezar, y era un paso de más para decir algo que la
 * situación ya decía —quien abre la lista de la compra está comprando, no
 * organizando—, con la trampa de que quien no lo pulsaba se quedaba sin lo
 * único que ese modo daba: la pantalla encendida.
 *
 * Queda un botón, el de terminar, que es el que sí decide algo: qué hacer con
 * la lista cuando se acaba (ver `FinishSheet`).
 */
export function ShoppingBar({
  pendientes,
  marcados,
  pantalla,
  onFinalizar,
}: {
  pendientes: number;
  marcados: number;
  pantalla: WakeLockState;
  onFinalizar: () => void;
}) {
  const t = useTranslations("shopping");
  const total = pendientes + marcados;

  // Una lista vacía no es una compra: no hay nada que terminar todavía.
  if (total === 0) return null;

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

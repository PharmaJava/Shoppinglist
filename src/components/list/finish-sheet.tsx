"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { PremiumGate } from "@/components/billing/premium-gate";
import type { List, ListItem } from "@/features/list/types";

export type AccionFinal = "nada" | "vaciar" | "borrar" | "archivar" | "despensa";

/**
 * Qué hacer con la lista al terminar la compra.
 *
 * Se pregunta en vez de decidir: hay quien repite la misma lista cada semana
 * y quiere lo comprado ahí para desmarcarlo, y hay quien la da por cerrada.
 * Elegir por ellos significa equivocarse con la mitad.
 *
 * `puedeBorrar` es «esta lista es mía»: al dueño se le ofrece borrarla del
 * todo —la compra se acabó, a por la siguiente—, y a quien sólo es miembro,
 * archivarla, que es lo único que RLS le deja hacer (migración 0001).
 */
export function FinishSheet({
  list,
  pendientes,
  marcados,
  puedeBorrar,
  onCerrar,
  onConfirmar,
}: {
  list: List;
  pendientes: ListItem[];
  marcados: ListItem[];
  puedeBorrar: boolean;
  onCerrar: () => void;
  onConfirmar: (accion: AccionFinal) => Promise<void> | void;
}) {
  const t = useTranslations("shopping");
  const tDespensa = useTranslations("pantry");
  const [ocupado, setOcupado] = useState<AccionFinal | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function elegir(accion: AccionFinal) {
    if (ocupado) return;
    setOcupado(accion);
    setError(null);
    try {
      await onConfirmar(accion);
    } catch (err) {
      // Borrar puede fallar de verdad —sin red, o si la lista no es tuya—, y
      // callarlo dejaría la hoja congelada como si nada hubiera pasado.
      setError(err instanceof Error ? err.message : String(err));
      setOcupado(null);
    }
  }

  const total = pendientes.length + marcados.length;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center print:hidden sm:items-center">
      <button
        type="button"
        aria-label={t("close")}
        onClick={onCerrar}
        className="absolute inset-0 bg-black/50"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("finishTitle")}
        className="relative z-10 flex w-full max-w-md flex-col gap-4 rounded-t-2xl bg-surface-raised p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-xl sm:rounded-2xl"
      >
        <div>
          <h2 className="text-lg font-semibold text-on-surface">{t("finishTitle")}</h2>
          <p className="text-sm text-on-surface-muted">
            {t("progress", { checked: marcados.length, total })}
          </p>
        </div>

        {/* Lo que queda sin marcar, dicho antes de cerrar: dentro del súper es
            la última oportunidad de darse cuenta de que falta el pan. */}
        {pendientes.length > 0 && (
          <div className="rounded-card bg-surface-muted p-3">
            <p className="text-sm font-medium text-on-surface">
              {t("stillPending", { count: pendientes.length })}
            </p>
            <p className="truncate text-xs text-on-surface-muted">
              {pendientes
                .slice(0, 5)
                .map((item) => item.name)
                .join(", ")}
              {pendientes.length > 5 && "…"}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => elegir("nada")}
            disabled={ocupado !== null}
            className="h-tap rounded-full bg-brand font-semibold text-brand-contrast disabled:opacity-50"
          >
            {t("keepAsIs")}
          </button>

          {marcados.length > 0 && (
            <button
              type="button"
              onClick={() => elegir("vaciar")}
              disabled={ocupado !== null}
              className="h-tap rounded-full border border-border font-medium text-on-surface disabled:opacity-50"
            >
              {t("clearChecked", { count: marcados.length })}
            </button>
          )}

          {/* La compra se acabó y la lista con ella: borrarla es lo que deja
              el terreno libre para hacerse otra, en vez de acumular listas
              viejas que ya no sirven. Sin confirmación aparte —el aviso va
              debajo— porque esto ya es la segunda pantalla de una decisión. */}
          {puedeBorrar ? (
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => elegir("borrar")}
                disabled={ocupado !== null}
                className="h-tap w-full rounded-full border border-red-600 font-medium text-red-600 disabled:opacity-50"
              >
                {ocupado === "borrar" ? t("deletingList") : t("deleteList")}
              </button>
              <p className="px-2 text-center text-on-surface-muted text-xs">
                {t("deleteListHint")}
              </p>
            </div>
          ) : (
            !list.archived_at && (
              <button
                type="button"
                onClick={() => elegir("archivar")}
                disabled={ocupado !== null}
                className="h-tap rounded-full border border-border font-medium text-on-surface disabled:opacity-50"
              >
                {t("archive")}
              </button>
            )
          )}

          {/* Acabar la compra es el único momento en que se sabe **exactamente**
              qué ha entrado en casa. Pedirlo luego a mano en otra pantalla es
              pedir que nadie lo use. Con el interruptor apagado esto no se
              pinta: `PremiumGate` no devuelve nada. */}
          {marcados.length > 0 && (
            <PremiumGate
              titulo={tDespensa("gateTitle")}
              descripcion={tDespensa("gateBody")}
              cta={tDespensa("gateCta")}
            >
              <button
                type="button"
                onClick={() => elegir("despensa")}
                disabled={ocupado !== null}
                className="h-tap w-full rounded-full border border-brand font-semibold text-brand disabled:opacity-50"
              >
                {tDespensa("stockUp")}
              </button>
            </PremiumGate>
          )}
        </div>

        {error && (
          <p role="alert" className="text-red-600 text-sm">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={onCerrar}
          disabled={ocupado !== null}
          className="text-sm text-on-surface-muted underline disabled:opacity-50"
        >
          {t("keepShopping")}
        </button>
      </div>
    </div>
  );
}

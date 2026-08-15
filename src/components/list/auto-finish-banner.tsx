"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { reopenList, setListArchived } from "@/features/list/api";
import { estadoFinal, hayQueDarlaPorTerminada, horasRestantes } from "@/features/list/auto-finish";
import type { List, ListWithItems } from "@/features/list/types";
import { Link } from "@/i18n/navigation";

/**
 * El aviso de que esta lista se dará por terminada.
 *
 * Sin esto, la regla sería una pérdida por sorpresa: entras al día siguiente y
 * tu lista está archivada sin que nadie te avisara. Con esto es una cuenta
 * atrás visible y una invitación a crear la cuenta, que es justo lo que
 * quita la caducidad.
 *
 * Y cuando la hora ya ha pasado, **la archiva aquí mismo**: quien está
 * mirando la lista tiene que ver la verdad, no una lista que dice estar
 * abierta y que el servidor cerrará esta madrugada.
 */
export function AutoFinishBanner({ listId, list }: { listId: string; list: List }) {
  const t = useTranslations("autoFinish");
  const queryClient = useQueryClient();
  const [ocupado, setOcupado] = useState(false);

  // Una sola vez por render: si cada cálculo llamara a `new Date()`, el
  // estado y las horas que se enseñan podrían no cuadrar entre sí.
  const ahora = new Date();
  const estado = estadoFinal(list, ahora);

  useEffect(() => {
    if (!hayQueDarlaPorTerminada(list, new Date())) return;

    // Se archiva sin preguntar y se dice, que es lo que significa «darla por
    // terminada». Deshacerlo es un toque: el botón de abajo.
    void setListArchived(list, true).then(() => {
      queryClient.setQueryData<ListWithItems>(["list", listId], (actual) =>
        actual
          ? { ...actual, list: { ...actual.list, archived_at: new Date().toISOString() } }
          : actual,
      );
    });
  }, [list, listId, queryClient]);

  if (estado === "sin-caducidad" || estado === "lejos") return null;

  async function reabrir() {
    if (ocupado) return;
    setOcupado(true);
    try {
      await reopenList(listId);
      await queryClient.invalidateQueries({ queryKey: ["list", listId] });
    } finally {
      setOcupado(false);
    }
  }

  const terminada = estado === "vencida";

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-border border-b bg-surface-muted px-4 py-2 text-sm print:hidden">
      <p className="flex-1 text-on-surface">
        {terminada ? t("finished") : t("soon", { hours: horasRestantes(list, ahora) })}
      </p>

      {terminada ? (
        <button
          type="button"
          onClick={reabrir}
          disabled={ocupado}
          className="rounded-full border border-border px-3 py-1 font-medium text-on-surface disabled:opacity-50"
        >
          {ocupado ? t("reopening") : t("reopen")}
        </button>
      ) : (
        <Link href="/cuenta" className="font-medium text-brand underline">
          {t("keepIt")}
        </Link>
      )}
    </div>
  );
}

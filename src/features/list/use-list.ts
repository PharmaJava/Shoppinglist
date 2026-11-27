"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { ListItemRow, ListSectionRow } from "@/lib/supabase/types";
import { fetchListWithItems } from "./api";
import { subscribeToList } from "./realtime";
import type { ListWithItems } from "./types";

/** Aplica una fila que llega por tiempo real: la quita si está borrada, la
 *  pone o la sustituye si no, y deja el conjunto ordenado. Vale para
 *  productos y para secciones. */
export function upsertRow<Row extends { id: string; sort_key: string; deleted_at: string | null }>(
  rows: Row[],
  incoming: Row,
): Row[] {
  const withoutIncoming = rows.filter((row) => row.id !== incoming.id);
  if (incoming.deleted_at) return withoutIncoming;
  return [...withoutIncoming, incoming].sort((a, b) => (a.sort_key < b.sort_key ? -1 : 1));
}

export function useList(listId: string) {
  const queryClient = useQueryClient();
  const queryKey = ["list", listId] as const;

  const query = useQuery({
    queryKey,
    queryFn: () => fetchListWithItems(listId),
    enabled: Boolean(listId),
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: queryKey se deriva de listId; incluir queryClient/queryKey causaría una resuscripción innecesaria en cada render.
  useEffect(() => {
    if (!listId) return;

    // El canal es de la lista y no de este componente: varios sitios pueden
    // mirar la misma lista a la vez —la vista y la hoja de compartir— y
    // supabase-js no admite dos suscripciones al mismo topic (ver ./realtime).
    const unsubscribe = subscribeToList(listId, {
      onItem: (incoming) => {
        queryClient.setQueryData<ListWithItems>(queryKey, (current) =>
          current
            ? { ...current, items: upsertRow<ListItemRow>(current.items, incoming) }
            : current,
        );
      },
      onList: (list) => {
        queryClient.setQueryData<ListWithItems>(queryKey, (current) =>
          current ? { ...current, list } : current,
        );
      },
      onSection: (incoming) => {
        queryClient.setQueryData<ListWithItems>(queryKey, (current) =>
          current
            ? { ...current, sections: upsertRow<ListSectionRow>(current.sections, incoming) }
            : current,
        );
      },
    });

    const resync = () => {
      queryClient.invalidateQueries({ queryKey });
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") resync();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("online", resync);

    return () => {
      unsubscribe();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("online", resync);
    };
  }, [listId]);

  return query;
}

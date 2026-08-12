"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { ListItemRow } from "@/lib/supabase/types";
import { fetchListWithItems } from "./api";
import { subscribeToList } from "./realtime";
import type { ListWithItems } from "./types";

function sortItems(items: ListItemRow[]): ListItemRow[] {
  return [...items].sort((a, b) => (a.sort_key < b.sort_key ? -1 : 1));
}

function upsertItem(items: ListItemRow[], incoming: ListItemRow): ListItemRow[] {
  if (incoming.deleted_at) {
    return items.filter((item) => item.id !== incoming.id);
  }
  const withoutIncoming = items.filter((item) => item.id !== incoming.id);
  return sortItems([...withoutIncoming, incoming]);
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
          current ? { ...current, items: upsertItem(current.items, incoming) } : current,
        );
      },
      onList: (list) => {
        queryClient.setQueryData<ListWithItems>(queryKey, (current) =>
          current ? { ...current, list } : current,
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

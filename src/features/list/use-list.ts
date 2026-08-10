"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ListItemRow, ListRow } from "@/lib/supabase/types";
import { fetchListWithItems } from "./api";
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

    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel(`list:${listId}`)
      .on<ListItemRow>(
        "postgres_changes",
        { event: "*", schema: "public", table: "list_items", filter: `list_id=eq.${listId}` },
        (payload) => {
          const incoming = (payload.new ?? payload.old) as ListItemRow | undefined;
          if (!incoming) return;

          queryClient.setQueryData<ListWithItems>(queryKey, (current) => {
            if (!current) return current;
            return { ...current, items: upsertItem(current.items, incoming) };
          });
        },
      )
      .on<ListRow>(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "lists", filter: `id=eq.${listId}` },
        (payload) => {
          if (!payload.new) return;
          queryClient.setQueryData<ListWithItems>(queryKey, (current) =>
            current ? { ...current, list: payload.new as ListRow } : current,
          );
        },
      )
      .subscribe();

    const resync = () => {
      queryClient.invalidateQueries({ queryKey });
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") resync();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("online", resync);

    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("online", resync);
    };
  }, [listId]);

  return query;
}

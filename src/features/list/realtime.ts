import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ListItemRow, ListRow } from "@/lib/supabase/types";

export interface ListRealtimeHandlers {
  onItem: (item: ListItemRow) => void;
  onList: (list: ListRow) => void;
}

interface Entry {
  channel: RealtimeChannel;
  handlers: Set<ListRealtimeHandlers>;
}

/**
 * Un canal por lista, compartido por todo el que la mire.
 *
 * supabase-js devuelve **el mismo canal** cuando se le pide dos veces el mismo
 * topic, y añadirle un `postgres_changes` después de `subscribe()` lanza
 * excepción:
 *
 *     cannot add `postgres_changes` callbacks for realtime:list:<id>
 *     after `subscribe()`
 *
 * Eso es lo que rompía al abrir la hoja de compartir: la vista de la lista ya
 * tenía su canal suscrito y la hoja, que también lee la lista, intentaba
 * montar el suyo encima. La excepción escapaba del render y se llevaba la
 * página entera por delante.
 *
 * Así que la suscripción deja de ser de cada componente y pasa a ser de la
 * lista: el primero que llega la crea, los demás se enganchan, y se cierra
 * cuando se va el último.
 */
const entries = new Map<string, Entry>();

export function subscribeToList(listId: string, handlers: ListRealtimeHandlers): () => void {
  const entry = entries.get(listId) ?? open(listId);
  entry.handlers.add(handlers);

  return () => {
    entry.handlers.delete(handlers);
    if (entry.handlers.size > 0) return;

    // El último apaga la luz. Sin esto quedaría un websocket abierto por cada
    // lista visitada durante la sesión.
    entries.delete(listId);
    getSupabaseBrowserClient().removeChannel(entry.channel);
  };
}

function open(listId: string): Entry {
  const handlers = new Set<ListRealtimeHandlers>();
  const supabase = getSupabaseBrowserClient();

  const channel = supabase
    .channel(`list:${listId}`)
    .on<ListItemRow>(
      "postgres_changes",
      { event: "*", schema: "public", table: "list_items", filter: `list_id=eq.${listId}` },
      (payload) => {
        const incoming = (payload.new ?? payload.old) as ListItemRow | undefined;
        if (!incoming) return;
        for (const handler of handlers) handler.onItem(incoming);
      },
    )
    .on<ListRow>(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "lists", filter: `id=eq.${listId}` },
      (payload) => {
        if (!payload.new) return;
        for (const handler of handlers) handler.onList(payload.new as ListRow);
      },
    )
    .subscribe();

  const entry: Entry = { channel, handlers };
  entries.set(listId, entry);
  return entry;
}

/** Sólo para los tests: deja el módulo como recién cargado. */
export function resetListSubscriptions(): void {
  entries.clear();
}

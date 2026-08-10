import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  enqueueMutation,
  listPendingMutations,
  markMutationFailed,
  type OutboxTable,
  removeMutation,
} from "./outbox";
import { setPendingCount } from "./pending-store";

let flushing = false;

async function refreshPendingCount(): Promise<void> {
  const pending = await listPendingMutations();
  setPendingCount(pending.length);
}

/**
 * Encola una fila COMPLETA (nunca un parche parcial) para sincronizar.
 * Aplica de inmediato si hay red; si no, queda en IndexedDB hasta que
 * `flushOutbox` la reintente (evento `online` o el temporizador de backoff).
 */
export async function queueRowMutation(table: OutboxTable, row: Record<string, unknown>) {
  await enqueueMutation(table, row);
  await refreshPendingCount();
  void flushOutbox();
}

/**
 * Vacía la cola en orden de creación. Se detiene en el primer fallo para no
 * romper la causalidad (p. ej. no sincronizar un "marcado" antes que la
 * creación del producto al que pertenece).
 */
export async function flushOutbox(): Promise<void> {
  if (flushing) return;
  if (typeof navigator !== "undefined" && !navigator.onLine) return;

  flushing = true;
  try {
    const supabase = getSupabaseBrowserClient();
    const pending = await listPendingMutations();
    const now = Date.now();

    for (const operation of pending) {
      if (operation.nextAttemptAt > now) continue;

      // Las filas se construyen completas y correctamente tipadas en features/list/api.ts;
      // aquí el outbox las trata como datos opacos, de ahí la afirmación de tipo.
      const { error } = await supabase.from(operation.table).upsert(operation.row as never);
      if (error) {
        await markMutationFailed(operation.key, operation.retries + 1);
        break;
      }
      await removeMutation(operation.key);
    }

    await refreshPendingCount();
  } finally {
    flushing = false;
  }
}

let syncLoopStarted = false;

/** Arranca la escucha de reconexión + reintento periódico. Llamar una vez en el cliente. */
export function startSyncLoop(): void {
  if (syncLoopStarted || typeof window === "undefined") return;
  syncLoopStarted = true;

  void refreshPendingCount();
  void flushOutbox();

  window.addEventListener("online", () => void flushOutbox());
  window.setInterval(() => void flushOutbox(), 5000);
}

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  enqueueMutation,
  listPendingMutations,
  markMutationFailed,
  type OutboxTable,
  type QueuedMutation,
  removeMutationIfUnchanged,
} from "./outbox";
import { setPendingCount } from "./pending-store";

let inFlight: Promise<void> | null = null;
let runAgain = false;

/**
 * Un rechazo que no se arregla reintentando: la lista ya no existe (clave
 * ajena), ya no eres miembro (RLS), la fila no cumple una restricción.
 *
 * Quedan fuera los que sí se arreglan solos: sin red (`0`), sesión caducada
 * que el cliente renueva (`401`), tiempo agotado (`408`), demasiadas
 * peticiones (`429`) y cualquier error del servidor (`5xx`).
 */
export function isPermanentRejection(status: number): boolean {
  return status >= 400 && status < 500 && status !== 401 && status !== 408 && status !== 429;
}

/**
 * Lo único de una lista que se guarda desde el navegador. El dueño, la
 * caducidad y la fecha de creación no viajan: la base de datos los ignoraría
 * (migración 0017), y no mandarlos hace que el contrato sea el mismo en los
 * dos lados.
 */
const EDITABLE_LIST_COLUMNS = [
  "title",
  "emoji",
  "currency",
  "budget_cents",
  "archived_at",
  "updated_at",
] as const;

/**
 * Manda una operación al servidor.
 *
 * Las listas van con `update` y no con `upsert`: nunca se crean sin red
 * (`createList` exige conexión), así que lo encolado es siempre un cambio de
 * una lista que ya existe. Y el `upsert` de Postgres pasa también por la
 * política de crear, que exige ser el dueño — quien editaba una lista
 * compartida sin serlo no podía ni renombrarla.
 *
 * Los productos sí van con `upsert`: se crean offline, con su id ya puesto.
 */
async function sendOperation(operation: QueuedMutation) {
  const supabase = getSupabaseBrowserClient();

  // Las filas se construyen completas y correctamente tipadas en features/list/api.ts;
  // aquí el outbox las trata como datos opacos, de ahí las afirmaciones de tipo.
  if (operation.table === "lists") {
    const changes = Object.fromEntries(
      EDITABLE_LIST_COLUMNS.filter((column) => column in operation.row).map((column) => [
        column,
        operation.row[column],
      ]),
    );
    const { error, status } = await supabase
      .from("lists")
      .update(changes as never)
      .eq("id", operation.row.id as string);
    return { error, status };
  }

  const { error, status } = await supabase.from(operation.table).upsert(operation.row as never);
  return { error, status };
}

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
 * Vacía la cola. Devuelve la promesa del envío en curso, así que quien
 * necesite que lo suyo haya llegado puede esperarla.
 *
 * Si se pide mientras ya está enviando, no se ignora: se apunta y se da otra
 * pasada al terminar. Antes se ignoraba, y lo encolado durante un envío
 * esperaba al temporizador — «leche pan tomate» llegaba como «leche», y el
 * resto cinco segundos después.
 */
export function flushOutbox(): Promise<void> {
  if (inFlight) {
    runAgain = true;
    return inFlight;
  }

  inFlight = (async () => {
    try {
      do {
        runAgain = false;
        await flushOnce();
      } while (runAgain);
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

/**
 * Una pasada por la cola, en orden de creación. Se detiene en el primer
 * fallo pasajero para no romper la causalidad (no sincronizar un «marcado»
 * antes que la creación del producto al que pertenece).
 */
async function flushOnce(): Promise<void> {
  if (typeof navigator !== "undefined" && !navigator.onLine) return;

  const pending = await listPendingMutations();
  const now = Date.now();

  for (const operation of pending) {
    if (operation.nextAttemptAt > now) continue;

    const { error, status } = await sendOperation(operation);

    if (error && isPermanentRejection(status)) {
      // Reintentarlo no lo arregla, y dejarlo encendía para siempre el aviso
      // de «cambios pendientes».
      console.warn(`Cambio descartado por el servidor (${operation.key}):`, error);
      await removeMutationIfUnchanged(operation.key, operation.stamp);
      continue;
    }

    if (error) {
      await markMutationFailed(operation.key, operation.retries + 1, operation.stamp);
      break;
    }

    await removeMutationIfUnchanged(operation.key, operation.stamp);
  }

  await refreshPendingCount();
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

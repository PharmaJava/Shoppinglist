import { OPERATIONS_STORE, openOutboxDb } from "./db";

export type OutboxTable = "lists" | "list_items";

export interface QueuedMutation {
  /** `${table}:${row.id}` — misma clave compacta escrituras repetidas sobre la misma fila. */
  key: string;
  table: OutboxTable;
  /** Fila completa (no un parche): garantiza que un upsert nunca viole columnas NOT NULL. */
  row: Record<string, unknown>;
  createdAt: number;
  retries: number;
  nextAttemptAt: number;
  /** Distinto en cada encolado. Al confirmar o fallar un envío se compara con
   *  el guardado: si no coincide, mientras tanto se encoló una versión más
   *  nueva de la fila, y esa no se puede borrar ni penalizar. */
  stamp?: string;
}

export function operationKey(table: OutboxTable, rowId: string): string {
  return `${table}:${rowId}`;
}

const MAX_BACKOFF_MS = 30_000;

/** Backoff exponencial (1s, 2s, 4s, …) con techo de 30s. */
export function nextAttemptDelay(retries: number): number {
  return Math.min(1000 * 2 ** retries, MAX_BACKOFF_MS);
}

export async function enqueueMutation(table: OutboxTable, row: Record<string, unknown>) {
  const id = row.id;
  if (typeof id !== "string" || !id) {
    throw new Error(`enqueueMutation: la fila de "${table}" necesita un id de tipo string.`);
  }

  const db = await openOutboxDb();
  const existing = await getOperation(operationKey(table, id));

  const operation: QueuedMutation = {
    key: operationKey(table, id),
    table,
    row,
    createdAt: existing?.createdAt ?? Date.now(),
    retries: 0,
    nextAttemptAt: 0,
    stamp: crypto.randomUUID(),
  };

  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(OPERATIONS_STORE, "readwrite");
    tx.objectStore(OPERATIONS_STORE).put(operation);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getOperation(key: string): Promise<QueuedMutation | undefined> {
  const db = await openOutboxDb();
  return new Promise((resolve, reject) => {
    const request = db
      .transaction(OPERATIONS_STORE, "readonly")
      .objectStore(OPERATIONS_STORE)
      .get(key);
    request.onsuccess = () => resolve(request.result as QueuedMutation | undefined);
    request.onerror = () => reject(request.error);
  });
}

/** Todas las mutaciones pendientes, en orden de creación (preserva causalidad). */
export async function listPendingMutations(): Promise<QueuedMutation[]> {
  const db = await openOutboxDb();
  return new Promise((resolve, reject) => {
    const request = db
      .transaction(OPERATIONS_STORE, "readonly")
      .objectStore(OPERATIONS_STORE)
      .index("createdAt")
      .getAll();
    request.onsuccess = () => resolve(request.result as QueuedMutation[]);
    request.onerror = () => reject(request.error);
  });
}

export async function removeMutation(key: string): Promise<void> {
  const db = await openOutboxDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OPERATIONS_STORE, "readwrite");
    tx.objectStore(OPERATIONS_STORE).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Quita una operación ya enviada, pero sólo si sigue siendo la que se envió.
 *
 * Leer y borrar van en la misma transacción: si alguien encola otra versión de
 * la fila entre medias, la ve y la deja. Borrar a ciegas por clave perdía ese
 * cambio — un producto marcado justo después de añadirlo no llegaba nunca.
 */
export async function removeMutationIfUnchanged(key: string, stamp?: string): Promise<void> {
  const db = await openOutboxDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OPERATIONS_STORE, "readwrite");
    const store = tx.objectStore(OPERATIONS_STORE);
    const request = store.get(key);
    request.onsuccess = () => {
      const current = request.result as QueuedMutation | undefined;
      if (current && current.stamp === stamp) store.delete(key);
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Aplaza el reintento de una operación que falló, con la misma salvedad que
 *  `removeMutationIfUnchanged`: una versión nueva no hereda el castigo. */
export async function markMutationFailed(
  key: string,
  retries: number,
  stamp?: string,
): Promise<void> {
  const db = await openOutboxDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OPERATIONS_STORE, "readwrite");
    const store = tx.objectStore(OPERATIONS_STORE);
    const request = store.get(key);
    request.onsuccess = () => {
      const current = request.result as QueuedMutation | undefined;
      if (!current || current.stamp !== stamp) return;
      store.put({ ...current, retries, nextAttemptAt: Date.now() + nextAttemptDelay(retries) });
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

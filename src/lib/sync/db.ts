// Conserva el nombre anterior a la marca ListaSupermercado a propósito: es un
// identificador interno de IndexedDB, y renombrarlo dejaría inaccesibles los
// cambios pendientes de sincronizar de quien ya tuviera la app instalada.
const DB_NAME = "shoppinglist-outbox";
const DB_VERSION = 1;
export const OPERATIONS_STORE = "operations";

let dbPromise: Promise<IDBDatabase> | undefined;

/** Abre (o crea) la base de IndexedDB del outbox. Un solo handle por pestaña. */
export function openOutboxDb(): Promise<IDBDatabase> {
  dbPromise ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(OPERATIONS_STORE)) {
        const store = db.createObjectStore(OPERATIONS_STORE, { keyPath: "key" });
        store.createIndex("createdAt", "createdAt");
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

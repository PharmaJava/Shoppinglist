type Listener = () => void;

const listeners = new Set<Listener>();
let cachedCount = 0;

/** Pequeño store externo (para useSyncExternalStore) con el nº de cambios sin sincronizar. */
export function getPendingCountSnapshot(): number {
  return cachedCount;
}

export function subscribePendingCount(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setPendingCount(count: number): void {
  if (count === cachedCount) return;
  cachedCount = count;
  for (const listener of listeners) listener();
}

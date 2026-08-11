import type { CatalogProduct } from "./catalog";
import { normalizeProductName } from "./categorize";
import type { HistoryEntry } from "./history";

export interface Suggestion {
  name: string;
  categoryId: string | null;
  /** De dónde sale: lo propio se marca en la interfaz, lo del catálogo no. */
  source: "history" | "catalog";
}

interface SuggestOptions {
  history: HistoryEntry[];
  catalog: CatalogProduct[];
  /** Normalizados que ya están en la lista: sugerirlos sería ruido. */
  exclude?: Iterable<string>;
  limit?: number;
}

/**
 * Qué ofrecer mientras se escribe un producto.
 *
 * Tres reglas, por orden de importancia:
 *
 * 1. **Lo propio primero.** Si alguien ha comprado "leche desnatada" doce
 *    veces, esa es la sugerencia buena, no la entrada genérica del catálogo.
 * 2. **Empieza por lo escrito antes que lo contiene.** Al teclear "to" se
 *    espera "tomate", no "cartón de tomate".
 * 3. **Con el campo vacío, lo de siempre.** Es el atajo de la compra semanal:
 *    abrir la lista y tocar los cuatro de todas las semanas.
 */
export function suggestProducts(query: string, options: SuggestOptions): Suggestion[] {
  const { history, catalog, limit = 8 } = options;
  const normalizedQuery = normalizeProductName(query);

  const seen = new Set<string>();
  for (const normalized of options.exclude ?? []) seen.add(normalized);

  const results: Suggestion[] = [];

  const push = (normalized: string, suggestion: Suggestion) => {
    if (seen.has(normalized)) return;
    seen.add(normalized);
    results.push(suggestion);
  };

  const fromHistory = (entry: HistoryEntry): Suggestion => ({
    name: entry.name,
    categoryId: entry.categoryId,
    source: "history",
  });

  // El historial ya viene ordenado por veces compradas.
  if (normalizedQuery === "") {
    for (const entry of history) {
      push(entry.normalized, fromHistory(entry));
      if (results.length >= limit) return results;
    }
    return results;
  }

  const historyPrefix = history.filter((entry) => entry.normalized.startsWith(normalizedQuery));
  const historyRest = history.filter(
    (entry) =>
      !entry.normalized.startsWith(normalizedQuery) && entry.normalized.includes(normalizedQuery),
  );
  const catalogPrefix = catalog.filter((entry) => entry.normalized.startsWith(normalizedQuery));
  const catalogRest = catalog.filter(
    (entry) =>
      !entry.normalized.startsWith(normalizedQuery) && entry.normalized.includes(normalizedQuery),
  );

  for (const entry of [...historyPrefix, ...historyRest]) {
    push(entry.normalized, fromHistory(entry));
    if (results.length >= limit) return results;
  }

  // El catálogo no tiene un orden propio útil (viene como lo devuelve la
  // base), así que se ordena por longitud: lo más corto es lo más genérico y
  // casi siempre lo que se buscaba.
  const byLength = (a: CatalogProduct, b: CatalogProduct) =>
    a.normalized.length - b.normalized.length;

  for (const entry of [...catalogPrefix.sort(byLength), ...catalogRest.sort(byLength)]) {
    push(entry.normalized, {
      name: entry.name,
      categoryId: entry.categoryId,
      source: "catalog",
    });
    if (results.length >= limit) return results;
  }

  return results;
}

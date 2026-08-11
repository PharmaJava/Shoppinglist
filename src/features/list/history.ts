import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getCurrentUserId } from "@/lib/supabase/get-current-user-id";
import type { RecordedProduct } from "@/lib/supabase/types";
import { normalizeProductName } from "./categorize";

export interface HistoryEntry {
  /** Tal como se escribió la última vez. Es lo que se enseña. */
  name: string;
  normalized: string;
  categoryId: string | null;
  timesAdded: number;
  /** Lo que suele costar, según lo que esta persona ha ido apuntando. */
  avgPriceCents: number | null;
}

/**
 * Apunta en el historial personal los productos que se acaban de añadir.
 *
 * No espera respuesta ni propaga errores: es aprendizaje, no parte de añadir
 * un producto. Si falla —sin cobertura, por ejemplo— se pierde ese registro y
 * ya está; la lista es lo que importa y ésa sí va por el outbox.
 *
 * A propósito NO se encola en el outbox: la operación es «suma uno», no
 * «escribe esta fila», y una cola que reintenta podría contar dos veces.
 */
export function recordProductsAdded(items: Array<{ name: string; categoryId: string | null }>) {
  const payload: RecordedProduct[] = items
    .map((item) => ({
      normalized: normalizeProductName(item.name),
      name: item.name.trim(),
      category_id: item.categoryId,
    }))
    .filter((item) => item.normalized.length > 0);

  if (payload.length === 0) return;

  void (async () => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) return;
      await getSupabaseBrowserClient().rpc("record_products", { p_items: payload });
    } catch {
      // Ver arriba: el historial es prescindible, la lista no.
    }
  })();
}

/** Los productos que más compra esta persona, los más repetidos primero. */
export async function fetchProductHistory(limit = 60): Promise<HistoryEntry[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data, error } = await getSupabaseBrowserClient()
    .from("user_product_history")
    .select("name, normalized, category_id, times_added, avg_price_cents")
    .order("times_added", { ascending: false })
    .order("last_added", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    name: row.name,
    normalized: row.normalized,
    categoryId: row.category_id,
    timesAdded: row.times_added,
    avgPriceCents: row.avg_price_cents,
  }));
}

/**
 * Apunta lo que ha costado un producto, para no tener que volver a teclearlo.
 *
 * Igual que el resto del historial: en segundo plano, sin propagar errores y
 * fuera del outbox. Guardar el precio es aprendizaje; el precio del producto
 * de la lista, que es el dato de verdad, ya viaja por la cola.
 */
export function recordProductPrice(name: string, priceCents: number): void {
  const normalized = normalizeProductName(name);
  if (!normalized) return;

  void (async () => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) return;
      await getSupabaseBrowserClient().rpc("record_product_price", {
        p_normalized: normalized,
        p_name: name.trim(),
        p_price_cents: priceCents,
      });
    } catch {
      // Ver arriba.
    }
  })();
}

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
    .select("name, normalized, category_id, times_added")
    .order("times_added", { ascending: false })
    .order("last_added", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    name: row.name,
    normalized: row.normalized,
    categoryId: row.category_id,
    timesAdded: row.times_added,
  }));
}

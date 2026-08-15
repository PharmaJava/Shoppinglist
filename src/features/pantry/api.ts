import { normalizeProductName } from "@/features/list/categorize";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getCurrentUserId } from "@/lib/supabase/get-current-user-id";

export interface PantryItem {
  id: string;
  name: string;
  qty: number | null;
  unit: string | null;
  categoryId: string | null;
  /** Fecha, sin hora: `2026-08-20`. Ver la migración 0011. */
  expiresOn: string | null;
}

export async function fetchPantry(): Promise<PantryItem[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("pantry_items")
    .select("id, name, qty, unit, category_id, expires_on")
    .order("expires_on", { ascending: true, nullsFirst: false })
    .order("name");

  if (error) throw new Error(error.message);

  return (data ?? []).map((fila) => ({
    id: fila.id,
    name: fila.name,
    qty: fila.qty,
    unit: fila.unit,
    categoryId: fila.category_id,
    expiresOn: fila.expires_on,
  }));
}

export interface NuevoProducto {
  name: string;
  qty?: number | null;
  unit?: string | null;
  categoryId?: string | null;
  expiresOn?: string | null;
}

/**
 * Añade a la despensa.
 *
 * Si el producto ya está, **suma** en vez de crear otra línea: es lo que hace
 * la restricción única de `(user_id, normalized)` con `on conflict`. Una
 * despensa con dos «leche» no es una despensa, es una lista.
 */
export async function addToPantry(producto: NuevoProducto): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("No hay sesión.");

  const name = producto.name.trim();
  const supabase = getSupabaseBrowserClient();

  const { error } = await supabase.from("pantry_items").upsert(
    {
      user_id: userId,
      name,
      normalized: normalizeProductName(name),
      qty: producto.qty ?? null,
      unit: producto.unit ?? null,
      category_id: producto.categoryId ?? null,
      expires_on: producto.expiresOn ?? null,
    },
    { onConflict: "user_id,normalized" },
  );

  if (error) throw new Error(error.message);
}

export async function updatePantryItem(
  id: string,
  cambios: Partial<Pick<PantryItem, "qty" | "unit" | "expiresOn">>,
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from("pantry_items")
    .update({
      ...(cambios.qty !== undefined && { qty: cambios.qty }),
      ...(cambios.unit !== undefined && { unit: cambios.unit }),
      ...(cambios.expiresOn !== undefined && { expires_on: cambios.expiresOn }),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function removeFromPantry(id: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("pantry_items").delete().eq("id", id);

  if (error) throw new Error(error.message);
}

/**
 * Mete en la despensa todo lo marcado de una compra.
 *
 * Devuelve cuántos productos han entrado. Lo resuelve entero la base de datos
 * (`stock_up_from_list`): son N filas en un viaje, y ahí se puede sumar lo que
 * ya estaba sin traerse la despensa al navegador para compararla.
 */
export async function stockUpFromList(listId: string): Promise<number> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("stock_up_from_list", { p_list: listId });

  if (error) throw new Error(error.message);
  return data ?? 0;
}

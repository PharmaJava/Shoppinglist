import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getCurrentUserId } from "@/lib/supabase/get-current-user-id";
import type { Locale } from "@/lib/supabase/types";
import type { ProductoEscaneado } from "./product-name";

export type Origen = "memoria" | "openfoodfacts";

export interface Reconocido extends ProductoEscaneado {
  /** De dónde ha salido el nombre. Se enseña: no es lo mismo lo tuyo que lo de fuera. */
  origen: Origen;
  categoryId: string | null;
}

/**
 * Qué es este código.
 *
 * **Primero la memoria propia y después Open Food Facts**, y ese orden es la
 * mitad de la función: lo que tú has enseñado una vez manda sobre lo que diga
 * una base de datos de fuera, que para la marca blanca del súper de al lado
 * suele no saber nada o saberlo con otro nombre.
 */
export async function reconocerCodigo(code: string, locale: Locale): Promise<Reconocido | null> {
  const mio = await buscarEnMiMemoria(code);
  if (mio) return mio;

  const respuesta = await fetch(`/api/barcode/${code}?locale=${locale}`);
  if (!respuesta.ok) return null;

  const datos = (await respuesta.json()) as ProductoEscaneado & { found: boolean };
  if (!datos.found) return null;

  return { ...datos, origen: "openfoodfacts", categoryId: null };
}

async function buscarEnMiMemoria(code: string): Promise<Reconocido | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const supabase = getSupabaseBrowserClient();
  const { data } = await supabase
    .from("user_barcodes")
    .select("code, name, category_id")
    .eq("code", code)
    .maybeSingle();

  if (!data) return null;

  return {
    code: data.code,
    name: data.name,
    quantity: null,
    categoryId: data.category_id,
    origen: "memoria",
  };
}

/**
 * Aprende que este código es este producto.
 *
 * Se guarda tanto lo escrito a mano como lo corregido sobre lo que vino de
 * fuera: la próxima vez que se escanee, la respuesta es instantánea y con el
 * nombre que esta persona usa, no con el de la ficha.
 */
export async function recordarCodigo(
  code: string,
  name: string,
  categoryId: string | null,
): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) return;

  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from("user_barcodes")
    .upsert(
      { user_id: userId, code, name: name.trim(), category_id: categoryId },
      { onConflict: "user_id,code" },
    );

  // Aprender es un extra: si falla —por ejemplo porque el plan ya no es
  // premium— el producto se ha añadido igual a la lista, que es lo que
  // importaba.
  if (error) console.warn("No se ha podido recordar el código:", error.message);
}

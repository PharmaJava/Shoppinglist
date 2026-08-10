import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Locale } from "@/lib/supabase/types";
import { mergeCatalogEntries } from "./categorize";

const loadingLocales = new Set<Locale>();
const loadedLocales = new Set<Locale>();

/**
 * Carga el catálogo de productos de un idioma y lo fusiona sobre el
 * diccionario estático de categorize.ts. Falla en silencio: sin red, la
 * categorización sigue con la cobertura del diccionario en memoria.
 */
export async function loadProductCatalog(locale: Locale): Promise<void> {
  if (loadedLocales.has(locale) || loadingLocales.has(locale)) return;
  loadingLocales.add(locale);

  try {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("products")
      .select("normalized, category_id")
      .eq("locale", locale);

    if (!error && data) {
      const entries: Record<string, string> = {};
      for (const row of data) {
        if (row.category_id) entries[row.normalized] = row.category_id;
      }
      mergeCatalogEntries(locale, entries);
      loadedLocales.add(locale);
    }
  } catch {
    // Sin conexión o fallo puntual de red: no es un error del que
    // recuperarse aquí, el diccionario estático sigue funcionando.
  } finally {
    loadingLocales.delete(locale);
  }
}

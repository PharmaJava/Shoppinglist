import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Locale } from "@/lib/supabase/types";
import { mergeCatalogEntries } from "./categorize";

export interface CatalogProduct {
  name: string;
  normalized: string;
  categoryId: string | null;
}

/**
 * Una carga en vuelo por idioma. Guardar la promesa y no un booleano no es un
 * detalle: al arrancar hay dos interesados —la precarga de `CatalogBoot` y las
 * sugerencias de la barra de añadir— y con un simple «ya estoy cargando» el
 * segundo se quedaba con el catálogo vacío para siempre. Así ambos esperan al
 * mismo viaje de red.
 */
const inFlight = new Map<Locale, Promise<CatalogProduct[]>>();
const catalogByLocale: Partial<Record<Locale, CatalogProduct[]>> = {};

export function getCatalogProducts(locale: Locale): CatalogProduct[] {
  return catalogByLocale[locale] ?? [];
}

/**
 * Carga el catálogo de productos de un idioma: lo fusiona sobre el diccionario
 * estático de categorize.ts y lo deja disponible para sugerir mientras se
 * escribe. Falla en silencio devolviendo lo que haya —sin red, la
 * categorización sigue con la cobertura del diccionario en memoria y las
 * sugerencias se quedan con el historial personal.
 */
export function loadProductCatalog(locale: Locale): Promise<CatalogProduct[]> {
  const cached = catalogByLocale[locale];
  if (cached) return Promise.resolve(cached);

  const running = inFlight.get(locale);
  if (running) return running;

  const request = fetchCatalog(locale).finally(() => inFlight.delete(locale));
  inFlight.set(locale, request);
  return request;
}

async function fetchCatalog(locale: Locale): Promise<CatalogProduct[]> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("products")
      .select("name, normalized, category_id")
      .eq("locale", locale);

    if (error || !data) return [];

    const entries: Record<string, string> = {};
    for (const row of data) {
      if (row.category_id) entries[row.normalized] = row.category_id;
    }
    mergeCatalogEntries(locale, entries);

    const products = data.map((row) => ({
      name: row.name,
      normalized: row.normalized,
      categoryId: row.category_id,
    }));
    catalogByLocale[locale] = products;
    return products;
  } catch {
    // Sin conexión o fallo puntual de red: no es un error del que recuperarse
    // aquí. Se reintentará en la siguiente llamada.
    return [];
  }
}

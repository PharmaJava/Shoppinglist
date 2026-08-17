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

const IDIOMAS: Locale[] = ["es", "en"];

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

/**
 * Se piden **los dos idiomas de una vez**, sin filtrar por `locale`.
 *
 * Son 443 filas y unos 19 kB: menos que un icono. Y hace falta el catálogo
 * completo, no sólo el del idioma de la interfaz, porque `categorize` mira
 * también el otro —el móvil en inglés de quien escribe en español (ver
 * ./categorize.ts)—. Con una sola petición filtrada, ese respaldo se quedaba
 * en las noventa palabras del diccionario estático y «sandía» o «nectarina»
 * seguían cayendo en «Otros».
 *
 * Las sugerencias mientras se escribe siguen siendo del idioma de la interfaz
 * (`getCatalogProducts`): ofrecer «Tomato» a quien escribe en español sería
 * ruido para la inmensa mayoría.
 */
async function fetchCatalog(locale: Locale): Promise<CatalogProduct[]> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("products")
      .select("name, normalized, category_id, locale");

    if (error || !data) return [];

    for (const idioma of IDIOMAS) {
      const filas = data.filter((row) => row.locale === idioma);
      // Un idioma sin filas no se registra: dejar el diccionario estático
      // intacto es mejor que sustituirlo por uno vacío.
      if (filas.length === 0) continue;

      const entries: Record<string, string> = {};
      for (const row of filas) {
        if (row.category_id) entries[row.normalized] = row.category_id;
      }
      mergeCatalogEntries(idioma, entries);

      catalogByLocale[idioma] = filas.map((row) => ({
        name: row.name,
        normalized: row.normalized,
        categoryId: row.category_id,
      }));
    }

    return catalogByLocale[locale] ?? [];
  } catch {
    // Sin conexión o fallo puntual de red: no es un error del que recuperarse
    // aquí. Se reintentará en la siguiente llamada.
    return [];
  }
}

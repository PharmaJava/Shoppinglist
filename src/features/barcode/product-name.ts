import type { Locale } from "@/lib/supabase/types";

/**
 * De lo que devuelve Open Food Facts a un nombre que sirva en una lista de la
 * compra.
 *
 * No es lo mismo: la ficha de un producto trae el nombre comercial completo,
 * la marca, el formato y a veces el nombre en varios idiomas. En una lista lo
 * que hace falta es «Leche entera Hacendado», no «Leche entera de vaca
 * pasteurizada, 1 L, Hacendado (Mercadona)».
 */

/** Lo que se pide a Open Food Facts. Pedir menos campos es una respuesta más pequeña. */
export const CAMPOS_OFF = [
  "product_name",
  "product_name_es",
  "product_name_en",
  "generic_name",
  "generic_name_es",
  "generic_name_en",
  "brands",
  "quantity",
] as const;

export interface FichaOFF {
  product_name?: string;
  product_name_es?: string;
  product_name_en?: string;
  generic_name?: string;
  generic_name_es?: string;
  generic_name_en?: string;
  brands?: string;
  quantity?: string;
}

export interface ProductoEscaneado {
  code: string;
  name: string;
  /** El formato tal cual lo dice la ficha («1 L», «500 g»). Sólo para enseñarlo. */
  quantity: string | null;
}

const LARGO_MAXIMO = 80;

/**
 * El nombre en el idioma de quien lo escanea, y si no lo hay, el que haya.
 *
 * Se prueba primero el nombre comercial y después el genérico: «Leche entera»
 * es mejor que nada, pero «Central Lechera Asturiana Entera» es lo que se
 * reconoce en el lineal.
 */
export function nombreDeFicha(ficha: FichaOFF, locale: Locale): string | null {
  const candidatos = [
    locale === "es" ? ficha.product_name_es : ficha.product_name_en,
    ficha.product_name,
    locale === "es" ? ficha.generic_name_es : ficha.generic_name_en,
    ficha.generic_name,
  ];

  const nombre = candidatos.map(limpiar).find((valor) => valor.length > 0);
  if (!nombre) return null;

  return recortar(conMarca(nombre, ficha.brands));
}

export function productoDeFicha(
  code: string,
  ficha: FichaOFF,
  locale: Locale,
): ProductoEscaneado | null {
  const name = nombreDeFicha(ficha, locale);
  if (!name) return null;

  return { code, name, quantity: limpiar(ficha.quantity) || null };
}

/**
 * La marca se añade sólo si no está ya dicha.
 *
 * Con marca se distingue lo que hay que coger del lineal; repetida —«Leche
 * Pascual Pascual»— sólo es ruido. Se coge la primera: `brands` viene con
 * varias separadas por comas cuando el fabricante y la marca no coinciden.
 */
function conMarca(nombre: string, brands: string | undefined): string {
  const marca = limpiar(brands?.split(",")[0]);
  if (!marca) return nombre;

  const yaEsta = nombre.toLowerCase().includes(marca.toLowerCase());
  return yaEsta ? nombre : `${nombre} ${marca}`;
}

function limpiar(valor: string | undefined): string {
  return (valor ?? "").replace(/\s+/g, " ").trim();
}

/**
 * Un nombre que no cabe en la fila no se lee: se corta por la última palabra
 * entera, que es lo que hace legible el recorte.
 */
function recortar(nombre: string): string {
  if (nombre.length <= LARGO_MAXIMO) return nombre;

  const corte = nombre.slice(0, LARGO_MAXIMO);
  const espacio = corte.lastIndexOf(" ");
  return (espacio > 20 ? corte.slice(0, espacio) : corte).trim();
}

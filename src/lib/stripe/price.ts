import type { Locale } from "@/lib/supabase/types";

/**
 * Cómo se enseña un precio de Stripe.
 *
 * Aparte para poder probarlo sin tocar Stripe: aquí es donde se decide que
 * «990 con moneda EUR» son «9,90 €» en español y «€9.90» en inglés, que es lo
 * que espera cada quien.
 */

export type Intervalo = "day" | "week" | "month" | "year";

export interface PrecioPremium {
  /** Ya formateado con su símbolo: «9,90 €». */
  importe: string;
  /** Cada cuánto se cobra. Nulo en un pago único. */
  intervalo: Intervalo | null;
}

/**
 * Stripe da los importes en la unidad mínima de la moneda: 990 son 9,90 €.
 *
 * Se piden dos decimales siempre, aunque el importe sea redondo: «10 €/mes»
 * y «9,90 €/mes» uno debajo del otro con distinto número de decimales se lee
 * peor, y en un precio la coma es justo lo que la gente busca.
 */
export function formatearImporte(unidadMinima: number, moneda: string, locale: Locale): string {
  return new Intl.NumberFormat(locale === "es" ? "es-ES" : "en-US", {
    style: "currency",
    currency: moneda.toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(unidadMinima / 100);
}

/**
 * Las monedas sin decimales (yen, won) no se dividen entre cien.
 *
 * No es un caso que vaya a pasar aquí —el precio será en euros—, pero es una
 * línea y evita que un día alguien vea «¥99.000» donde ponía 990.
 */
const SIN_DECIMALES = new Set([
  "bif",
  "clp",
  "djf",
  "gnf",
  "jpy",
  "kmf",
  "krw",
  "mga",
  "pyg",
  "rwf",
  "ugx",
  "vnd",
  "vuv",
  "xaf",
  "xof",
  "xpf",
]);

export function precioDeStripe(
  unidadMinima: number | null,
  moneda: string,
  intervalo: Intervalo | null,
  locale: Locale,
): PrecioPremium | null {
  if (unidadMinima === null) return null;

  if (SIN_DECIMALES.has(moneda.toLowerCase())) {
    return {
      importe: new Intl.NumberFormat(locale === "es" ? "es-ES" : "en-US", {
        style: "currency",
        currency: moneda.toUpperCase(),
        maximumFractionDigits: 0,
      }).format(unidadMinima),
      intervalo,
    };
  }

  return { importe: formatearImporte(unidadMinima, moneda, locale), intervalo };
}

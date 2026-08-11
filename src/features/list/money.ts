import type { ListItem } from "./types";

/**
 * El precio se guarda **por línea**, no por unidad: lo que cuesta meter eso en
 * el carro. Con «carne picada 500 g» un precio por unidad no significaría nada
 * —¿por gramo, por bandeja?— y multiplicarlo por 500 daría un disparate. Así
 * lo que se teclea es lo que se suma, sin reglas que memorizar.
 */
export interface Totals {
  /** Suma de todo lo que tiene precio, en céntimos. */
  totalCents: number;
  /** De esa suma, lo que ya está marcado. */
  checkedCents: number;
  /** Productos sin precio: el total es un mínimo, no una factura. */
  missingPrices: number;
}

export function computeTotals(items: ListItem[]): Totals {
  let totalCents = 0;
  let checkedCents = 0;
  let missingPrices = 0;

  for (const item of items) {
    if (item.price_cents === null) {
      missingPrices += 1;
      continue;
    }
    totalCents += item.price_cents;
    if (item.is_checked) checkedCents += item.price_cents;
  }

  return { totalCents, checkedCents, missingPrices };
}

/**
 * Lee un precio escrito a mano y lo pasa a céntimos.
 *
 * Acepta coma y punto porque en un móvil español el teclado numérico ofrece
 * coma, y da igual cuál salga. Devuelve `null` para lo que no es un precio,
 * incluido el campo vacío: dejarlo en blanco es la forma de quitarlo.
 */
export function parsePriceToCents(input: string): number | null {
  const cleaned = input
    .trim()
    .replace(/[€$\s]/g, "")
    .replace(",", ".");
  if (cleaned === "") return null;

  const value = Number.parseFloat(cleaned);
  if (Number.isNaN(value) || value < 0) return null;

  // El `toFixed` intermedio no es adorno: `0.145 * 100` da 14.499999999999998
  // en coma flotante y `Math.round` lo dejaría en 14 céntimos. Recortar el
  // ruido antes de redondear devuelve los 15 que cualquiera espera.
  return Math.round(Number((value * 100).toFixed(4)));
}

/** Céntimos → el texto que va en el campo de edición ("12.4" → "12,40"). */
export function centsToInput(cents: number | null, locale: string): string {
  if (cents === null) return "";
  const value = (cents / 100).toFixed(2);
  return locale === "es" ? value.replace(".", ",") : value;
}

export function formatMoney(cents: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale === "es" ? "es-ES" : "en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

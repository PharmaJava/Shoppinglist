import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getCurrentUserId } from "@/lib/supabase/get-current-user-id";
import type { Locale } from "@/lib/supabase/types";

/**
 * Las monedas que se ofrecen.
 *
 * Lista corta y explícita en vez de las ~180 de ISO 4217: un desplegable de
 * ciento ochenta entradas en un móvil es peor que no poder elegir. Están las
 * de los países de habla hispana con más tráfico, más las que aparecen por el
 * idioma inglés. Añadir una es una línea.
 */
export const CURRENCIES = [
  { code: "EUR", label: "€ Euro" },
  { code: "USD", label: "$ Dólar" },
  { code: "GBP", label: "£ Libra" },
  { code: "MXN", label: "$ Peso mexicano" },
  { code: "ARS", label: "$ Peso argentino" },
  { code: "COP", label: "$ Peso colombiano" },
  { code: "CLP", label: "$ Peso chileno" },
  { code: "PEN", label: "S/ Sol" },
  { code: "BRL", label: "R$ Real" },
  { code: "CHF", label: "Fr. Franco suizo" },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];

export function isCurrencyCode(value: string): value is CurrencyCode {
  return CURRENCIES.some((moneda) => moneda.code === value);
}

export interface Preferences {
  locale: Locale;
  currency: CurrencyCode;
}

export const DEFAULT_PREFERENCES: Preferences = { locale: "es", currency: "EUR" };

export async function fetchPreferences(): Promise<Preferences> {
  const userId = await getCurrentUserId();
  if (!userId) return DEFAULT_PREFERENCES;

  const supabase = getSupabaseBrowserClient();
  const { data } = await supabase
    .from("profiles")
    .select("locale, currency")
    .eq("id", userId)
    .maybeSingle();

  if (!data) return DEFAULT_PREFERENCES;

  return {
    locale: data.locale,
    // Un código que ya no ofrecemos —porque se quitó de la lista— no puede
    // dejar el desplegable en blanco: se enseña el que hay por defecto.
    currency: isCurrencyCode(data.currency) ? data.currency : DEFAULT_PREFERENCES.currency,
  };
}

/**
 * Guarda las preferencias.
 *
 * El idioma no sólo cambia la interfaz: se guarda porque las notificaciones
 * push las compone el servidor, que no tiene forma de saber en qué idioma
 * escribir si no está aquí (ver docs/07-PUSH.md).
 *
 * La moneda se aplica a las listas **nuevas**, no a las que ya existen: cambiar
 * la moneda de una lista con precios ya puestos convertiría 12 € en 12 $ sin
 * que nadie haya cambiado ningún precio.
 */
export async function updatePreferences(cambios: Partial<Preferences>): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("No hay sesión.");

  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("profiles").update(cambios).eq("id", userId);

  if (error) throw new Error(error.message);
}

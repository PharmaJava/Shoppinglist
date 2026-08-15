import type { Cadence, Locale } from "@/lib/supabase/types";

/**
 * Las cuentas de fechas de las listas recurrentes **las hace el servidor**
 * (`next_run_after`, migración 0012). Aquí sólo se decide qué se enseña y qué
 * valores por defecto se proponen al programar una: dos calendarios, uno en
 * cada lado, se separarían al primer cambio de horario.
 */

export const CADENCIAS: readonly Cadence[] = ["weekly", "biweekly", "monthly"] as const;

/** ISO, como en la base de datos: 1 = lunes … 7 = domingo. */
export const DIAS_SEMANA = [1, 2, 3, 4, 5, 6, 7] as const;

/** El tope del día del mes es 28 a propósito: ver la migración 0012. */
export const DIA_MES_MAXIMO = 28;

/**
 * Lo que se propone al abrir el formulario: el día de hoy.
 *
 * Quien programa la compra un viernes suele querer «los viernes»; proponer un
 * lunes fijo obliga a corregirlo a casi todo el mundo. El día del mes se topa
 * en 28 por lo mismo que en la base de datos.
 */
export function valoresPorDefecto(hoy: Date): { weekday: number; dayOfMonth: number } {
  // `getDay()` da 0 para el domingo; la base de datos usa ISO, donde es 7.
  const dia = hoy.getDay();
  return {
    weekday: dia === 0 ? 7 : dia,
    dayOfMonth: Math.min(hoy.getDate(), DIA_MES_MAXIMO),
  };
}

/**
 * El nombre del día en el idioma que toque, sin tablas de traducción propias.
 *
 * Se devuelve tal cual lo da `Intl`, que es la forma correcta en cada idioma:
 * minúscula en español («los viernes») y mayúscula en inglés («on Friday»).
 * Forzar una de las dos estropea la otra.
 */
export function nombreDia(weekday: number, locale: Locale): string {
  // 2026-01-05 fue lunes, así que sumar (weekday - 1) da el día pedido.
  const fecha = new Date(Date.UTC(2026, 0, 4 + weekday));
  return new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" }).format(fecha);
}

/**
 * «viernes, 21 de agosto». Sin año: una lista recurrente se ve en el mes o
 * dos siguientes, y el año sólo añade ruido.
 */
export function fechaLarga(fechaISO: string, locale: Locale): string {
  const [anio, mes, dia] = fechaISO.split("-").map(Number);
  if (!anio || !mes || !dia) return fechaISO;

  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(anio, mes - 1, dia)));
}

/**
 * Cuántos días faltan, contando días naturales y no horas: entre las 23:00 de
 * hoy y las 08:00 de mañana hay «un día», no cero. Misma cuenta que la
 * caducidad de la despensa, y por el mismo motivo.
 */
export function diasHasta(fechaISO: string, hoy: Date): number {
  const [anio, mes, dia] = fechaISO.split("-").map(Number);
  if (!anio || !mes || !dia) return Number.NaN;

  const objetivo = Date.UTC(anio, mes - 1, dia);
  const referencia = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  return Math.round((objetivo - referencia) / 86_400_000);
}

import type { List } from "./types";

/**
 * Cuándo se da por terminada la lista de un invitado.
 *
 * Una lista de la compra tiene un final natural: se compra y se acaba. Quien
 * tiene cuenta la archiva cuando quiere; un invitado cierra la pestaña y no
 * vuelve, y esa lista se queda abierta para siempre como si la compra
 * siguiera en marcha. A las 24 horas de crearla se da por hecha —que es
 * tiempo de sobra para ir al súper— y se archiva.
 *
 * Archivada, **no borrada**: sigue ahí con sus productos y se vuelve a abrir
 * de un toque. Lo que hace la fecha la pone la base de datos (migración
 * 0015); aquí sólo se lee.
 */

/** Desde cuándo avisar de que queda poco. */
const AVISO_HORAS = 6;

export type EstadoFinal = "sin-caducidad" | "lejos" | "pronto" | "vencida";

export function estadoFinal(list: List, ahora: Date): EstadoFinal {
  if (!list.auto_finish_at) return "sin-caducidad";

  const restan = milisegundosHasta(list.auto_finish_at, ahora);
  if (restan <= 0) return "vencida";

  return restan <= AVISO_HORAS * 3_600_000 ? "pronto" : "lejos";
}

/**
 * Cuánto queda, en horas hacia arriba.
 *
 * Hacia arriba y no hacia abajo: durante los últimos cincuenta minutos, decir
 * «queda 1 hora» es más honesto que «quedan 0 horas», que suena a que ya no
 * queda nada.
 */
export function horasRestantes(list: List, ahora: Date): number {
  if (!list.auto_finish_at) return Number.POSITIVE_INFINITY;

  return Math.max(0, Math.ceil(milisegundosHasta(list.auto_finish_at, ahora) / 3_600_000));
}

/**
 * ¿Hay que archivarla ya?
 *
 * La pantalla de la lista la archiva en cuanto se abre pasada la hora, sin
 * esperar a la pasada diaria del servidor: quien la mira tiene que ver la
 * verdad, no una lista que dice estar abierta y que el servidor cerrará esta
 * madrugada.
 */
export function hayQueDarlaPorTerminada(list: List, ahora: Date): boolean {
  return !list.archived_at && estadoFinal(list, ahora) === "vencida";
}

function milisegundosHasta(fechaISO: string, ahora: Date): number {
  return new Date(fechaISO).getTime() - ahora.getTime();
}

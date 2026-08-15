export type EstadoCaducidad = "caducado" | "hoy" | "pronto" | "lejos" | "sin-fecha";

/** A partir de cuántos días se deja de avisar. Una semana es lo que dura una
 *  compra, así que es lo que hay que mirar antes de volver al súper. */
export const DIAS_AVISO = 7;

/**
 * Cuántos días faltan para que caduque, contando por **día natural** y no por
 * horas.
 *
 * Restar milisegundos y dividir entre 86 400 000 da resultados equivocados dos
 * veces al año: en el cambio de hora un día dura 23 o 25 horas, y algo que
 * caduca mañana pasa a «caduca hoy». Comparar los días sueltos no tiene ese
 * problema.
 */
export function diasHasta(expiresOn: string, hoy: Date): number {
  const [anio, mes, dia] = expiresOn.split("-").map(Number);
  if (!anio || !mes || !dia) return Number.NaN;

  const caduca = Date.UTC(anio, mes - 1, dia);
  const referencia = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

  return Math.round((caduca - referencia) / 86_400_000);
}

export function estadoCaducidad(expiresOn: string | null, hoy: Date): EstadoCaducidad {
  if (!expiresOn) return "sin-fecha";

  const dias = diasHasta(expiresOn, hoy);
  if (Number.isNaN(dias)) return "sin-fecha";
  if (dias < 0) return "caducado";
  if (dias === 0) return "hoy";
  if (dias <= DIAS_AVISO) return "pronto";
  return "lejos";
}

/** ¿Merece que se avise de esto en la pantalla principal? */
export function urge(estado: EstadoCaducidad): boolean {
  return estado === "caducado" || estado === "hoy" || estado === "pronto";
}

/**
 * Ordena por lo que hay que mirar antes. Lo caducado arriba —hay que tirarlo—,
 * luego lo que caduca antes, y lo que no tiene fecha al final: no corre prisa
 * y llenaría el principio de la lista de cosas que no piden nada.
 */
export function ordenarPorCaducidad<T extends { expiresOn: string | null; name: string }>(
  productos: T[],
  hoy: Date,
): T[] {
  return [...productos].sort((a, b) => {
    if (a.expiresOn && b.expiresOn) {
      const diferencia = diasHasta(a.expiresOn, hoy) - diasHasta(b.expiresOn, hoy);
      if (diferencia !== 0) return diferencia;
    } else if (a.expiresOn !== b.expiresOn) {
      return a.expiresOn ? -1 : 1;
    }
    return a.name.localeCompare(b.name, "es");
  });
}

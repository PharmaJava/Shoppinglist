const CLAVE = "sl_compra_en_curso";

/**
 * Qué lista se está comprando ahora mismo, si es que hay alguna.
 *
 * Se guarda en `localStorage` y no en el estado de React por un motivo muy
 * concreto: dentro del súper la pantalla se apaga —por el botón de bloqueo, o
 * porque el navegador retira el *wake lock* al pasar a segundo plano— y al
 * volver la página puede haberse recargado. Si la compra viviera sólo en
 * memoria, se saldría del modo compra sin que nadie lo pidiera y la pantalla
 * volvería a apagarse a los treinta segundos. Que es exactamente lo que hay
 * que evitar.
 *
 * Sólo una lista a la vez: nadie compra en dos supermercados a la vez, y así
 * la clave es una y no hay que limpiar nada.
 */
export function leerCompraEnCurso(): string | null {
  try {
    return localStorage.getItem(CLAVE);
  } catch {
    // Modo privado, almacenamiento lleno… la compra funciona igual, sólo que
    // no sobrevive a una recarga.
    return null;
  }
}

export function empezarCompra(listId: string): void {
  try {
    localStorage.setItem(CLAVE, listId);
  } catch {
    // Ver arriba.
  }
}

export function terminarCompra(): void {
  try {
    localStorage.removeItem(CLAVE);
  } catch {
    // Ver arriba.
  }
}

export function hayCompraEnCurso(listId: string): boolean {
  return leerCompraEnCurso() === listId;
}

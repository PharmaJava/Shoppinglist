import { generateKeyBetween } from "fractional-indexing";

/** Clave para insertar al final de la lista (caso de uso principal: añadir). */
export function keyAtEnd(lastKey: string | null): string {
  return generateKeyBetween(lastKey, null);
}

/** Clave para insertar entre dos productos existentes (reordenar). */
export function keyBetween(before: string | null, after: string | null): string {
  return generateKeyBetween(before, after);
}

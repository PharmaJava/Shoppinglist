/**
 * Reglas del nombre de usuario, en un sitio y sin dependencias.
 *
 * Las mismas que la migración 0016 (`profiles_username_format` y
 * `normalize_username`), a propósito repetidas aquí: la base de datos es la
 * autoridad —es la única que no se puede saltar—, pero decirle a alguien
 * «ese nombre no vale» antes de mandar el formulario es la diferencia entre
 * corregir una letra y volver a empezar.
 */

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;

const FORMATO = /^[a-z0-9_]{3,20}$/;

/** Lo que se teclea → lo que se guarda. Vacío es nulo, no cadena vacía. */
export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidUsername(raw: string): boolean {
  return FORMATO.test(normalizeUsername(raw));
}

/**
 * Con qué se está intentando entrar.
 *
 * La pantalla de acceso tiene un solo campo —«correo o usuario»— porque
 * obligar a acertar la pestaña antes de escribir es un paso de más para algo
 * que se distingue solo: la arroba.
 */
export function looksLikeEmail(value: string): boolean {
  return value.includes("@");
}

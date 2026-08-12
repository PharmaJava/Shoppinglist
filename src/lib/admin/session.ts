import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * La cookie de sesión del panel: `caduca.firma`.
 *
 * No lleva datos —no hace falta, sólo hay un administrador— así que no hay
 * nada que cifrar: basta con que no se pueda falsificar. La firma es un HMAC
 * de la fecha de caducidad con una clave derivada del hash de la contraseña,
 * y eso tiene una consecuencia buena y gratis: **cambiar la contraseña
 * invalida todas las sesiones abiertas**, sin llevar ningún registro.
 */
const CONTEXTO = "vegeta-sesion-v1";

function clave(secreto: string): Buffer {
  return createHmac("sha256", CONTEXTO).update(secreto).digest();
}

function firmar(secreto: string, caduca: number): string {
  return createHmac("sha256", clave(secreto)).update(String(caduca)).digest("hex");
}

export function createSessionToken(secreto: string, caducaEnMs: number): string {
  return `${caducaEnMs}.${firmar(secreto, caducaEnMs)}`;
}

export function isSessionValid(secreto: string, token: string | undefined, ahora: number): boolean {
  if (!token || !secreto) return false;

  const separador = token.indexOf(".");
  if (separador <= 0) return false;

  const caduca = Number(token.slice(0, separador));
  const firma = token.slice(separador + 1);
  if (!Number.isSafeInteger(caduca) || caduca <= ahora) return false;

  const esperada = Buffer.from(firmar(secreto, caduca), "utf8");
  const recibida = Buffer.from(firma, "utf8");

  return recibida.length === esperada.length && timingSafeEqual(recibida, esperada);
}

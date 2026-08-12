import { randomBytes, type ScryptOptions, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

// `promisify` se queda con la sobrecarga sin opciones, que es justo la que no
// sirve: sin `N`, `r` y `p` scrypt usa sus valores por defecto, mucho más
// flojos que los de aquí.
const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: ScryptOptions,
) => Promise<Buffer>;

/**
 * Parámetros de scrypt. N = 2^15 tarda ~100 ms y pide 32 MB de memoria: es
 * mucho para quien prueba contraseñas a lo bruto y nada para un inicio de
 * sesión que ocurre una vez al día.
 */
const N = 32768;
const R = 8;
const P = 1;
const LONGITUD = 32;

const PREFIJO = "scrypt";

/**
 * La contraseña del panel **nunca** se guarda: se guarda esto, y esto es lo
 * que va en la variable de entorno del servidor. Ni el repositorio ni el
 * navegador ven nunca la contraseña en claro.
 */
export async function hashPassword(plana: string): Promise<string> {
  const sal = randomBytes(16);
  const derivada = await scryptAsync(plana.normalize("NFC"), sal, LONGITUD, {
    N,
    r: R,
    p: P,
    maxmem: 128 * N * R * 2,
  });

  return [PREFIJO, N, R, P, sal.toString("hex"), derivada.toString("hex")].join("$");
}

/**
 * Devuelve `false` ante cualquier problema —formato raro, hash vacío, error de
 * la librería— en vez de lanzar: un panel de administración que revienta con
 * un 500 le está contando al que llama que ha encontrado algo.
 */
export async function verifyPassword(plana: string, guardado: string): Promise<boolean> {
  try {
    const partes = guardado.split("$");
    if (partes.length !== 6 || partes[0] !== PREFIJO) return false;

    const n = Number(partes[1]);
    const r = Number(partes[2]);
    const p = Number(partes[3]);
    const sal = Buffer.from(partes[4] ?? "", "hex");
    const esperado = Buffer.from(partes[5] ?? "", "hex");

    if (!Number.isInteger(n) || !Number.isInteger(r) || !Number.isInteger(p)) return false;
    if (sal.length === 0 || esperado.length === 0) return false;

    const derivada = await scryptAsync(plana.normalize("NFC"), sal, esperado.length, {
      N: n,
      r,
      p,
      maxmem: 128 * n * r * 2,
    });

    // Comparación en tiempo constante: comparar con `===` filtra por cuántos
    // bytes coinciden y eso basta para reconstruir el hash byte a byte.
    return derivada.length === esperado.length && timingSafeEqual(derivada, esperado);
  } catch {
    return false;
  }
}

/**
 * La contraseña lleva una `ñ`, y «ñ» se puede escribir de dos maneras en
 * Unicode: un carácter, o una `n` seguida de una tilde combinante. Un iPhone y
 * un teclado de Linux no siempre mandan la misma. Normalizar a NFC en los dos
 * lados —al generar el hash y al comprobarlo— evita que la contraseña correcta
 * falle según desde dónde se escriba.
 */
export function normalizePassword(plana: string): string {
  return plana.normalize("NFC");
}

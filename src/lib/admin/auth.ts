import { timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { verifyPassword } from "./password";
import { crearLimitador } from "./rate-limit";
import { createSessionToken, isSessionValid } from "./session";

/**
 * Guardia de módulo. Nada de este archivo puede acabar en el navegador: lee
 * variables de entorno del servidor y compara contraseñas.
 *
 * En la práctica Next ya lo impide —sólo inlinea en el cliente las variables
 * con prefijo `NEXT_PUBLIC_`, y ninguna de las de aquí lo lleva, así que en un
 * bundle de navegador valdrían `undefined`—, pero un `undefined` silencioso es
 * peor que un error: parecería que funciona.
 */
if (typeof window !== "undefined") {
  throw new Error("src/lib/admin/auth.ts es sólo de servidor.");
}

const COOKIE = "vegeta_sesion";
/** Ocho horas: una jornada. Al día siguiente se vuelve a entrar. */
const DURACION_MS = 8 * 60 * 60 * 1000;

/**
 * Diez intentos antes de parar quince minutos.
 *
 * No es un número tímido: quien de verdad esté probando contraseñas se topa
 * antes con scrypt, que a ~100 ms por comprobación limita a diez pruebas por
 * segundo aunque no hubiera freno ninguno. Bajarlo a cinco sólo consigue una
 * cosa: que el administrador se deje fuera de su propio panel por teclear mal
 * dos veces desde el móvil.
 */
const limitador = crearLimitador({
  maxIntentos: 10,
  bloqueoMs: 15 * 60 * 1000,
  olvidoMs: 30 * 60 * 1000,
});

export type ResultadoAcceso =
  | { ok: true }
  | { ok: false; motivo: "credenciales" }
  | { ok: false; motivo: "bloqueado"; segundos: number }
  | { ok: false; motivo: "sin_configurar" };

function configuracion() {
  return {
    email: process.env.ADMIN_EMAIL?.trim().toLowerCase() ?? "",
    hash: process.env.ADMIN_PASSWORD_HASH ?? "",
  };
}

/** ¿Está el panel montado en este despliegue? */
export function adminConfigurado(): boolean {
  const { email, hash } = configuracion();
  return email.length > 0 && hash.length > 0;
}

function comparaEmail(recibido: string, esperado: string): boolean {
  const a = Buffer.from(recibido.trim().toLowerCase(), "utf8");
  const b = Buffer.from(esperado, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

async function clienteIp(): Promise<string> {
  const cabeceras = await headers();
  // En Vercel el proxy pone la IP real aquí; en local no hay ninguna y todos
  // los intentos comparten cubo, que es justo lo que se quiere en local.
  return (
    cabeceras.get("x-forwarded-for")?.split(",")[0]?.trim() ?? cabeceras.get("x-real-ip") ?? "local"
  );
}

/**
 * Comprueba las credenciales y, si cuadran, deja la cookie de sesión puesta.
 *
 * Se llama desde una Server Action: la contraseña viaja en el cuerpo de un
 * POST por HTTPS y se compara aquí. En ningún momento sale del servidor.
 */
export async function iniciarSesionAdmin(
  email: string,
  password: string,
): Promise<ResultadoAcceso> {
  const { email: emailOk, hash } = configuracion();
  if (!emailOk || !hash) return { ok: false, motivo: "sin_configurar" };

  const ip = await clienteIp();
  const espera = limitador.esperaRestante(ip, Date.now());
  if (espera > 0) {
    return { ok: false, motivo: "bloqueado", segundos: Math.ceil(espera / 1000) };
  }

  // Se comprueba la contraseña **siempre**, aunque el correo no cuadre: si se
  // saliera antes, el tiempo de respuesta diría si el correo existe.
  const passwordOk = await verifyPassword(password, hash);
  const emailCoincide = comparaEmail(email, emailOk);

  if (!passwordOk || !emailCoincide) {
    limitador.registrarFallo(ip, Date.now());
    return { ok: false, motivo: "credenciales" };
  }

  limitador.registrarExito(ip);

  const caduca = Date.now() + DURACION_MS;
  const almacen = await cookies();
  almacen.set(COOKIE, createSessionToken(hash, caduca), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/vegeta",
    expires: new Date(caduca),
  });

  return { ok: true };
}

export async function cerrarSesionAdmin(): Promise<void> {
  const almacen = await cookies();
  almacen.delete({ name: COOKIE, path: "/vegeta" });
}

/** ¿Hay una sesión de administración válida en esta petición? */
export async function haySesionAdmin(): Promise<boolean> {
  const { hash } = configuracion();
  if (!hash) return false;

  const almacen = await cookies();
  return isSessionValid(hash, almacen.get(COOKIE)?.value, Date.now());
}

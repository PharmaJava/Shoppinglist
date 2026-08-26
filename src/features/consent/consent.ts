/**
 * Qué se guarda en el dispositivo de quien visita, y qué se le pregunta.
 *
 * Antes de escribir una línea de esto hubo que mirar qué guarda de verdad
 * esta web, porque un banner que pide permiso para cosas que no se hacen es
 * tan mentira como uno que no pide permiso para las que sí:
 *
 * | Qué | Para qué | ¿Se pregunta? |
 * |---|---|---|
 * | Cookie de sesión de Supabase | Es tu cuenta. Sin ella no hay listas | No: sin esto no hay servicio |
 * | `NEXT_LOCALE` | El idioma en el que se te enseña la web | No: es tu propia elección |
 * | Base de datos local (IndexedDB) | Tu lista dentro del súper sin cobertura | No: es lo que viniste a usar |
 * | Contador de visitas (localStorage) | Ofrecer instalar la app en la 2ª visita, y no volver a insistir si dices que no | No: es funcional y no sale del móvil |
 * | Medición de Vercel | Cuánta gente entra y si la web va lenta | **Sí** |
 *
 * Las cuatro primeras son **estrictamente necesarias** y por eso no se
 * preguntan: la ley no exige pedir permiso para lo que hace falta para dar el
 * servicio que la persona ha pedido, y fingir que sí lo exige sólo entrena a
 * la gente a pulsar «aceptar» sin leer.
 *
 * La quinta sí se pregunta, aunque la medición de Vercel **no use cookies ni
 * guarde nada en el dispositivo**. Se pregunta porque se puede apagar de
 * verdad: decir que no aquí hace que los scripts de medición no se carguen.
 * Un interruptor que no apaga nada es peor que no tener interruptor.
 */

export type ConsentState = "granted" | "denied";

export interface Consent {
  /** Medición de audiencia y rendimiento (Vercel). */
  measurement: ConsentState;
  /** Cuándo se decidió, en ISO. Sirve para poder demostrarlo. */
  decidedAt: string;
  /** Con qué versión de la pregunta. Si cambia lo que se pide, se re-pregunta. */
  version: number;
}

/**
 * Sube cuando cambie **lo que se pregunta**, no cuando cambie el diseño.
 *
 * Subirla vuelve a enseñar el banner a todo el mundo, así que es exactamente
 * lo que hay que hacer el día que se añada una herramienta nueva — y
 * exactamente lo que no hay que hacer por mover un botón.
 */
export const CONSENT_VERSION = 1;

export const CONSENT_KEY = "ls-consent";

/** Se dispara al guardar para que la página reaccione sin recargar. */
export const CONSENT_EVENT = "ls-consent-change";

export function grantAll(now: Date = new Date()): Consent {
  return { measurement: "granted", decidedAt: now.toISOString(), version: CONSENT_VERSION };
}

export function denyAll(now: Date = new Date()): Consent {
  return { measurement: "denied", decidedAt: now.toISOString(), version: CONSENT_VERSION };
}

/**
 * Lee lo decidido. `null` significa «todavía no ha contestado», que es
 * distinto de «ha dicho que no» y por eso no se colapsan en un booleano.
 *
 * Una decisión de una versión anterior se trata como si no la hubiera: si ha
 * cambiado lo que se pregunta, la respuesta de antes no responde a esto.
 */
export function parseConsent(raw: string | null): Consent | null {
  if (!raw) return null;

  try {
    const datos = JSON.parse(raw) as Partial<Consent>;
    if (datos.version !== CONSENT_VERSION) return null;
    if (datos.measurement !== "granted" && datos.measurement !== "denied") return null;

    return {
      measurement: datos.measurement,
      decidedAt: typeof datos.decidedAt === "string" ? datos.decidedAt : new Date().toISOString(),
      version: CONSENT_VERSION,
    };
  } catch {
    // Un valor corrupto —o de otra versión de la web— se trata como si no
    // estuviera: se vuelve a preguntar, que es lo seguro.
    return null;
  }
}

/**
 * Todo lo que toca `localStorage` va envuelto: en modo privado de Safari, con
 * las cookies bloqueadas o dentro de un iframe, leer o escribir ahí **lanza**.
 * Y quedarse sin poder recordar la respuesta no puede tumbar la web.
 */
export function readConsent(): Consent | null {
  try {
    return parseConsent(localStorage.getItem(CONSENT_KEY));
  } catch {
    return null;
  }
}

export function writeConsent(consent: Consent): void {
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
  } catch {
    // Sin poder guardarlo se volverá a preguntar en la próxima visita. Es
    // molesto y es lo correcto: lo que no se puede recordar no se supone.
  }

  window.dispatchEvent(new Event(CONSENT_EVENT));
}

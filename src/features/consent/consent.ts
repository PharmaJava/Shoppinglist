import { ASKED_CATEGORIES, type ConsentCategory } from "./categories";

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
 * | Google Analytics | Estadísticas de uso | **Sí**, y sólo si está configurado |
 *
 * Las cuatro primeras son **estrictamente necesarias** y por eso no se
 * preguntan: la ley no exige pedir permiso para lo que hace falta para dar el
 * servicio que la persona ha pedido, y fingir que sí lo exige sólo entrena a
 * la gente a pulsar «aceptar» sin leer.
 *
 * Las otras dos sí, cada una por su motivo. La de Vercel **no usa cookies ni
 * guarda nada en el dispositivo**, y aun así se pregunta porque se puede
 * apagar de verdad. Google Analytics **sí pone cookies** (`_ga`), así que ahí
 * no es una cortesía: sin permiso previo no se puede cargar, y no se carga.
 */

export type ConsentState = "granted" | "denied";

export interface Consent {
  choices: Record<ConsentCategory, ConsentState>;
  /** Cuándo se decidió, en ISO. Sirve para poder demostrarlo. */
  decidedAt: string;
  version: number;
}

/**
 * Sube cuando cambie **lo que se pregunta de una categoría que ya existía**
 * —por ejemplo, si Vercel empezara a poner cookies—. Añadir una categoría
 * nueva no necesita tocarla: eso se detecta solo, más abajo.
 */
export const CONSENT_VERSION = 1;

export const CONSENT_KEY = "ls-consent";

/** Se dispara al guardar para que la página reaccione sin recargar. */
export const CONSENT_EVENT = "ls-consent-change";

/** Lo pide el enlace del pie para volver a abrir el panel. */
export const CONSENT_OPEN_EVENT = "ls-consent-open";

function todas(estado: ConsentState): Consent {
  const choices = {} as Record<ConsentCategory, ConsentState>;
  for (const categoria of ASKED_CATEGORIES) choices[categoria] = estado;
  return { choices, decidedAt: new Date().toISOString(), version: CONSENT_VERSION };
}

export function grantAll(): Consent {
  return todas("granted");
}

export function denyAll(): Consent {
  return todas("denied");
}

/** Una decisión a medida, la del panel de «elegir». */
export function fromChoices(choices: Partial<Record<ConsentCategory, boolean>>): Consent {
  const decision = denyAll();
  for (const categoria of ASKED_CATEGORIES) {
    decision.choices[categoria] = choices[categoria] ? "granted" : "denied";
  }
  return decision;
}

/**
 * Lee lo decidido. `null` significa «todavía no ha contestado», que es
 * distinto de «ha dicho que no» y por eso no se colapsan en un booleano.
 *
 * Dos motivos para tratar una respuesta guardada como si no existiera:
 *
 * 1. **Es de otra versión de la pregunta.** Si cambió lo que se pide, la
 *    respuesta de antes no responde a esto.
 * 2. **No cubre todo lo que hoy se pregunta.** Éste es el que importa para el
 *    futuro: el día que se configure Google Analytics, `ASKED_CATEGORIES`
 *    pasa a tener dos elementos y **todas las respuestas guardadas se quedan
 *    cortas**, así que se vuelve a preguntar a todo el mundo. Sin depender de
 *    que nadie se acuerde de subir un número a mano, que es exactamente el
 *    tipo de cosa que se olvida.
 */
export function parseConsent(raw: string | null): Consent | null {
  if (!raw) return null;

  try {
    const datos = JSON.parse(raw) as Partial<Consent>;
    if (datos.version !== CONSENT_VERSION) return null;

    const guardadas = datos.choices;
    if (!guardadas || typeof guardadas !== "object") return null;

    const choices = {} as Record<ConsentCategory, ConsentState>;
    for (const categoria of ASKED_CATEGORIES) {
      const valor = guardadas[categoria];
      if (valor !== "granted" && valor !== "denied") return null;
      choices[categoria] = valor;
    }

    return {
      choices,
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

/** ¿Se puede cargar lo de esta categoría? Sin respuesta, no. */
export function isGranted(consent: Consent | null, categoria: ConsentCategory): boolean {
  return consent?.choices[categoria] === "granted";
}

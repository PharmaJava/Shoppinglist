/**
 * Qué se pregunta, y cuándo deja de preguntarse una cosa y empiezan a ser dos.
 *
 * Vive aparte de `consent.ts` porque es lo único que hay que tocar el día que
 * se añada una herramienta nueva: se declara aquí, y el resto —el aviso, el
 * panel del pie, volver a preguntar a quien ya había contestado— sale solo.
 */

export type ConsentCategory = "measurement" | "analytics";

/**
 * El identificador de Google Analytics, si lo hay.
 *
 * Se lee con el nombre completo escrito a mano y no con una plantilla: Next
 * sustituye estas expresiones en tiempo de compilado buscando el literal
 * (misma razón que en `src/lib/flags.ts`).
 *
 * **Mientras esté vacío, Google Analytics no existe en esta web**: ni se
 * pregunta por él en el aviso, ni se carga su script, ni se nombra en la
 * política de privacidad. Ponerlo es lo único que hace falta para encenderlo.
 */
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";

export const ANALYTICS_CONFIGURED = GA_MEASUREMENT_ID.length > 0;

/**
 * Lo que se le pregunta a la persona **hoy**, en el orden en que se le enseña.
 *
 * `analytics` sólo entra en la lista si Google Analytics está configurado.
 * Preguntar por una herramienta que no se usa es tan mentira como no
 * preguntar por una que sí — y además convierte el aviso en un trámite.
 */
export const ASKED_CATEGORIES: ConsentCategory[] = ANALYTICS_CONFIGURED
  ? ["measurement", "analytics"]
  : ["measurement"];

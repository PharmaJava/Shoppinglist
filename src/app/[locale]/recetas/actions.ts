"use server";

import { type ParsedRecipe, parseRecipe } from "@/features/recipes/parse-recipe";
import { PREMIUM_VISIBLE } from "@/lib/flags";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Locale } from "@/lib/supabase/types";

/**
 * Leer una receta pegada, en el servidor.
 *
 * Podría hacerse en el navegador —es texto y expresiones regulares— y se hace
 * aquí por dos motivos:
 *
 * 1. **El plan se comprueba donde no se puede falsear.** `require_premium()`
 *    lanza si quien llama no paga, y eso no depende de ningún interruptor del
 *    cliente.
 * 2. **Es la forma que tendrá cuando haya modelo.** El plan (F3-6) es
 *    heurística primero y LLM después; cuando el segundo llegue, cada llamada
 *    costará dinero y tendrá que pasar por aquí igualmente. Montarlo ya con
 *    esta forma evita rehacer la pantalla entera entonces.
 *
 * Lo que **no** se pretende es que el algoritmo sea un secreto: se puede leer
 * en el repositorio. Lo que se protege es el servicio, no la receta de cómo
 * está hecho.
 */

/** Una receta larguísima es un pegado accidental, no una receta. */
const LIMITE_CARACTERES = 20_000;

export type MotivoRechazo =
  | "apagado"
  | "vacio"
  | "demasiado_largo"
  | "sin_sesion"
  | "no_premium"
  | "error";

export type ResultadoReceta =
  | { ok: true; receta: ParsedRecipe }
  | { ok: false; motivo: MotivoRechazo };

export async function leerRecetaAction(texto: string, locale: Locale): Promise<ResultadoReceta> {
  // Con la Fase 3 apagada la página no existe, pero una acción de servidor se
  // puede invocar por su identificador aunque no haya pantalla que la llame.
  if (!PREMIUM_VISIBLE) return { ok: false, motivo: "apagado" };

  const limpio = texto.trim();
  if (!limpio) return { ok: false, motivo: "vacio" };
  if (limpio.length > LIMITE_CARACTERES) return { ok: false, motivo: "demasiado_largo" };

  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, motivo: "sin_sesion" };

    // `require_premium()` (migración 0010) lanza si el plan es gratuito, y el
    // plan no lo puede escribir nadie desde el cliente (política
    // `profiles_update_own`). Aquí sólo se traduce ese error a un motivo.
    const { error } = await supabase.rpc("require_premium");
    if (error) return { ok: false, motivo: "no_premium" };

    return { ok: true, receta: parseRecipe(limpio, locale) };
  } catch {
    return { ok: false, motivo: "error" };
  }
}

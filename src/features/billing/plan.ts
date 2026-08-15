import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getCurrentUserId } from "@/lib/supabase/get-current-user-id";
import type { Plan } from "@/lib/supabase/types";

/**
 * El plan de quien está usando la app.
 *
 * Esto sirve para **enseñar** una cosa u otra, no para autorizar. Quien
 * manipule su navegador puede hacer que esta función devuelva 'premium' y no
 * conseguirá nada: las funciones de pago comprueban el plan en el servidor con
 * `require_premium()`, y las tablas de pago lo comprueban en sus políticas RLS
 * (migración 0010). El cliente decide qué pintar; la base de datos decide qué
 * se puede hacer.
 */
export async function fetchPlan(): Promise<Plan> {
  const userId = await getCurrentUserId();
  if (!userId) return "free";

  const supabase = getSupabaseBrowserClient();
  const { data } = await supabase.from("profiles").select("plan").eq("id", userId).maybeSingle();

  return data?.plan ?? "free";
}

/**
 * Las funciones que van a ser de pago. Cada una es una entrada del backlog
 * (`docs/04-BACKLOG.md`, Fase 3) y se irán conectando de una en una.
 */
export type PremiumFeature =
  | "listas-recurrentes"
  | "despensa"
  | "receta-a-lista"
  | "codigos-de-barras";

/** Cuántas listas activas caben en el plan gratuito. */
export const LIMITE_LISTAS_GRATIS = 5;

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getCurrentUserId } from "@/lib/supabase/get-current-user-id";
import type { Cadence } from "@/lib/supabase/types";

export interface RecurringList {
  id: string;
  templateId: string;
  /** El nombre de la plantilla de la que sale, para poder decir de dónde viene. */
  templateTitle: string;
  title: string;
  cadence: Cadence;
  weekday: number | null;
  dayOfMonth: number | null;
  /** Fecha sin hora: `2026-08-21`. La decide el servidor. */
  nextRunOn: string;
  lastRunOn: string | null;
  lastListId: string | null;
  active: boolean;
}

interface FilaConPlantilla {
  id: string;
  template_id: string;
  title: string;
  cadence: Cadence;
  weekday: number | null;
  day_of_month: number | null;
  next_run_on: string;
  last_run_on: string | null;
  last_list_id: string | null;
  active: boolean;
  list_templates: { title: string } | null;
}

export async function fetchRecurringLists(): Promise<RecurringList[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("recurring_lists")
    .select(
      "id, template_id, title, cadence, weekday, day_of_month, next_run_on, last_run_on, last_list_id, active, list_templates(title)",
    )
    .order("next_run_on", { ascending: true });

  if (error) throw new Error(error.message);

  return ((data ?? []) as unknown as FilaConPlantilla[]).map((fila) => ({
    id: fila.id,
    templateId: fila.template_id,
    templateTitle: fila.list_templates?.title ?? "",
    title: fila.title,
    cadence: fila.cadence,
    weekday: fila.weekday,
    dayOfMonth: fila.day_of_month,
    nextRunOn: fila.next_run_on,
    lastRunOn: fila.last_run_on,
    lastListId: fila.last_list_id,
    active: fila.active,
  }));
}

export interface NuevaRecurrente {
  templateId: string;
  title: string;
  cadence: Cadence;
  weekday?: number | null;
  dayOfMonth?: number | null;
}

/**
 * Programa una lista.
 *
 * No se manda `next_run_on`: lo calcula el servidor en un disparador. Si lo
 * mandara el cliente, bastaría una fecha de ayer para que la tarea diaria
 * fuera creando listas en cada pasada.
 */
export async function createRecurringList(nueva: NuevaRecurrente): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("No hay sesión.");

  const supabase = getSupabaseBrowserClient();
  const semanal = nueva.cadence !== "monthly";

  const { error } = await supabase.from("recurring_lists").insert({
    owner_id: userId,
    template_id: nueva.templateId,
    title: nueva.title.trim(),
    cadence: nueva.cadence,
    // Cada periodicidad usa un campo y sólo uno; la base de datos rechaza lo
    // demás con una restricción (`recurring_lists_cadence_fields`).
    weekday: semanal ? (nueva.weekday ?? 1) : null,
    day_of_month: semanal ? null : (nueva.dayOfMonth ?? 1),
  });

  if (error) throw new Error(error.message);
}

export async function setRecurringActive(id: string, active: boolean): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("recurring_lists").update({ active }).eq("id", id);

  if (error) throw new Error(error.message);
}

export async function deleteRecurringList(id: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("recurring_lists").delete().eq("id", id);

  if (error) throw new Error(error.message);
}

/**
 * Crea ya la lista de una programación, sin esperar a que le toque, y devuelve
 * su id para poder ir a ella.
 *
 * Mismo camino que usa la tarea diaria (`run_recurring_list`): una sola
 * implementación, o la lista de «crearla ahora» acabaría siendo distinta de la
 * que aparece sola por las mañanas. No mueve el calendario.
 */
export async function runRecurringNow(id: string): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("run_recurring_list", { p_recurring: id });

  if (error) throw new Error(error.message);
  if (!data) throw new Error("No se pudo crear la lista.");
  return data;
}

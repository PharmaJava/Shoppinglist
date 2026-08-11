import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getCurrentUserId } from "@/lib/supabase/get-current-user-id";
import { buildExport, type ExportedData } from "./export-shape";

export type { ExportedData, ExportedList } from "./export-shape";

/**
 * Reúne todo lo que la RLS deja leer a esta persona y lo devuelve en JSON.
 *
 * Es el derecho de portabilidad del RGPD resuelto sin escribir un correo: la
 * política de privacidad lo promete y hasta ahora sólo se podía pedir a mano.
 */
export async function exportMyData(): Promise<ExportedData> {
  const supabase = getSupabaseBrowserClient();

  const userId = await getCurrentUserId();
  if (!userId) throw new Error("No hay sesión que exportar.");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [profile, lists, history] = await Promise.all([
    supabase.from("profiles").select().eq("id", userId).maybeSingle(),
    supabase.from("lists").select().order("created_at"),
    supabase.from("user_product_history").select().order("times_added", { ascending: false }),
  ]);

  if (lists.error) throw new Error(lists.error.message);

  const listIds = (lists.data ?? []).map((list) => list.id);
  const items = listIds.length
    ? await supabase.from("list_items").select().in("list_id", listIds)
    : { data: [], error: null };

  if (items.error) throw new Error(items.error.message);

  return buildExport({
    userId,
    email: user?.email ?? null,
    profile: profile.data ?? null,
    lists: lists.data ?? [],
    items: items.data ?? [],
    history: history.data ?? [],
  });
}

/** Lanza la descarga del JSON. El nombre lleva la fecha para que dos
 *  exportaciones no se pisen en la carpeta de descargas. */
export function downloadExport(data: ExportedData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `listasupermercado-${data.exportedAt.slice(0, 10)}.json`;
  link.click();

  URL.revokeObjectURL(url);
}

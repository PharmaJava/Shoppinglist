import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getCurrentUserId } from "@/lib/supabase/get-current-user-id";
import { buildExport, type ExportedData, type ExportedTemplate } from "./export-shape";

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

  const [profile, lists, history, templates] = await Promise.all([
    supabase.from("profiles").select().eq("id", userId).maybeSingle(),
    supabase.from("lists").select().order("created_at"),
    supabase.from("user_product_history").select().order("times_added", { ascending: false }),
    // Las plantillas propias también son suyas: dejarlas fuera haría de la
    // exportación una promesa a medias en cuanto alguien guarde la primera.
    supabase
      .from("list_templates")
      .select("title, created_at, template_items(name, qty, unit, category_id, sort_order)")
      .eq("owner_id", userId)
      .order("created_at"),
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
    templates: toExportedTemplates(templates.data ?? []),
  });
}

type TemplateRow = {
  title: string;
  created_at: string;
  template_items: Array<{
    name: string;
    qty: number | null;
    unit: string | null;
    category_id: string | null;
    sort_order: number;
  }> | null;
};

function toExportedTemplates(filas: TemplateRow[]): ExportedTemplate[] {
  return filas.map((fila) => ({
    title: fila.title,
    createdAt: fila.created_at,
    items: [...(fila.template_items ?? [])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((item) => ({
        name: item.name,
        qty: item.qty,
        unit: item.unit,
        category: item.category_id,
      })),
  }));
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

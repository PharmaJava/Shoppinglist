import { createListFromTemplate, type TemplateListItem } from "@/features/list/api";
import type { List } from "@/features/list/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getCurrentUserId } from "@/lib/supabase/get-current-user-id";
import type { Locale } from "@/lib/supabase/types";

export interface MyTemplate {
  id: string;
  title: string;
  createdAt: string;
  /** Cuántos productos lleva. Se pide aparte porque va en la lista de tarjetas. */
  itemCount: number;
}

/**
 * Plantillas propias.
 *
 * No confundir con las de `src/content`: aquellas son contenido editorial, van
 * en el sitemap y son iguales para todo el mundo. Estas son de cada persona,
 * viven en la base de datos y no las ve nadie más (política `templates_select`).
 */
export async function saveListAsTemplate(listId: string, title: string): Promise<string> {
  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase.rpc("save_list_as_template", {
    p_list: listId,
    p_title: title,
  });

  if (error) throw new Error(error.message);
  if (!data) throw new Error("No se pudo guardar la plantilla.");
  return data;
}

export async function fetchMyTemplates(): Promise<MyTemplate[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("list_templates")
    .select("id, title, created_at, template_items(count)")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((fila) => ({
    id: fila.id,
    title: fila.title,
    createdAt: fila.created_at,
    // PostgREST devuelve el agregado como un array de un elemento.
    itemCount: (fila.template_items as unknown as Array<{ count: number }>)?.[0]?.count ?? 0,
  }));
}

export async function fetchTemplateItems(templateId: string): Promise<TemplateListItem[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("template_items")
    .select("name, qty, unit, category_id")
    .eq("template_id", templateId)
    .order("sort_order");

  if (error) throw new Error(error.message);

  return (data ?? []).map((fila) => ({
    name: fila.name,
    qty: fila.qty ?? undefined,
    unit: fila.unit ?? undefined,
    categoryId: fila.category_id ?? "other",
  }));
}

export async function renameTemplate(templateId: string, title: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from("list_templates")
    .update({ title: title.trim() })
    .eq("id", templateId);

  if (error) throw new Error(error.message);
}

/** Los productos se van con ella: `template_items` cae por `on delete cascade`. */
export async function deleteTemplate(templateId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("list_templates").delete().eq("id", templateId);

  if (error) throw new Error(error.message);
}

/**
 * Crea una lista a partir de una plantilla propia.
 *
 * Reutiliza el mismo camino que las plantillas de contenido: así una lista
 * nacida de una plantilla propia y otra nacida del catálogo público se
 * comportan igual —categorías, historial, orden— sin dos implementaciones.
 */
export async function createListFromMyTemplate(
  templateId: string,
  title: string,
  locale: Locale,
): Promise<List> {
  const items = await fetchTemplateItems(templateId);
  if (items.length === 0) throw new Error("Esa plantilla no tiene productos.");

  await bumpUseCount(templateId);
  return createListFromTemplate(title, items, locale);
}

/** Cuántas veces se ha usado. Sin esperar y sin romper nada si falla: es un
 *  contador, no parte del resultado. */
async function bumpUseCount(templateId: string): Promise<void> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase
      .from("list_templates")
      .select("use_count")
      .eq("id", templateId)
      .maybeSingle();

    await supabase
      .from("list_templates")
      .update({ use_count: (data?.use_count ?? 0) + 1 })
      .eq("id", templateId);
  } catch {
    // Un contador no puede impedir que se cree la lista.
  }
}

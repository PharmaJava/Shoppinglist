import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { categorize } from "@/features/list/categorize";
import { keyAtEnd } from "@/features/list/sort-key";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Locale } from "@/lib/supabase/types";

/**
 * Destino del `share_target` del manifest: recibe lo que el sistema
 * operativo comparte hacia la PWA instalada (una receta, una nota, un
 * enlace) y crea una lista con una línea por producto.
 *
 * Se ejecuta directamente contra Supabase (no por el outbox): un
 * Route Handler siempre tiene red, es la petición que lo invoca.
 */
export async function POST(request: Request) {
  const formData = await request.formData();
  const title = String(formData.get("title") ?? "").trim();
  const text = String(formData.get("text") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/es", request.url), 303);
  }

  const locale = ((await cookies()).get("NEXT_LOCALE")?.value as Locale | undefined) ?? "es";

  const lines = [text, url]
    .filter(Boolean)
    .join("\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 50);

  const listTitle = (title || lines[0] || "Lista compartida").slice(0, 60);

  const { data: list, error: listError } = await supabase
    .from("lists")
    .insert({ id: crypto.randomUUID(), title: listTitle, owner_id: user.id })
    .select()
    .single();

  if (listError || !list) {
    return NextResponse.redirect(new URL(`/${locale}`, request.url), 303);
  }

  const now = new Date().toISOString();
  const rows: Array<Record<string, unknown>> = [];
  let sortKey: string | null = null;

  for (const line of lines) {
    sortKey = keyAtEnd(sortKey);
    rows.push({
      id: crypto.randomUUID(),
      list_id: list.id,
      name: line.slice(0, 200),
      category_id: categorize(line, locale),
      sort_key: sortKey,
      created_by: user.id,
      created_at: now,
      updated_at: now,
    });
  }

  if (rows.length > 0) {
    // Las filas se construyen completas justo arriba; el tipo genérico de
    // supabase-js no infiere bien un array construido dinámicamente.
    await supabase.from("list_items").insert(rows as never);
  }

  return NextResponse.redirect(new URL(`/l/${list.id}`, request.url), 303);
}

import { nanoid } from "nanoid";
import { ensureGuestSession } from "@/features/auth/ensure-guest-session";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ListRole, Locale } from "@/lib/supabase/types";
import { categorize } from "./categorize";
import { keyAtEnd } from "./sort-key";
import type { Category, List, ListItem } from "./types";

/** Crea una lista vacía (el propietario se añade solo, vía trigger). */
export async function createList(title: string): Promise<List> {
  await ensureGuestSession();
  const supabase = getSupabaseBrowserClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No hay sesión activa.");

  const { data, error } = await supabase
    .from("lists")
    .insert({ title, owner_id: user.id })
    .select()
    .single();

  if (error || !data) throw new Error(error?.message ?? "No se pudo crear la lista.");
  return data;
}

export async function addItem(
  listId: string,
  name: string,
  locale: Locale,
  lastSortKey: string | null,
): Promise<ListItem> {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("list_items")
    .insert({
      id: crypto.randomUUID(),
      list_id: listId,
      name: name.trim(),
      category_id: categorize(name, locale),
      sort_key: keyAtEnd(lastSortKey),
      created_by: user?.id ?? null,
    })
    .select()
    .single();

  if (error || !data) throw new Error(error?.message ?? "No se pudo añadir el producto.");
  return data;
}

/** Crea la lista y su primer producto en una sola operación (alta directa de la landing). */
export async function createListWithFirstItem(
  firstItemName: string,
  locale: Locale,
): Promise<List> {
  const list = await createList(firstItemName.trim().slice(0, 60) || "Mi lista");
  await addItem(list.id, firstItemName, locale, null);
  return list;
}

export async function toggleItem(itemId: string, isChecked: boolean): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("list_items")
    .update({
      is_checked: isChecked,
      checked_by: isChecked ? (user?.id ?? null) : null,
      checked_at: isChecked ? new Date().toISOString() : null,
    })
    .eq("id", itemId);

  if (error) throw new Error(error.message);
}

export async function deleteItem(itemId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from("list_items")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", itemId);

  if (error) throw new Error(error.message);
}

export async function renameList(listId: string, title: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("lists").update({ title }).eq("id", listId);
  if (error) throw new Error(error.message);
}

export async function fetchListWithItems(
  listId: string,
): Promise<{ list: List; items: ListItem[] }> {
  const supabase = getSupabaseBrowserClient();

  const [{ data: list, error: listError }, { data: items, error: itemsError }] = await Promise.all([
    supabase.from("lists").select().eq("id", listId).single(),
    supabase
      .from("list_items")
      .select()
      .eq("list_id", listId)
      .is("deleted_at", null)
      .order("sort_key", { ascending: true }),
  ]);

  if (listError || !list) throw new Error(listError?.message ?? "Lista no encontrada.");
  if (itemsError) throw new Error(itemsError.message);

  return { list, items: items ?? [] };
}

export async function fetchCategories(): Promise<Category[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.from("categories").select().order("sort_order");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export interface InviteOptions {
  role?: ListRole;
  expiresInDays?: number;
}

/** Reutiliza una invitación activa del propietario si existe; si no, crea una nueva. */
export async function getOrCreateActiveInvite(listId: string): Promise<string> {
  await ensureGuestSession();
  const supabase = getSupabaseBrowserClient();

  const nowIso = new Date().toISOString();
  const { data: existing } = await supabase
    .from("list_invites")
    .select()
    .eq("list_id", listId)
    .is("revoked_at", null)
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) return existing.token;
  return createInvite(listId);
}

export async function createInvite(listId: string, options: InviteOptions = {}): Promise<string> {
  await ensureGuestSession();
  const supabase = getSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No hay sesión activa.");

  const token = nanoid(22);
  const expiresAt = options.expiresInDays
    ? new Date(Date.now() + options.expiresInDays * 86_400_000).toISOString()
    : null;

  const { error } = await supabase.from("list_invites").insert({
    token,
    list_id: listId,
    created_by: user.id,
    role: options.role ?? "editor",
    expires_at: expiresAt,
  });

  if (error) throw new Error(error.message);
  return token;
}

export async function joinListByToken(token: string): Promise<string> {
  await ensureGuestSession();
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("join_list_by_token", { p_token: token });
  if (error || !data) throw new Error(error?.message ?? "invite_invalid");
  return data;
}

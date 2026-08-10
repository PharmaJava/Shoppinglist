import { nanoid } from "nanoid";
import {
  describeSessionForError,
  ensureFreshGuestSession,
  ensureGuestSession,
  isRowLevelSecurityError,
} from "@/features/auth/ensure-guest-session";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getCurrentUserId } from "@/lib/supabase/get-current-user-id";
import type { ListRole, Locale } from "@/lib/supabase/types";
import { queueRowMutation } from "@/lib/sync/flush";
import { categorize } from "./categorize";
import type { ParsedVoiceItem } from "./parse-voice";
import { keyAtEnd } from "./sort-key";
import type { Category, List, ListItem } from "./types";

/**
 * Crea una lista vacía (el propietario se añade solo, vía trigger). Requiere
 * red: es el único punto de entrada que garantiza que la lista existe en el
 * servidor antes de navegar a `/l/[listId]`, que lee por red la primera vez.
 */
export async function createList(title: string): Promise<List> {
  const ownerId = await ensureGuestSession();
  const supabase = getSupabaseBrowserClient();

  const insertList = (owner: string) =>
    supabase
      .from("lists")
      .insert({ id: crypto.randomUUID(), title, owner_id: owner })
      .select()
      .single();

  let { data, error } = await insertList(ownerId);

  // La sesión en caché (localStorage/cookies) puede haber quedado obsoleta
  // o inválida sin que el cliente lo detecte de antemano: getSession() no
  // valida contra el servidor. Un rechazo de RLS aquí es la señal de que
  // eso ha pasado — se fuerza una sesión nueva y se reintenta una vez.
  if (error && isRowLevelSecurityError(error.message)) {
    const freshOwnerId = await ensureFreshGuestSession();
    ({ data, error } = await insertList(freshOwnerId));

    if (error && isRowLevelSecurityError(error.message)) {
      const debug = await describeSessionForError();
      throw new Error(`${error.message} [ownerId=${freshOwnerId}; ${debug}]`);
    }
  }

  if (error || !data) throw new Error(error?.message ?? "No se pudo crear la lista.");
  return data;
}

/**
 * Añade un producto. Se encola en el outbox (IndexedDB): funciona sin red y
 * se sincroniza sola al recuperar conexión (ver src/lib/sync).
 */
export async function addItem(
  listId: string,
  name: string,
  locale: Locale,
  lastSortKey: string | null,
  extra?: { qty?: number | null; unit?: string | null },
): Promise<ListItem> {
  const userId = await getCurrentUserId();
  const now = new Date().toISOString();

  const row: ListItem = {
    id: crypto.randomUUID(),
    list_id: listId,
    name: name.trim(),
    qty: extra?.qty ?? null,
    unit: extra?.unit ?? null,
    note: null,
    category_id: categorize(name, locale),
    price_cents: null,
    is_checked: false,
    checked_by: null,
    checked_at: null,
    assigned_to: null,
    sort_key: keyAtEnd(lastSortKey),
    created_by: userId,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };

  await queueRowMutation("list_items", row);
  return row;
}

/**
 * Añade varios productos de una vez (resultado del parser de voz),
 * conservando el orden hablado con claves de orden consecutivas.
 */
export async function addParsedItems(
  listId: string,
  items: ParsedVoiceItem[],
  locale: Locale,
  lastSortKey: string | null,
): Promise<ListItem[]> {
  const created: ListItem[] = [];
  let cursor = lastSortKey;

  for (const item of items) {
    const row = await addItem(listId, item.name, locale, cursor, {
      qty: item.qty,
      unit: item.unit,
    });
    created.push(row);
    cursor = row.sort_key;
  }

  return created;
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

export async function toggleItem(item: ListItem, isChecked: boolean): Promise<ListItem> {
  const userId = await getCurrentUserId();
  const row: ListItem = {
    ...item,
    is_checked: isChecked,
    checked_by: isChecked ? userId : null,
    checked_at: isChecked ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  };

  await queueRowMutation("list_items", row);
  return row;
}

export async function deleteItem(item: ListItem): Promise<void> {
  const row: ListItem = {
    ...item,
    deleted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  await queueRowMutation("list_items", row);
}

export async function renameList(list: List, title: string): Promise<List> {
  const row: List = { ...list, title, updated_at: new Date().toISOString() };
  await queueRowMutation("lists", row);
  return row;
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
  const userId = await ensureGuestSession();
  const supabase = getSupabaseBrowserClient();

  const token = nanoid(22);
  const expiresAt = options.expiresInDays
    ? new Date(Date.now() + options.expiresInDays * 86_400_000).toISOString()
    : null;

  const insertInvite = (createdBy: string) =>
    supabase.from("list_invites").insert({
      token,
      list_id: listId,
      created_by: createdBy,
      role: options.role ?? "editor",
      expires_at: expiresAt,
    });

  let { error } = await insertInvite(userId);

  if (error && isRowLevelSecurityError(error.message)) {
    const freshUserId = await ensureFreshGuestSession();
    ({ error } = await insertInvite(freshUserId));

    if (error && isRowLevelSecurityError(error.message)) {
      const debug = await describeSessionForError();
      throw new Error(`${error.message} [userId=${freshUserId}; ${debug}]`);
    }
  }

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

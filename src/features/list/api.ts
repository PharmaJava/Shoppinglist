import { nanoid } from "nanoid";
import { ensureGuestSession } from "@/features/auth/ensure-guest-session";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getCurrentUserId } from "@/lib/supabase/get-current-user-id";
import type { ListRole, Locale } from "@/lib/supabase/types";
import { queueRowMutation } from "@/lib/sync/flush";
import { categorize } from "./categorize";
import { recordProductsAdded } from "./history";
import { type ParsedVoiceItem, parseVoiceTranscript } from "./parse-voice";
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

  const { data, error } = await supabase
    .from("lists")
    .insert({ id: crypto.randomUUID(), title, owner_id: ownerId })
    .select()
    .single();

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
  extra?: { qty?: number | null; unit?: string | null; categoryId?: string | null },
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
    // Una categoría explícita (la que trae una plantilla) manda sobre la
    // deducida del nombre: está revisada a mano y es más fiable.
    category_id: extra?.categoryId ?? categorize(name, locale),
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

  // Único punto donde se aprende del usuario al añadir a mano o por voz: todo
  // lo que crea productos pasa por aquí. En segundo plano y sin esperar.
  recordProductsAdded(created.map((row) => ({ name: row.name, categoryId: row.category_id })));

  return created;
}

/**
 * Crea la lista y sus productos a partir de lo escrito en la landing.
 *
 * Se reutiliza el parser de voz: "leche, pan, tomates" debe separarse igual
 * escrito que dictado, y de paso se reconocen cantidades ("2 litros de leche").
 * El título llega ya traducido desde el componente, que es quien tiene i18n.
 */
export async function createListFromInput(
  input: string,
  locale: Locale,
  title: string,
): Promise<List> {
  const parsed = parseVoiceTranscript(input, locale);
  const items: ParsedVoiceItem[] =
    parsed.length > 0 ? parsed : [{ name: input.trim(), qty: null, unit: null }];

  const list = await createList(title);
  await addParsedItems(list.id, items, locale, null);
  return list;
}

export interface TemplateListItem {
  name: string;
  qty?: number;
  unit?: string;
  categoryId: string;
}

/**
 * Crea una lista propia a partir de una plantilla de contenido.
 *
 * Conserva el orden en que la plantilla presenta los productos —agrupados por
 * pasillo— porque es el recorrido que el usuario acaba de leer en la página.
 */
export async function createListFromTemplate(
  title: string,
  items: TemplateListItem[],
  locale: Locale,
): Promise<List> {
  const list = await createList(title);
  let cursor: string | null = null;

  for (const item of items) {
    const row = await addItem(list.id, item.name, locale, cursor, {
      qty: item.qty ?? null,
      unit: item.unit ?? null,
      categoryId: item.categoryId,
    });
    cursor = row.sort_key;
  }

  recordProductsAdded(items.map((item) => ({ name: item.name, categoryId: item.categoryId })));

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

export interface ItemEdits {
  name?: string;
  qty?: number | null;
  unit?: string | null;
}

/**
 * Corrige un producto ya añadido: su nombre, su cantidad o su unidad.
 *
 * Pasa por el outbox como el resto de escrituras, así que se puede corregir
 * dentro del supermercado sin cobertura. No se recategoriza al cambiar el
 * nombre: si alguien lo movió de pasillo a mano, reescribirlo aquí desharía
 * esa decisión.
 */
export async function updateItem(item: ListItem, edits: ItemEdits): Promise<ListItem> {
  const row: ListItem = {
    ...item,
    name: edits.name?.trim() || item.name,
    qty: edits.qty === undefined ? item.qty : edits.qty,
    unit: edits.unit === undefined ? item.unit : edits.unit,
    updated_at: new Date().toISOString(),
  };

  await queueRowMutation("list_items", row);
  return row;
}

/** Deshace un borrado. El producto sigue en la tabla con `deleted_at`, así que
 *  basta con limpiarlo: conserva su id, su orden y quién lo añadió. */
export async function restoreItem(item: ListItem): Promise<ListItem> {
  const row: ListItem = {
    ...item,
    deleted_at: null,
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

/**
 * Archiva o recupera una lista. Archivar no borra nada: la saca del panel y
 * la deja en su propia sección, que es lo que se quiere con la compra de la
 * semana pasada.
 *
 * Es un cambio de la lista, no de quien la mira, así que afecta a todos sus
 * miembros. Con una sola columna `archived_at` no hay alternativa, y para el
 * caso real —una lista terminada entre quienes la compartieron— es lo
 * esperable.
 */
export async function setListArchived(list: List, archived: boolean): Promise<List> {
  const row: List = {
    ...list,
    archived_at: archived ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  };
  await queueRowMutation("lists", row);
  return row;
}

/**
 * Copia una lista con todos sus productos sin marcar: «volver a comprar».
 *
 * Conserva cantidad, unidad y categoría —incluidas las que se movieron de
 * pasillo a mano— y el orden original. No toca el historial personal: son los
 * mismos productos de siempre, contarlos otra vez sólo desvirtuaría el «lo
 * que sueles comprar».
 */
export async function duplicateList(listId: string, title: string, locale: Locale): Promise<List> {
  const { items } = await fetchListWithItems(listId);
  const copy = await createList(title);

  let cursor: string | null = null;
  for (const item of items) {
    const row = await addItem(copy.id, item.name, locale, cursor, {
      qty: item.qty,
      unit: item.unit,
      categoryId: item.category_id,
    });
    cursor = row.sort_key;
  }

  return copy;
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

export interface ListSummary {
  list: List;
  totalItems: number;
  checkedItems: number;
}

/**
 * Todas las listas a las que el usuario tiene acceso, con su progreso.
 *
 * Son dos consultas y no un `count` embebido a propósito: PostgREST sabe
 * contar filas relacionadas, pero no dos veces con filtros distintos, y aquí
 * hacen falta el total y los ya marcados. Traer `list_id` e `is_checked` de
 * los productos vivos es una carga mínima —bytes por producto— y da el dato
 * exacto sin añadir una vista a la base de datos.
 */
export async function fetchMyLists(): Promise<ListSummary[]> {
  // A diferencia del resto de operaciones, aquí NO se crea sesión de invitado:
  // sin sesión no hay listas que enseñar, y darle de alta una identidad a quien
  // sólo ha entrado a mirar engordaría `auth.users` sin ninguna contrapartida
  // (docs/00-PLAN.md §10, riesgo de crecimiento por invitados).
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const supabase = getSupabaseBrowserClient();

  // Se traen también las archivadas: el panel las separa en su sección y son
  // pocas por definición, así que partirlo en dos consultas sólo añadiría
  // latencia.
  const { data: lists, error } = await supabase
    .from("lists")
    .select()
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  if (!lists || lists.length === 0) return [];

  const { data: items, error: itemsError } = await supabase
    .from("list_items")
    .select("list_id, is_checked")
    .in(
      "list_id",
      lists.map((list) => list.id),
    )
    .is("deleted_at", null);

  if (itemsError) throw new Error(itemsError.message);

  const progress = new Map<string, { total: number; checked: number }>();
  for (const item of items ?? []) {
    const entry = progress.get(item.list_id) ?? { total: 0, checked: 0 };
    entry.total += 1;
    if (item.is_checked) entry.checked += 1;
    progress.set(item.list_id, entry);
  }

  return lists.map((list) => ({
    list,
    totalItems: progress.get(list.id)?.total ?? 0,
    checkedItems: progress.get(list.id)?.checked ?? 0,
  }));
}

export interface ListMember {
  userId: string;
  role: ListRole;
  /** Nombre elegido en la cuenta. Vacío mientras no lo haya puesto o si es
   *  invitado, que no tiene dónde ponerlo. */
  displayName: string;
  isMe: boolean;
}

/**
 * Quién comparte una lista. Dos consultas y no un `join` embebido porque la
 * clave foránea de `list_members.user_id` apunta a `auth.users`, no a
 * `profiles`, y PostgREST no puede inferir esa relación.
 */
export async function fetchListMembers(listId: string): Promise<ListMember[]> {
  const supabase = getSupabaseBrowserClient();
  const myId = await getCurrentUserId();

  const { data: members, error } = await supabase
    .from("list_members")
    .select("user_id, role")
    .eq("list_id", listId);

  if (error) throw new Error(error.message);
  if (!members || members.length === 0) return [];

  // Sólo devuelve los perfiles que RLS permite ver: los de quienes comparten
  // lista contigo. Si alguno falta, se queda sin nombre en vez de romper.
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in(
      "id",
      members.map((member) => member.user_id),
    );

  const names = new Map((profiles ?? []).map((p) => [p.id, p.display_name ?? ""]));

  return members.map((member) => ({
    userId: member.user_id,
    role: member.role,
    displayName: names.get(member.user_id) ?? "",
    isMe: member.user_id === myId,
  }));
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

  const { error } = await supabase.from("list_invites").insert({
    token,
    list_id: listId,
    created_by: userId,
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

import type { ListItemRow, ListRow, ProductHistoryRow, ProfileRow } from "@/lib/supabase/types";

export interface ExportedList {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  isOwner: boolean;
  items: Array<{
    name: string;
    qty: number | null;
    unit: string | null;
    note: string | null;
    category: string | null;
    isChecked: boolean;
    createdAt: string;
  }>;
}

export interface ExportedTemplate {
  title: string;
  createdAt: string;
  items: Array<{ name: string; qty: number | null; unit: string | null; category: string | null }>;
}

export interface ExportedData {
  exportedAt: string;
  /**
   * Sube a 2 al añadir plantillas y moneda. El número está para que quien
   * lea un archivo antiguo —o un importador futuro— sepa qué esperar.
   */
  format: 2;
  account: {
    id: string;
    email: string | null;
    displayName: string | null;
    locale: string | null;
    currency: string | null;
    createdAt: string | null;
  };
  lists: ExportedList[];
  templates: ExportedTemplate[];
  productHistory: Array<{ name: string; timesAdded: number; lastAdded: string }>;
}

interface BuildInput {
  userId: string;
  email: string | null;
  profile: ProfileRow | null;
  lists: ListRow[];
  items: ListItemRow[];
  history: ProductHistoryRow[];
  templates: ExportedTemplate[];
}

/**
 * Da forma a la exportación a partir de lo que devuelve la base.
 *
 * Separada de la consulta para poder probarla: lo que importa aquí es qué se
 * entrega y en qué forma, no cómo se lee.
 *
 * Sale **lo que es de esta persona**, no todo lo que puede ver: los productos
 * se agrupan bajo su lista y no se incluye quién más está en ella. Una lista
 * compartida también es de los demás, y una exportación no es una excusa para
 * llevarse sus nombres.
 */
export function buildExport({
  userId,
  email,
  profile,
  lists,
  items,
  history,
  templates,
}: BuildInput): ExportedData {
  const byList = new Map<string, ListItemRow[]>();
  for (const item of items) {
    byList.set(item.list_id, [...(byList.get(item.list_id) ?? []), item]);
  }

  return {
    exportedAt: new Date().toISOString(),
    format: 2,
    account: {
      id: userId,
      email,
      displayName: profile?.display_name ?? null,
      locale: profile?.locale ?? null,
      currency: profile?.currency ?? null,
      createdAt: profile?.created_at ?? null,
    },
    lists: lists.map((list) => ({
      id: list.id,
      title: list.title,
      createdAt: list.created_at,
      updatedAt: list.updated_at,
      archivedAt: list.archived_at,
      isOwner: list.owner_id === userId,
      items: (byList.get(list.id) ?? [])
        .filter((item) => !item.deleted_at)
        .sort((a, b) => (a.sort_key < b.sort_key ? -1 : 1))
        .map((item) => ({
          name: item.name,
          qty: item.qty,
          unit: item.unit,
          note: item.note,
          category: item.category_id,
          isChecked: item.is_checked,
          createdAt: item.created_at,
        })),
    })),
    templates,
    productHistory: history.map((row) => ({
      name: row.name,
      timesAdded: row.times_added,
      lastAdded: row.last_added,
    })),
  };
}

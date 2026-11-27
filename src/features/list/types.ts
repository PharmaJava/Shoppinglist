import type { CategoryRow, ListItemRow, ListRow, ListSectionRow } from "@/lib/supabase/types";

export type ListItem = ListItemRow;
export type List = ListRow;
export type Category = CategoryRow;
export type ListSection = ListSectionRow;

export interface ListWithItems {
  list: List;
  items: ListItem[];
  /** Vacío en las listas de la compra, que se agrupan por pasillos. */
  sections: ListSection[];
}

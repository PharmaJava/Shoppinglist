import type { CategoryRow, ListItemRow, ListRow } from "@/lib/supabase/types";

export type ListItem = ListItemRow;
export type List = ListRow;
export type Category = CategoryRow;

export interface ListWithItems {
  list: List;
  items: ListItem[];
}

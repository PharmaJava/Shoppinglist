"use client";

import { useTranslations } from "next-intl";
import type { ListItem } from "@/features/list/types";
import { useDeleteItem, useToggleItem } from "@/features/list/use-list-mutations";
import { cn } from "@/lib/cn";

export function ItemRow({ listId, item }: { listId: string; item: ListItem }) {
  const t = useTranslations("list");
  const toggle = useToggleItem(listId);
  const remove = useDeleteItem(listId);

  function handleToggle() {
    if (navigator.vibrate) navigator.vibrate(15);
    toggle.mutate({ itemId: item.id, isChecked: !item.is_checked });
  }

  return (
    <li className="flex items-center border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={handleToggle}
        aria-pressed={item.is_checked}
        className="flex min-h-tap flex-1 items-center gap-3 px-4 py-2 text-left"
      >
        <span
          aria-hidden
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-full border-2",
            item.is_checked ? "border-brand bg-brand text-brand-contrast" : "border-border",
          )}
        >
          {item.is_checked && "✓"}
        </span>
        <span className="flex flex-1 flex-col">
          <span
            className={cn("text-base", item.is_checked && "text-on-surface-muted line-through")}
          >
            {item.name}
          </span>
          {(item.qty || item.unit) && (
            <span className="text-sm text-on-surface-muted">
              {item.qty} {item.unit}
            </span>
          )}
        </span>
      </button>
      <button
        type="button"
        onClick={() => remove.mutate(item.id)}
        aria-label={t("deleted")}
        className="flex size-tap shrink-0 items-center justify-center text-xl text-on-surface-muted"
      >
        ×
      </button>
    </li>
  );
}

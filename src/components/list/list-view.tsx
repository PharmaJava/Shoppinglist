"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import type { ListItem } from "@/features/list/types";
import { useCategories } from "@/features/list/use-categories";
import { useList } from "@/features/list/use-list";
import type { Locale } from "@/lib/supabase/types";
import { AddItemBar } from "./add-item-bar";
import { ItemRow } from "./item-row";
import { ListHeader } from "./list-header";

interface Group {
  categoryId: string;
  label: string;
  icon: string | null;
  items: ListItem[];
}

export function ListView({ listId }: { listId: string }) {
  const t = useTranslations("list");
  const locale = useLocale() as Locale;
  const { data, isLoading, isError } = useList(listId);
  const { data: categories } = useCategories();

  const { pending, checked } = useMemo(() => {
    const items = data?.items ?? [];
    return {
      pending: items.filter((item) => !item.is_checked),
      checked: items.filter((item) => item.is_checked),
    };
  }, [data?.items]);

  const groups = useMemo<Group[]>(() => {
    if (!categories) return [];
    const byId = new Map(categories.map((category) => [category.id, category]));
    const order = new Map(categories.map((category) => [category.id, category.sort_order]));

    const buckets = new Map<string, ListItem[]>();
    for (const item of pending) {
      const key = item.category_id ?? "other";
      const bucket = buckets.get(key) ?? [];
      bucket.push(item);
      buckets.set(key, bucket);
    }

    return [...buckets.entries()]
      .sort((a, b) => (order.get(a[0]) ?? 999) - (order.get(b[0]) ?? 999))
      .map(([categoryId, items]) => {
        const category = byId.get(categoryId);
        return {
          categoryId,
          label: category
            ? locale === "es"
              ? category.name_es
              : category.name_en
            : t("otherCategory"),
          icon: category?.icon ?? null,
          items,
        };
      });
  }, [pending, categories, locale, t]);

  if (isLoading) {
    return <p className="p-6 text-center text-on-surface-muted">{t("loading")}</p>;
  }

  if (isError || !data) {
    return <p className="p-6 text-center text-on-surface-muted">{t("empty")}</p>;
  }

  const total = pending.length + checked.length;

  return (
    <div className="flex flex-1 flex-col">
      <ListHeader listId={listId} list={data.list} checked={checked.length} total={total} />

      <div className="flex-1 overflow-y-auto pb-4">
        {total === 0 && <p className="p-6 text-center text-on-surface-muted">{t("empty")}</p>}

        {groups.map((group) => (
          <section key={group.categoryId}>
            <h2 className="sticky top-0 flex items-center gap-2 bg-surface-muted px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-on-surface-muted">
              {group.icon} {group.label}
              <span className="ml-auto tabular-nums">{group.items.length}</span>
            </h2>
            <ul>
              {group.items.map((item) => (
                <ItemRow key={item.id} listId={listId} item={item} />
              ))}
            </ul>
          </section>
        ))}

        {checked.length > 0 && (
          <section>
            <h2 className="sticky top-0 bg-surface-muted px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-on-surface-muted">
              {t("checkedSection")}
              <span className="ml-2 tabular-nums">{checked.length}</span>
            </h2>
            <ul>
              {checked.map((item) => (
                <ItemRow key={item.id} listId={listId} item={item} />
              ))}
            </ul>
          </section>
        )}
      </div>

      <AddItemBar listId={listId} />
    </div>
  );
}

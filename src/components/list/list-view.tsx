"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { setListArchived } from "@/features/list/api";
import { normalizeProductName } from "@/features/list/categorize";
import { empezarCompra, hayCompraEnCurso, terminarCompra } from "@/features/list/shopping-session";
import type { ListItem } from "@/features/list/types";
import { useCategories } from "@/features/list/use-categories";
import { useList } from "@/features/list/use-list";
import { useDeleteItem, useRestoreItem } from "@/features/list/use-list-mutations";
import { useWakeLock } from "@/features/list/use-wake-lock";
import { stockUpFromList } from "@/features/pantry/api";
import type { Locale } from "@/lib/supabase/types";
import { AddItemBar } from "./add-item-bar";
import { AutoFinishBanner } from "./auto-finish-banner";
import { BudgetBar } from "./budget-bar";
import { type AccionFinal, FinishSheet } from "./finish-sheet";
import { ItemRow } from "./item-row";
import { ListHeader } from "./list-header";
import { ShoppingBar } from "./shopping-bar";
import { SyncStatusBanner } from "./sync-status-banner";

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
  const [supermarketMode, setSupermarketMode] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [justDeleted, setJustDeleted] = useState<ListItem | null>(null);
  const restore = useRestoreItem(listId);
  const borrar = useDeleteItem(listId);

  const pantalla = useWakeLock(supermarketMode);

  // La compra sobrevive a que se apague la pantalla y la página se recargue:
  // se guarda fuera de React (ver `shopping-session`). Sin esto, volver al
  // móvil dentro del súper sacaba del modo compra sin haberlo pedido.
  useEffect(() => {
    setSupermarketMode(hayCompraEnCurso(listId));
  }, [listId]);

  const empezar = useCallback(() => {
    empezarCompra(listId);
    setSupermarketMode(true);
  }, [listId]);

  const cerrarCompra = useCallback(() => {
    terminarCompra();
    setSupermarketMode(false);
    setFinishOpen(false);
  }, []);

  // El aviso se retira solo: un borrado tiene ventana para arrepentirse, no
  // una barra permanente ocupando pantalla dentro del supermercado.
  useEffect(() => {
    if (!justDeleted) return;
    const timer = setTimeout(() => setJustDeleted(null), 6000);
    return () => clearTimeout(timer);
  }, [justDeleted]);

  const { pending, checked } = useMemo(() => {
    const items = data?.items ?? [];
    return {
      pending: items.filter((item) => !item.is_checked),
      checked: items.filter((item) => item.is_checked),
    };
  }, [data?.items]);

  // Lo que ya está en la lista no se vuelve a sugerir. Incluye lo marcado:
  // que un producto esté en el carro no lo convierte en una sugerencia útil.
  const existingNormalized = useMemo(
    () => (data?.items ?? []).map((item) => normalizeProductName(item.name)),
    [data?.items],
  );

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
      <ListHeader
        listId={listId}
        list={data.list}
        checked={checked.length}
        total={total}
        supermarketMode={supermarketMode}
      />
      <SyncStatusBanner />
      <AutoFinishBanner listId={listId} list={data.list} />
      <BudgetBar listId={listId} list={data.list} items={data.items} />

      <div className="flex-1 overflow-y-auto pb-4 print:h-auto print:overflow-visible">
        {total === 0 && <p className="p-6 text-center text-on-surface-muted">{t("empty")}</p>}

        {groups.map((group) => (
          <section key={group.categoryId}>
            <h2 className="sticky top-0 flex items-center gap-2 bg-surface-muted px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-on-surface-muted">
              {group.icon} {group.label}
              <span className="ml-auto tabular-nums">{group.items.length}</span>
            </h2>
            <ul>
              {group.items.map((item) => (
                <ItemRow
                  key={item.id}
                  listId={listId}
                  item={item}
                  large={supermarketMode}
                  currency={data.list.currency}
                  onDeleted={setJustDeleted}
                />
              ))}
            </ul>
          </section>
        ))}

        {!supermarketMode && checked.length > 0 && (
          <section>
            <h2 className="sticky top-0 bg-surface-muted px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-on-surface-muted">
              {t("checkedSection")}
              <span className="ml-2 tabular-nums">{checked.length}</span>
            </h2>
            <ul>
              {checked.map((item) => (
                <ItemRow
                  key={item.id}
                  listId={listId}
                  item={item}
                  currency={data.list.currency}
                  onDeleted={setJustDeleted}
                />
              ))}
            </ul>
          </section>
        )}
      </div>

      {justDeleted && (
        <div
          role="status"
          className="sticky bottom-0 z-10 flex items-center justify-between gap-3 border-t border-border bg-on-surface px-4 py-3 text-sm text-surface print:hidden"
        >
          <span className="truncate">{t("deleted")}</span>
          <button
            type="button"
            onClick={() => {
              restore.mutate(justDeleted);
              setJustDeleted(null);
            }}
            className="shrink-0 font-semibold text-brand-300 underline"
          >
            {t("undo")}
          </button>
        </div>
      )}

      <ShoppingBar
        activa={supermarketMode}
        pendientes={pending.length}
        marcados={checked.length}
        pantalla={pantalla}
        onEmpezar={empezar}
        onFinalizar={() => setFinishOpen(true)}
      />

      <AddItemBar listId={listId} existingNormalized={existingNormalized} />

      {finishOpen && (
        <FinishSheet
          list={data.list}
          pendientes={pending}
          marcados={checked}
          onCerrar={() => setFinishOpen(false)}
          onConfirmar={async (accion: AccionFinal) => {
            // Vaciar es un borrado lógico normal: cada producto conserva su
            // «deshacer» y se sincroniza por el outbox como cualquier otro.
            if (accion === "vaciar") {
              for (const item of checked) borrar.mutate(item);
            }
            if (accion === "archivar") {
              await setListArchived(data.list, true).catch(() => {});
            }
            // La despensa la resuelve el servidor de una vez: suma lo que ya
            // estaba en vez de duplicar líneas (ver la migración 0011).
            if (accion === "despensa") {
              await stockUpFromList(listId).catch(() => {});
            }
            cerrarCompra();
          }}
        />
      )}
    </div>
  );
}

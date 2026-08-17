"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useCurrentUserId } from "@/features/auth/use-current-user-id";
import { deleteList, setListArchived } from "@/features/list/api";
import { normalizeProductName } from "@/features/list/categorize";
import type { ListItem } from "@/features/list/types";
import { useCategories } from "@/features/list/use-categories";
import { useList } from "@/features/list/use-list";
import { useDeleteItem, useRestoreItem } from "@/features/list/use-list-mutations";
import { useWakeLock } from "@/features/list/use-wake-lock";
import { stockUpFromList } from "@/features/pantry/api";
import { Link, useRouter } from "@/i18n/navigation";
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
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useList(listId);
  const { data: categories } = useCategories();
  const usuarioId = useCurrentUserId();
  const [finishOpen, setFinishOpen] = useState(false);
  const [justDeleted, setJustDeleted] = useState<ListItem | null>(null);
  const restore = useRestoreItem(listId);
  const borrar = useDeleteItem(listId);

  /**
   * La pantalla se mantiene encendida mientras la lista esté abierta.
   *
   * Antes dependía de haber pulsado «empezar la compra»; sin ese botón, la
   * regla es la situación: quien tiene la lista abierta la está usando, y en
   * el súper con el móvil en la mano lo peor que puede pasar es que se apague
   * cada treinta segundos. El navegador retira el permiso solo al pasar la
   * pestaña a segundo plano, así que esto no se queda encendido de fondo.
   */
  const pantalla = useWakeLock(true);

  const cerrarCompra = useCallback(() => setFinishOpen(false), []);

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

  /**
   * No se puede abrir: o el enlace está mal, o es la lista de otra persona.
   *
   * Antes aquí se decía «no hay nada en esta lista», y era mentira de las que
   * hacen perder media hora: la lista existe y está llena, pero RLS no deja
   * leerla a quien no es dueño ni miembro (`lists_select`, migración 0001). El
   * caso corriente es alguien que copia la URL de la barra de direcciones y la
   * manda por WhatsApp — eso no da acceso a nadie; el que lo da es el enlace
   * del botón «Compartir», que lleva invitación.
   */
  if (isError || !data) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="font-semibold text-lg text-on-surface">{t("noAccessTitle")}</p>
        <p className="max-w-sm text-on-surface-muted text-sm">{t("noAccessBody")}</p>
        <Link
          href="/"
          className="flex h-tap items-center rounded-full bg-brand px-6 font-semibold text-brand-contrast"
        >
          {t("noAccessHome")}
        </Link>
      </div>
    );
  }

  const total = pending.length + checked.length;

  return (
    <div className="flex flex-1 flex-col">
      <ListHeader listId={listId} list={data.list} checked={checked.length} total={total} />
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
                  currency={data.list.currency}
                  onDeleted={setJustDeleted}
                />
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
        pendientes={pending.length}
        marcados={checked.length}
        pantalla={pantalla}
        onFinalizar={() => setFinishOpen(true)}
      />

      <AddItemBar listId={listId} existingNormalized={existingNormalized} />

      {finishOpen && (
        <FinishSheet
          list={data.list}
          pendientes={pending}
          marcados={checked}
          puedeBorrar={usuarioId !== null && usuarioId === data.list.owner_id}
          onCerrar={() => setFinishOpen(false)}
          onConfirmar={async (accion: AccionFinal) => {
            // Vaciar es un borrado lógico normal: cada producto conserva su
            // «deshacer» y se sincroniza por el outbox como cualquier otro.
            if (accion === "vaciar") {
              for (const item of checked) borrar.mutate(item);
            }
            // Borrar se lleva la lista entera y con ella esta pantalla, así
            // que se sale al inicio —donde se hace la siguiente— y con
            // `replace`, para que «atrás» no devuelva a una lista que ya no
            // existe. Si falla, se deja subir: la hoja enseña el motivo.
            if (accion === "borrar") {
              await deleteList(listId);
              // Sin `removeQueries`: esta pantalla todavía está montada y
              // borrar del caché una consulta activa la haría pedirse otra
              // vez, a una lista que ya no existe. Se va sola al desmontar.
              void queryClient.invalidateQueries({ queryKey: ["my-lists"] });
              router.replace("/");
              return;
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

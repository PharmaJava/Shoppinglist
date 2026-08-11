"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { normalizeProductName } from "@/features/list/categorize";
import { centsToInput, formatMoney, parsePriceToCents } from "@/features/list/money";
import type { ListItem } from "@/features/list/types";
import { useDeleteItem, useToggleItem, useUpdateItem } from "@/features/list/use-list-mutations";
import { useProductHistory } from "@/features/list/use-suggestions";
import { cn } from "@/lib/cn";

/** Unidades ofrecidas al editar. Cubren lo que se compra por peso, volumen y
 *  formato; para lo demás está «sin unidad», que es la mayoría de la cesta. */
const UNITS = ["g", "kg", "ml", "l", "paq.", "lata", "bote", "docena"] as const;

/**
 * Cuánto sube o baja cada toque de «+»/«−», según lo que se esté contando.
 *
 * Un paso de 1 sobre 500 g no sirve de nada —nadie compra 501 gramos— y uno de
 * 100 sobre unidades sueltas es absurdo. Lo que se cuenta por piezas va de una
 * en una; el peso y el volumen, en el salto con el que se compran de verdad.
 */
function stepFor(unit: string | null): number {
  if (unit === "g" || unit === "ml") return 100;
  if (unit === "kg" || unit === "l") return 0.5;
  return 1;
}

export function ItemRow({
  listId,
  item,
  large = false,
  currency = "EUR",
  onDeleted,
}: {
  listId: string;
  item: ListItem;
  large?: boolean;
  currency?: string;
  onDeleted?: (item: ListItem) => void;
}) {
  const t = useTranslations("list");
  const locale = useLocale();
  const toggle = useToggleItem(listId);
  const remove = useDeleteItem(listId);
  const update = useUpdateItem(listId);
  const [editing, setEditing] = useState(false);

  const step = stepFor(item.unit);

  function handleToggle() {
    if (navigator.vibrate) navigator.vibrate(15);
    toggle.mutate({ itemId: item.id, isChecked: !item.is_checked });
  }

  function handleDelete() {
    remove.mutate(item, { onSuccess: (deleted) => onDeleted?.(deleted) });
  }

  /**
   * Un producto sin cantidad es uno: por eso el primer «+» lleva a dos y no a
   * uno —si no, parecería que el botón no hace nada— y bajar de uno devuelve
   * al estado sin cantidad en vez de dejar un «1» que no aporta.
   */
  function changeQty(delta: number) {
    const current = item.qty ?? 1;
    const next = Math.round((current + delta * step) * 100) / 100;

    // Comparar contra el paso y no contra 1: media docena de kilos es una
    // cantidad legítima, medio tomate no.
    if (next < step) {
      update.mutate({ itemId: item.id, edits: { qty: null, unit: null } });
      return;
    }
    update.mutate({ itemId: item.id, edits: { qty: next } });
  }

  if (editing) {
    return (
      <li className="border-b border-border last:border-b-0">
        <ItemEditor
          listId={listId}
          item={item}
          currency={currency}
          onDone={() => setEditing(false)}
        />
      </li>
    );
  }

  return (
    <li className="flex items-center border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={handleToggle}
        aria-pressed={item.is_checked}
        className={cn(
          "flex min-h-tap min-w-0 flex-1 items-center gap-3 px-4 text-left",
          large ? "py-4" : "py-2",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full border-2",
            large ? "size-9" : "size-6",
            item.is_checked ? "border-brand bg-brand text-brand-contrast" : "border-border",
          )}
        >
          {item.is_checked && "✓"}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span
            className={cn(
              large ? "text-xl font-medium" : "text-base",
              item.is_checked && "text-on-surface-muted line-through",
            )}
          >
            {item.name}
          </span>
          {(item.qty !== null || item.price_cents !== null) && (
            <span className={cn("text-on-surface-muted", large ? "text-base" : "text-sm")}>
              {item.qty !== null && formatAmount(item)}
              {item.qty !== null && item.price_cents !== null && " · "}
              {item.price_cents !== null && formatMoney(item.price_cents, currency, locale)}
            </span>
          )}
        </span>
      </button>

      {/* Ajustar la cantidad sin abrir el editor: es lo que más se repite, y
          dentro del supermercado también («al final me llevo tres»). */}
      <button
        type="button"
        onClick={() => changeQty(-1)}
        disabled={item.qty === null}
        aria-label={t("decrease", { name: item.name })}
        className="flex min-h-tap w-9 shrink-0 items-center justify-center text-xl text-on-surface-muted hover:text-on-surface disabled:opacity-30 print:hidden"
      >
        −
      </button>
      <button
        type="button"
        onClick={() => changeQty(1)}
        aria-label={t("increase", { name: item.name })}
        className="flex min-h-tap w-9 shrink-0 items-center justify-center text-xl text-on-surface-muted hover:text-on-surface print:hidden"
      >
        +
      </button>

      {/* En modo supermercado se está comprando, no organizando: sólo estorba. */}
      {!large && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label={t("edit", { name: item.name })}
          className="flex size-tap shrink-0 items-center justify-center text-on-surface-muted hover:text-on-surface print:hidden"
        >
          <PencilIcon />
        </button>
      )}

      <button
        type="button"
        onClick={handleDelete}
        aria-label={t("delete", { name: item.name })}
        className="flex size-tap shrink-0 items-center justify-center text-on-surface-muted hover:text-red-600 print:hidden"
      >
        <TrashIcon />
      </button>
    </li>
  );
}

/** "2 kg" · "3" — la cantidad sin unidad son unidades sueltas, y escribir
 *  "3 uds" donde basta un 3 es ruido. */
function formatAmount(item: ListItem): string {
  return item.unit ? `${item.qty} ${item.unit}` : String(item.qty);
}

function ItemEditor({
  listId,
  item,
  currency,
  onDone,
}: {
  listId: string;
  item: ListItem;
  currency: string;
  onDone: () => void;
}) {
  const t = useTranslations("list");
  const locale = useLocale();
  const update = useUpdateItem(listId);

  const [name, setName] = useState(item.name);
  const [qty, setQty] = useState(item.qty === null ? "" : String(item.qty));
  const [unit, setUnit] = useState(item.unit ?? "");
  const [price, setPrice] = useState(() => centsToInput(item.price_cents, locale));

  // Lo que costó las veces anteriores. Se ofrece, no se rellena solo: un total
  // que aparece sin que nadie lo escriba no se puede distinguir de uno real.
  const history = useProductHistory();
  const remembered = history.data?.find(
    (entry) => entry.normalized === normalizeProductName(item.name),
  )?.avgPriceCents;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    const parsedQty = qty.trim() === "" ? null : Number.parseFloat(qty.replace(",", "."));

    update.mutate({
      itemId: item.id,
      edits: {
        name: trimmed,
        qty: parsedQty !== null && Number.isNaN(parsedQty) ? item.qty : parsedQty,
        // Sin cantidad, la unidad no significa nada: "kg" de nada no es nada.
        unit: parsedQty === null ? null : unit || null,
        priceCents: parsePriceToCents(price),
      },
    });
    onDone();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 px-4 py-3">
      <label className="sr-only" htmlFor={`name-${item.id}`}>
        {t("editName")}
      </label>
      <input
        id={`name-${item.id}`}
        value={name}
        onChange={(event) => setName(event.target.value)}
        // biome-ignore lint/a11y/noAutofocus: el foco al abrir el editor es lo que se espera al pulsar «editar», y sólo ocurre tras esa acción explícita.
        autoFocus
        className="h-tap rounded-xl border border-border bg-surface px-3 text-base text-on-surface outline-none focus:border-brand"
      />

      <div className="flex gap-2">
        <label className="sr-only" htmlFor={`qty-${item.id}`}>
          {t("editQty")}
        </label>
        <input
          id={`qty-${item.id}`}
          value={qty}
          onChange={(event) => setQty(event.target.value)}
          inputMode="decimal"
          placeholder={t("editQty")}
          className="h-tap w-24 rounded-xl border border-border bg-surface px-3 text-base text-on-surface outline-none focus:border-brand"
        />

        <label className="sr-only" htmlFor={`unit-${item.id}`}>
          {t("editUnit")}
        </label>
        <select
          id={`unit-${item.id}`}
          value={unit}
          onChange={(event) => setUnit(event.target.value)}
          className="h-tap flex-1 rounded-xl border border-border bg-surface px-3 text-base text-on-surface outline-none focus:border-brand"
        >
          <option value="">{t("unitNone")}</option>
          {UNITS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label className="sr-only" htmlFor={`price-${item.id}`}>
          {t("editPrice")}
        </label>
        <input
          id={`price-${item.id}`}
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          inputMode="decimal"
          placeholder={t("editPrice")}
          className="h-tap w-28 rounded-xl border border-border bg-surface px-3 text-base text-on-surface outline-none focus:border-brand"
        />
        {remembered != null && price.trim() === "" ? (
          <button
            type="button"
            onClick={() => setPrice(centsToInput(remembered, locale))}
            className="text-left font-medium text-brand text-xs underline"
          >
            {t("editPriceRemembered", { amount: formatMoney(remembered, currency, locale) })}
          </button>
        ) : (
          /* El precio es de la línea entera, no por unidad: con "500 g" un
             precio por unidad no significaría nada. */
          <p className="text-on-surface-muted text-xs">{t("editPriceHint", { currency })}</p>
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!name.trim()}
          className="h-tap flex-1 rounded-xl bg-brand font-semibold text-brand-contrast disabled:opacity-50"
        >
          {t("editSave")}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="h-tap flex-1 rounded-xl border border-border font-semibold text-on-surface"
        >
          {t("editCancel")}
        </button>
      </div>
    </form>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="size-5" aria-hidden="true">
      <path d="M13.6 2.4a1.4 1.4 0 0 1 2 0l2 2a1.4 1.4 0 0 1 0 2l-9.2 9.2-3.6.8.8-3.6 9.2-9.2Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="size-5" aria-hidden="true">
      <path d="M7.5 2h5l.5 1.5H17V5H3V3.5h4L7.5 2ZM4.5 6.5h11l-.8 10.1A1.5 1.5 0 0 1 13.2 18H6.8a1.5 1.5 0 0 1-1.5-1.4L4.5 6.5Z" />
    </svg>
  );
}

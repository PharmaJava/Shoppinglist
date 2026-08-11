"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type { ListItem } from "@/features/list/types";
import { useDeleteItem, useToggleItem, useUpdateItem } from "@/features/list/use-list-mutations";
import { cn } from "@/lib/cn";

/** Unidades ofrecidas al editar. Cubren lo que se compra por peso, volumen y
 *  formato; para lo demás está «sin unidad», que es la mayoría de la cesta. */
const UNITS = ["g", "kg", "ml", "l", "paq.", "lata", "bote", "docena"] as const;

export function ItemRow({
  listId,
  item,
  large = false,
  onDeleted,
}: {
  listId: string;
  item: ListItem;
  large?: boolean;
  onDeleted?: (item: ListItem) => void;
}) {
  const t = useTranslations("list");
  const toggle = useToggleItem(listId);
  const remove = useDeleteItem(listId);
  const [editing, setEditing] = useState(false);

  function handleToggle() {
    if (navigator.vibrate) navigator.vibrate(15);
    toggle.mutate({ itemId: item.id, isChecked: !item.is_checked });
  }

  function handleDelete() {
    remove.mutate(item, { onSuccess: (deleted) => onDeleted?.(deleted) });
  }

  if (editing) {
    return (
      <li className="border-b border-border last:border-b-0">
        <ItemEditor listId={listId} item={item} onDone={() => setEditing(false)} />
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
          "flex min-h-tap flex-1 items-center gap-3 px-4 text-left",
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
        <span className="flex flex-1 flex-col">
          <span
            className={cn(
              large ? "text-xl font-medium" : "text-base",
              item.is_checked && "text-on-surface-muted line-through",
            )}
          >
            {item.name}
          </span>
          {item.qty !== null && (
            <span className={cn("text-on-surface-muted", large ? "text-base" : "text-sm")}>
              {formatAmount(item)}
            </span>
          )}
        </span>
      </button>

      {/* En modo supermercado se está comprando, no organizando: sólo estorba. */}
      {!large && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label={t("edit", { name: item.name })}
          className="flex size-tap shrink-0 items-center justify-center text-on-surface-muted hover:text-on-surface"
        >
          <PencilIcon />
        </button>
      )}

      <button
        type="button"
        onClick={handleDelete}
        aria-label={t("delete", { name: item.name })}
        className="flex size-tap shrink-0 items-center justify-center text-on-surface-muted hover:text-red-600"
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
  onDone,
}: {
  listId: string;
  item: ListItem;
  onDone: () => void;
}) {
  const t = useTranslations("list");
  const update = useUpdateItem(listId);

  const [name, setName] = useState(item.name);
  const [qty, setQty] = useState(item.qty === null ? "" : String(item.qty));
  const [unit, setUnit] = useState(item.unit ?? "");

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

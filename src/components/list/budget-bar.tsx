"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { setListBudget } from "@/features/list/api";
import { centsToInput, computeTotals, formatMoney, parsePriceToCents } from "@/features/list/money";
import type { List, ListItem, ListWithItems } from "@/features/list/types";
import { cn } from "@/lib/cn";

/**
 * Cuánto llevas y cuánto te queda.
 *
 * Sólo aparece cuando hay algún precio puesto: quien no use precios no tiene
 * por qué ver una franja vacía ocupando la parte alta de su lista.
 */
export function BudgetBar({
  listId,
  list,
  items,
}: {
  listId: string;
  list: List;
  items: ListItem[];
}) {
  const t = useTranslations("list");
  const locale = useLocale();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);

  const { totalCents, checkedCents, missingPrices } = computeTotals(items);
  const budget = list.budget_cents;

  if (totalCents === 0 && budget === null) return null;

  const money = (cents: number) => formatMoney(cents, list.currency, locale);
  const over = budget !== null && totalCents > budget;
  const percent = budget === null || budget === 0 ? 0 : Math.min(100, (totalCents / budget) * 100);

  async function saveBudget(cents: number | null) {
    setEditing(false);
    const updated = await setListBudget(list, cents);
    queryClient.setQueryData<ListWithItems>(["list", listId], (current) =>
      current ? { ...current, list: updated } : current,
    );
  }

  return (
    <section
      aria-label={t("budgetTotal")}
      className="flex flex-col gap-1.5 border-b border-border bg-surface px-4 py-2"
    >
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="font-semibold text-lg text-on-surface tabular-nums">
          {money(totalCents)}
        </span>
        {budget !== null && (
          <span className="text-on-surface-muted text-sm">
            {t("budgetOf", { budget: money(budget) })}
          </span>
        )}
        <span
          className={cn(
            "ml-auto text-sm tabular-nums",
            over ? "font-semibold text-red-600" : "text-on-surface-muted",
          )}
        >
          {budget !== null &&
            (over
              ? t("budgetOver", { amount: money(totalCents - budget) })
              : t("budgetLeft", { amount: money(budget - totalCents) }))}
          {budget === null &&
            checkedCents > 0 &&
            t("budgetInCart", { amount: money(checkedCents) })}
        </span>
      </div>

      {budget !== null && (
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-surface-muted"
          role="progressbar"
          aria-valuenow={Math.round(percent)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={cn("h-full rounded-full", over ? "bg-red-600" : "bg-brand")}
            style={{ width: `${over ? 100 : percent}%` }}
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-3 text-xs text-on-surface-muted print:hidden">
        {/* El total es un mínimo mientras falten precios, y decirlo evita que
            parezca que la cuenta está mal. */}
        {missingPrices > 0 && <span>{t("budgetMissing", { count: missingPrices })}</span>}
        {editing ? (
          <BudgetForm
            initial={centsToInput(budget, locale)}
            onSave={saveBudget}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="ml-auto font-medium text-brand underline"
          >
            {budget === null ? t("budgetSet") : t("budgetEdit")}
          </button>
        )}
      </div>
    </section>
  );
}

function BudgetForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: string;
  onSave: (cents: number | null) => void;
  onCancel: () => void;
}) {
  const t = useTranslations("list");
  const [value, setValue] = useState(initial);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSave(parsePriceToCents(value));
      }}
      className="ml-auto flex items-center gap-2"
    >
      <label className="sr-only" htmlFor="budget-input">
        {t("budgetPlaceholder")}
      </label>
      <input
        id="budget-input"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        inputMode="decimal"
        placeholder={t("budgetPlaceholder")}
        // biome-ignore lint/a11y/noAutofocus: el campo se abre al pulsar «poner presupuesto», que es justo pedir escribirlo.
        autoFocus
        className="h-9 w-24 rounded-lg border border-border bg-surface px-2 text-base text-on-surface outline-none focus:border-brand"
      />
      <button type="submit" className="font-medium text-brand underline">
        {t("budgetSave")}
      </button>
      <button type="button" onClick={onCancel} className="underline">
        {t("budgetCancel")}
      </button>
    </form>
  );
}

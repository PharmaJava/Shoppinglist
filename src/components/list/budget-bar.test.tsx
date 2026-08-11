import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { List, ListItem } from "@/features/list/types";
import messages from "@/i18n/messages/es.json";
import { BudgetBar } from "./budget-bar";

const setListBudget = vi.fn(async (list: List, cents: number | null) => ({
  ...list,
  budget_cents: cents,
}));

vi.mock("@/features/list/api", () => ({
  setListBudget: (list: List, cents: number | null) => setListBudget(list, cents),
}));

const list: List = {
  id: "list-1",
  owner_id: "user-1",
  title: "Compra del sábado",
  emoji: null,
  currency: "EUR",
  budget_cents: null,
  archived_at: null,
  created_at: "2026-08-01T00:00:00.000Z",
  updated_at: "2026-08-10T00:00:00.000Z",
};

function item(price: number | null, isChecked = false): ListItem {
  return {
    id: crypto.randomUUID(),
    list_id: "list-1",
    name: "Producto",
    qty: null,
    unit: null,
    note: null,
    category_id: null,
    price_cents: price,
    is_checked: isChecked,
    checked_by: null,
    checked_at: null,
    assigned_to: null,
    sort_key: "a0",
    created_by: null,
    created_at: "2026-08-10T00:00:00.000Z",
    updated_at: "2026-08-10T00:00:00.000Z",
    deleted_at: null,
  };
}

function renderBar(items: ListItem[], budgetCents: number | null = null) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <QueryClientProvider client={client}>
        <BudgetBar listId="list-1" list={{ ...list, budget_cents: budgetCents }} items={items} />
      </QueryClientProvider>
    </NextIntlClientProvider>,
  );
}

/** El euro va precedido de un espacio duro; para comparar da igual cuál sea. */
function texto(): string {
  return (document.body.textContent ?? "").replace(/ /g, " ");
}

beforeEach(() => setListBudget.mockClear());
afterEach(cleanup);

describe("BudgetBar", () => {
  // Quien no use precios no tiene por qué ver una franja vacía comiéndose la
  // parte alta de su lista.
  it("no aparece si no hay ni precios ni presupuesto", () => {
    const { container } = renderBar([item(null), item(null)]);

    expect(container).toBeEmptyDOMElement();
  });

  it("suma lo que tiene precio", () => {
    renderBar([item(1240), item(360)]);

    expect(texto()).toContain("16,00 €");
  });

  it("dice cuánto queda del presupuesto", () => {
    renderBar([item(1500)], 5000);

    expect(texto()).toContain("Te quedan 35,00 €");
  });

  it("avisa de por cuánto te pasas", () => {
    renderBar([item(6000)], 5000);

    expect(texto()).toContain("Te pasas 10,00 €");
  });

  // El total es un mínimo mientras falten precios: decirlo evita que parezca
  // que la cuenta está mal.
  it("cuenta los productos sin precio", () => {
    renderBar([item(1000), item(null), item(null)]);

    expect(texto()).toContain("2 productos sin precio");
  });

  it("sin presupuesto, enseña lo que ya está en el carro", () => {
    renderBar([item(1000, true), item(500)]);

    expect(texto()).toContain("10,00 € ya en el carro");
  });

  it("guarda el presupuesto escrito con coma", async () => {
    renderBar([item(1000)]);

    await userEvent.click(screen.getByRole("button", { name: "Poner presupuesto" }));
    await userEvent.type(screen.getByLabelText("Presupuesto"), "62,50");
    await userEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(setListBudget).toHaveBeenCalled());
    expect(setListBudget.mock.calls[0]?.[1]).toBe(6250);
  });

  // Dejar el campo en blanco es la forma de quitarlo, igual que con el precio
  // de un producto.
  it("vaciar el campo quita el presupuesto", async () => {
    renderBar([item(1000)], 5000);

    await userEvent.click(screen.getByRole("button", { name: "Cambiar presupuesto" }));
    await userEvent.clear(screen.getByLabelText("Presupuesto"));
    await userEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(setListBudget).toHaveBeenCalled());
    expect(setListBudget.mock.calls[0]?.[1]).toBeNull();
  });
});

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ListItem } from "@/features/list/types";
import messages from "@/i18n/messages/es.json";
import { ItemRow } from "./item-row";

// Se sustituye la capa de datos entera: lo que se comprueba aquí es que la
// fila ofrece borrar y editar, y con qué valores llama — no si Supabase
// responde.
const updateItem = vi.fn(async (item, edits) => ({ ...item, ...edits }));
const deleteItem = vi.fn(async () => undefined);

vi.mock("@/features/list/api", () => ({
  updateItem: (item: ListItem, edits: unknown) => updateItem(item, edits),
  deleteItem: () => deleteItem(),
  toggleItem: vi.fn(),
  restoreItem: vi.fn(),
  addItem: vi.fn(),
  addParsedItems: vi.fn(),
}));

const item: ListItem = {
  id: "item-1",
  list_id: "list-1",
  name: "Carne picada",
  qty: null,
  unit: null,
  note: null,
  category_id: "meat",
  price_cents: null,
  is_checked: false,
  checked_by: null,
  checked_at: null,
  assigned_to: null,
  sort_key: "a0",
  created_by: null,
  created_at: "2026-08-10T00:00:00.000Z",
  updated_at: "2026-08-10T00:00:00.000Z",
  deleted_at: null,
};

function renderRow(node: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(["list", "list-1"], { list: { id: "list-1" }, items: [item] });

  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <QueryClientProvider client={client}>
        <ul>{node}</ul>
      </QueryClientProvider>
    </NextIntlClientProvider>,
  );
}

beforeEach(() => {
  updateItem.mockClear();
  deleteItem.mockClear();
});

// Sin `globals` en la configuración de Vitest, Testing Library no limpia sola
// y las filas de un test se cuelan en el siguiente.
afterEach(cleanup);

describe("ItemRow", () => {
  // El botón existía pero se anunciaba como «Producto eliminado», que es el
  // aviso posterior y no la acción: quedaba irreconocible.
  it("ofrece borrar el producto nombrándolo", async () => {
    const onDeleted = vi.fn();
    renderRow(<ItemRow listId="list-1" item={item} onDeleted={onDeleted} />);

    await userEvent.click(screen.getByRole("button", { name: "Eliminar Carne picada" }));

    await waitFor(() => expect(deleteItem).toHaveBeenCalled());
    expect(onDeleted).toHaveBeenCalledWith(expect.objectContaining({ id: "item-1" }));
  });

  it("permite poner peso y unidad a un producto ya añadido", async () => {
    renderRow(<ItemRow listId="list-1" item={item} />);

    await userEvent.click(screen.getByRole("button", { name: "Editar Carne picada" }));
    await userEvent.type(screen.getByLabelText("Cantidad"), "500");
    await userEvent.selectOptions(screen.getByLabelText("Unidad"), "g");
    await userEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(updateItem).toHaveBeenCalled());
    expect(updateItem.mock.calls[0]?.[1]).toEqual({
      name: "Carne picada",
      qty: 500,
      unit: "g",
    });
  });

  it("una unidad sin cantidad no se guarda, porque no significa nada", async () => {
    renderRow(<ItemRow listId="list-1" item={item} />);

    await userEvent.click(screen.getByRole("button", { name: "Editar Carne picada" }));
    await userEvent.selectOptions(screen.getByLabelText("Unidad"), "kg");
    await userEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(updateItem).toHaveBeenCalled());
    expect(updateItem.mock.calls[0]?.[1]).toEqual({
      name: "Carne picada",
      qty: null,
      unit: null,
    });
  });

  // En modo supermercado se está comprando: editar sólo estorba, borrar no.
  it("esconde la edición en modo supermercado pero conserva el borrado", () => {
    renderRow(<ItemRow listId="list-1" item={item} large />);

    expect(screen.queryByRole("button", { name: "Editar Carne picada" })).toBeNull();
    expect(screen.getByRole("button", { name: "Eliminar Carne picada" })).toBeInTheDocument();
  });
});

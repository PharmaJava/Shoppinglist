import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ParsedVoiceItem } from "@/features/list/parse-voice";
import messages from "@/i18n/messages/es.json";
import { AddItemBar } from "./add-item-bar";

const addParsedItems = vi.fn(async (_items: ParsedVoiceItem[]) => []);

vi.mock("@/features/list/api", () => ({
  addParsedItems: (_listId: string, items: ParsedVoiceItem[]) => addParsedItems(items),
  addItem: vi.fn(),
  toggleItem: vi.fn(),
  updateItem: vi.fn(),
  deleteItem: vi.fn(),
  restoreItem: vi.fn(),
}));

// Las dos fuentes de sugerencias, sin red: una es el historial de esta
// persona y la otra el catálogo del idioma.
vi.mock("@/features/list/history", () => ({
  fetchProductHistory: async () => [
    { name: "Leche desnatada", normalized: "leche desnatada", categoryId: "dairy", timesAdded: 9 },
  ],
  recordProductsAdded: vi.fn(),
}));

/**
 * El botón de escanear pregunta el plan, y ese módulo arrastra el cliente de
 * Supabase, que exige sus variables de entorno nada más cargarse. Aquí no se
 * prueba el plan —eso es de `scan-add-button`—, sólo la barra de añadir.
 */
vi.mock("@/features/billing/plan", () => ({ fetchPlan: async () => "free" }));
vi.mock("@/features/barcode/api", () => ({
  reconocerCodigo: vi.fn(),
  recordarCodigo: vi.fn(),
}));

vi.mock("@/features/list/catalog", () => ({
  loadProductCatalog: async () => [
    { name: "Lechuga", normalized: "lechuga", categoryId: "produce" },
    { name: "Pan", normalized: "pan", categoryId: "bakery" },
  ],
}));

function renderBar(existing: string[] = []) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(["list", "list-1"], { list: { id: "list-1" }, items: [] });

  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <QueryClientProvider client={client}>
        <AddItemBar listId="list-1" existingNormalized={existing} />
      </QueryClientProvider>
    </NextIntlClientProvider>,
  );
}

beforeEach(() => addParsedItems.mockClear());
afterEach(cleanup);

describe("AddItemBar", () => {
  it("al enfocar sin escribir ofrece lo que se suele comprar", async () => {
    renderBar();

    await userEvent.click(screen.getByPlaceholderText(messages.list.addPlaceholder));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Leche desnatada" })).toBeInTheDocument(),
    );
  });

  it("al escribir sugiere del historial y del catálogo", async () => {
    renderBar();

    await userEvent.type(screen.getByPlaceholderText(messages.list.addPlaceholder), "lech");

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Lechuga" })).toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: "Leche desnatada" })).toBeInTheDocument();
  });

  it("tocar una sugerencia la añade y vacía el campo", async () => {
    renderBar();
    const input = screen.getByPlaceholderText(messages.list.addPlaceholder);

    await userEvent.type(input, "lech");
    await waitFor(() => screen.getByRole("button", { name: "Lechuga" }));
    await userEvent.click(screen.getByRole("button", { name: "Lechuga" }));

    await waitFor(() => expect(addParsedItems).toHaveBeenCalled());
    expect(addParsedItems.mock.calls[0]?.[0]).toEqual([{ name: "Lechuga", qty: null, unit: null }]);
    expect(input).toHaveValue("");
  });

  it("no sugiere lo que ya está en la lista", async () => {
    renderBar(["lechuga"]);

    await userEvent.type(screen.getByPlaceholderText(messages.list.addPlaceholder), "lech");

    await waitFor(() => screen.getByRole("button", { name: "Leche desnatada" }));
    expect(screen.queryByRole("button", { name: "Lechuga" })).toBeNull();
  });

  it("escribir varios productos con cantidades sigue funcionando", async () => {
    renderBar();

    await userEvent.type(
      screen.getByPlaceholderText(messages.list.addPlaceholder),
      "carne picada 500 g, tomates x3{Enter}",
    );

    await waitFor(() => expect(addParsedItems).toHaveBeenCalled());
    expect(addParsedItems.mock.calls[0]?.[0]).toEqual([
      { name: "Carne picada", qty: 500, unit: "g" },
      { name: "Tomates", qty: 3, unit: null },
    ]);
  });
});

describe("AddItemBar · pegar una lista", () => {
  // El caso real: una lista escrita en las notas del móvil, un producto por
  // línea. Un `<input>` se come los saltos, así que se convierten en comas.
  it("una lista de varias líneas se convierte en productos separados", async () => {
    renderBar();
    const input = screen.getByPlaceholderText(messages.list.addPlaceholder);

    input.focus();
    await userEvent.paste("Agua\n Gazpacho \nHuevos 24\nAgua");
    await userEvent.click(screen.getByRole("button", { name: messages.list.add }));

    await waitFor(() => expect(addParsedItems).toHaveBeenCalled());
    expect(addParsedItems.mock.calls[0]?.[0]).toEqual([
      { name: "Agua", qty: null, unit: null },
      { name: "Gazpacho", qty: null, unit: null },
      { name: "Huevos", qty: 24, unit: null },
    ]);
  });

  it("pegar una sola línea sigue funcionando como siempre", async () => {
    renderBar();
    const input = screen.getByPlaceholderText(messages.list.addPlaceholder);

    input.focus();
    await userEvent.paste("Pan de molde");

    expect(input).toHaveValue("Pan de molde");
  });
});

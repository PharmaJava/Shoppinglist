import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PantryItem } from "@/features/pantry/api";
import messages from "@/i18n/messages/es.json";
import { PantryClient } from "./pantry-client";

const fetchPantry = vi.fn<() => Promise<PantryItem[]>>();
const addToPantry = vi.fn(async (_p: unknown) => {});
const removeFromPantry = vi.fn(async (_id: string) => {});
const updatePantryItem = vi.fn(async (_id: string, _c: unknown) => {});

vi.mock("@/features/pantry/api", () => ({
  fetchPantry: () => fetchPantry(),
  addToPantry: (p: unknown) => addToPantry(p),
  removeFromPantry: (id: string) => removeFromPantry(id),
  updatePantryItem: (id: string, c: unknown) => updatePantryItem(id, c),
}));

vi.mock("@/features/list/use-categories", () => ({ useCategories: () => ({ data: [] }) }));

function item(parcial: Partial<PantryItem> & { name: string }): PantryItem {
  return {
    id: parcial.name,
    name: parcial.name,
    qty: parcial.qty ?? null,
    unit: parcial.unit ?? null,
    categoryId: parcial.categoryId ?? null,
    expiresOn: parcial.expiresOn ?? null,
  };
}

function montar() {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <PantryClient />
    </NextIntlClientProvider>,
  );
}

beforeEach(() => {
  vi.setSystemTime(new Date(2026, 7, 15));
  fetchPantry.mockResolvedValue([]);
  addToPantry.mockClear();
  removeFromPantry.mockClear();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("PantryClient", () => {
  it("con la despensa vacía dice cómo llenarla", async () => {
    montar();

    expect(await screen.findByText(messages.pantry.emptyTitle)).toBeInTheDocument();
    expect(screen.getByText(messages.pantry.emptyBody)).toBeInTheDocument();
  });

  /**
   * Reutiliza el parser de la barra de añadir de una lista: escribir «2 litros
   * de leche» tiene que dar cantidad y unidad, no un producto que se llama así.
   */
  it("«2 litros de leche» entra con cantidad y unidad", async () => {
    montar();
    await screen.findByText(messages.pantry.emptyTitle);

    await userEvent.type(screen.getByLabelText("Producto"), "2 litros de leche");
    await userEvent.click(screen.getByRole("button", { name: "Añadir" }));

    // El parser conserva la unidad tal cual se dijo («litros», no «l») y
    // capitaliza el nombre: es lo mismo que acaba en una lista, y la despensa
    // no tiene por qué escribirlo distinto.
    await waitFor(() =>
      expect(addToPantry).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Leche", qty: 2, unit: "litros", categoryId: "dairy" }),
      ),
    );
  });

  it("enseña lo caducado primero y con su etiqueta", async () => {
    fetchPantry.mockResolvedValue([
      item({ name: "Arroz" }),
      item({ name: "Yogur", expiresOn: "2026-08-16" }),
      item({ name: "Lechuga", expiresOn: "2026-08-10" }),
    ]);
    montar();

    // El orden se comprueba por el botón de quitar de cada fila, que lleva el
    // nombre en su etiqueta: el texto de la fila entera mezcla nombre, estado
    // y botones, y una aserción sobre eso se rompe al tocar cualquier cosa.
    await screen.findByText("Arroz");
    const quitar = screen.getAllByRole("button", { name: /Quitar .* de la despensa/ });
    expect(quitar.map((b) => b.getAttribute("aria-label"))).toEqual([
      "Quitar Lechuga de la despensa",
      "Quitar Yogur de la despensa",
      "Quitar Arroz de la despensa",
    ]);
    expect(screen.getByText("Caducado")).toBeInTheDocument();
    expect(screen.getByText("Sin caducidad")).toBeInTheDocument();
  });

  // El aviso de arriba es la razón de ser de la despensa: si no dijera nada,
  // habría que ir leyendo fechas una a una.
  it("avisa de cuántos productos hay que mirar hoy", async () => {
    fetchPantry.mockResolvedValue([
      item({ name: "Lechuga", expiresOn: "2026-08-10" }),
      item({ name: "Yogur", expiresOn: "2026-08-15" }),
      item({ name: "Atún", expiresOn: "2026-12-01" }),
    ]);
    montar();

    expect(await screen.findByText("Hay 2 productos que mirar hoy")).toBeInTheDocument();
  });

  it("sin nada urgente no da la matraca", async () => {
    fetchPantry.mockResolvedValue([item({ name: "Atún", expiresOn: "2026-12-01" })]);
    montar();

    await screen.findByText("Atún");
    expect(screen.queryByText(/que mirar hoy/)).not.toBeInTheDocument();
  });

  it("quitar un producto lo saca de la lista", async () => {
    fetchPantry.mockResolvedValue([item({ name: "Arroz" })]);
    montar();
    await screen.findByText("Arroz");

    await userEvent.click(screen.getByRole("button", { name: "Quitar Arroz de la despensa" }));

    await waitFor(() => expect(removeFromPantry).toHaveBeenCalledWith("Arroz"));
    expect(screen.queryByText("Arroz")).not.toBeInTheDocument();
  });

  it("si falla la carga lo dice en vez de quedarse en blanco", async () => {
    fetchPantry.mockRejectedValue(new Error("permission denied"));
    montar();

    expect(await screen.findByRole("alert")).toHaveTextContent("permission denied");
  });
});

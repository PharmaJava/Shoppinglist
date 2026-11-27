import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ParsedVoiceItem } from "@/features/list/parse-voice";
import type { ListItem, ListSection } from "@/features/list/types";
import messages from "@/i18n/messages/es.json";
import { AddItemBar } from "./add-item-bar";
import { PackingBar, PackingSections } from "./packing-sections";

const api = vi.hoisted(() => ({
  addParsedItems: vi.fn(
    async (_listId: string, _items: ParsedVoiceItem[], _l: string, _k: unknown, _s: unknown) => [],
  ),
  addSection: vi.fn(async (listId: string, name: string) => ({
    id: `nueva-${name}`,
    list_id: listId,
    name,
    sort_key: "z",
    created_by: null,
    created_at: "",
    updated_at: "",
    deleted_at: null,
  })),
  renameSection: vi.fn(async (section: ListSection, name: string) => ({ ...section, name })),
  deleteSection: vi.fn(async () => {}),
}));

vi.mock("@/features/list/api", () => ({
  addParsedItems: api.addParsedItems,
  addSection: api.addSection,
  renameSection: api.renameSection,
  deleteSection: api.deleteSection,
  addItem: vi.fn(),
  toggleItem: vi.fn(),
  updateItem: vi.fn(),
  deleteItem: vi.fn(),
  restoreItem: vi.fn(),
}));
vi.mock("@/features/list/history", () => ({
  fetchProductHistory: async () => [],
  recordProductsAdded: vi.fn(),
}));
vi.mock("@/features/billing/plan", () => ({ fetchPlan: async () => "free" }));
vi.mock("@/features/barcode/api", () => ({ reconocerCodigo: vi.fn(), recordarCodigo: vi.fn() }));
vi.mock("@/features/list/catalog", () => ({ loadProductCatalog: async () => [] }));

function seccion(id: string, name: string): ListSection {
  return {
    id,
    list_id: "list-1",
    name,
    sort_key: id,
    created_by: null,
    created_at: "",
    updated_at: "",
    deleted_at: null,
  };
}

function producto(id: string, name: string, sectionId: string | null, isChecked = false): ListItem {
  return {
    id,
    list_id: "list-1",
    name,
    qty: null,
    unit: null,
    note: null,
    category_id: null,
    price_cents: 250,
    is_checked: isChecked,
    checked_by: null,
    checked_at: null,
    assigned_to: null,
    sort_key: id,
    created_by: null,
    created_at: "",
    updated_at: "",
    deleted_at: null,
    section_id: sectionId,
  };
}

const MOCHILA = seccion("s1", "Mochila niños");
const MALETA = seccion("s2", "Maleta Dani");

function montar(ui: React.ReactNode, sections: ListSection[] = [MOCHILA, MALETA]) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(["list", "list-1"], { list: { id: "list-1" }, items: [], sections });
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <QueryClientProvider client={client}>{ui}</QueryClientProvider>
    </NextIntlClientProvider>,
  );
}

/** La barra con su estado de verdad: elegir sección cambia a dónde va lo nuevo. */
function BarraConEstado({ sections }: { sections: ListSection[] }) {
  const [destino, setDestino] = useState<string | null>(sections.at(-1)?.id ?? null);
  return (
    <AddItemBar
      listId="list-1"
      existingNormalized={[]}
      packing={{ sections, targetId: destino, onTarget: setDestino }}
    />
  );
}

beforeEach(() => {
  for (const fn of Object.values(api)) fn.mockClear();
});
afterEach(cleanup);

describe("Barra de añadir en una lista de equipaje", () => {
  it("enseña las secciones y por defecto añade a la última", async () => {
    montar(<BarraConEstado sections={[MOCHILA, MALETA]} />);

    expect(screen.getByRole("button", { name: "Maleta Dani" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await userEvent.type(screen.getByPlaceholderText("Añadir a Maleta Dani…"), "cargador{Enter}");

    await waitFor(() => expect(api.addParsedItems).toHaveBeenCalled());
    expect(api.addParsedItems.mock.calls[0]?.[4]).toBe("s2");
  });

  it("al elegir otra sección, lo que se escribe va a esa", async () => {
    montar(<BarraConEstado sections={[MOCHILA, MALETA]} />);

    await userEvent.click(screen.getByRole("button", { name: "Mochila niños" }));
    await userEvent.type(
      screen.getByPlaceholderText("Añadir a Mochila niños…"),
      "botella agua, cuaderno{Enter}",
    );

    await waitFor(() => expect(api.addParsedItems).toHaveBeenCalled());
    const [, items, , , seccionId] = api.addParsedItems.mock.calls[0] ?? [];
    expect(seccionId).toBe("s1");
    expect(items?.map((item) => item.name)).toHaveLength(2);
  });

  /** El mismo campo sirve para nombrar la sección: un segundo campo no cabe. */
  it("«+ Sección» usa el campo para el nombre y la pone detrás de la última", async () => {
    montar(<BarraConEstado sections={[MOCHILA]} />, [MOCHILA]);

    await userEvent.click(screen.getByRole("button", { name: "+ Sección" }));
    await userEvent.type(screen.getByPlaceholderText(/Nombre de la sección/), "Neceser{Enter}");

    await waitFor(() => expect(api.addSection).toHaveBeenCalledWith("list-1", "Neceser", "s1"));
    expect(api.addParsedItems).not.toHaveBeenCalled();
  });

  it("con Escape se deja de nombrar la sección sin crear nada", async () => {
    montar(<BarraConEstado sections={[MOCHILA]} />);

    await userEvent.click(screen.getByRole("button", { name: "+ Sección" }));
    await userEvent.type(screen.getByPlaceholderText(/Nombre de la sección/), "Algo{Escape}");

    expect(api.addSection).not.toHaveBeenCalled();
    expect(screen.getByPlaceholderText("Añadir a Mochila niños…")).toBeInTheDocument();
  });

  it("no ofrece escanear códigos de barras: en una maleta no hay envases", () => {
    montar(<BarraConEstado sections={[MOCHILA]} />);

    expect(screen.queryByRole("button", { name: /escanear/i })).not.toBeInTheDocument();
  });
});

describe("Secciones de una lista de equipaje", () => {
  function secciones(items: ListItem[], onAddHere = vi.fn()) {
    montar(
      <PackingSections
        listId="list-1"
        sections={[MOCHILA, MALETA]}
        items={items}
        onDeleted={vi.fn()}
        onAddHere={onAddHere}
      />,
    );
    return { onAddHere };
  }

  it("cada cosa va en su sección, con su cuenta", () => {
    secciones([
      producto("p1", "Botella de agua", "s1", true),
      producto("p2", "Cuaderno", "s1"),
      producto("p3", "Cargador", "s2"),
    ]);

    const mochila = screen.getByRole("region", { name: "Mochila niños" });
    expect(within(mochila).getByText("Botella de agua")).toBeInTheDocument();
    expect(within(mochila).getByText("Cuaderno")).toBeInTheDocument();
    expect(within(mochila).getByText("1/2")).toBeInTheDocument();

    const maleta = screen.getByRole("region", { name: "Maleta Dani" });
    expect(within(maleta).getByText("Cargador")).toBeInTheDocument();
    expect(within(maleta).getByText("0/1")).toBeInTheDocument();
  });

  /** En la compra lo comprado se va abajo; aquí se queda en su sección. */
  it("lo ya metido se queda en su sección, debajo de lo que falta", () => {
    secciones([producto("p1", "Botella", "s1", true), producto("p2", "Cuaderno", "s1")]);

    const filas = within(screen.getByRole("region", { name: "Mochila niños" })).getAllByRole(
      "listitem",
    );
    expect(filas.map((fila) => fila.textContent)).toEqual([
      expect.stringContaining("Cuaderno"),
      expect.stringContaining("Botella"),
    ]);
  });

  it("no enseña precios: en una maleta no se compra nada", () => {
    secciones([producto("p1", "Botella", "s1")]);

    expect(screen.queryByText(/2,50/)).not.toBeInTheDocument();
  });

  it("lo que no tiene sección no se esconde", () => {
    secciones([producto("p1", "Gafas", null)]);

    expect(
      within(screen.getByRole("region", { name: "Sin sección" })).getByText("Gafas"),
    ).toBeInTheDocument();
  });

  it("una sección vacía dice cómo llenarla", () => {
    secciones([]);

    expect(screen.getAllByText("Vacía. Pulsa + para añadir cosas.")).toHaveLength(2);
  });

  it("el + de una sección la elige para añadir", async () => {
    const { onAddHere } = secciones([]);

    await userEvent.click(screen.getByRole("button", { name: "Añadir a Maleta Dani" }));

    expect(onAddHere).toHaveBeenCalledWith("s2");
  });

  it("renombrar es escribir en el título y salir", async () => {
    secciones([]);
    const titulo = screen.getByRole("textbox", { name: "Renombrar la sección Maleta Dani" });

    await userEvent.clear(titulo);
    await userEvent.type(titulo, "Maleta de Dani{Enter}");

    await waitFor(() => expect(api.renameSection).toHaveBeenCalledWith(MALETA, "Maleta de Dani"));
  });

  it("un título vacío no se guarda: vuelve el que tenía", async () => {
    secciones([]);
    const titulo = screen.getByRole("textbox", { name: "Renombrar la sección Maleta Dani" });

    await userEvent.clear(titulo);
    await userEvent.tab();

    expect(api.renameSection).not.toHaveBeenCalled();
    expect(titulo).toHaveValue("Maleta Dani");
  });

  it("borrar pide confirmación antes de nada", async () => {
    secciones([producto("p3", "Cargador", "s2")]);

    await userEvent.click(screen.getByRole("button", { name: "Borrar la sección Maleta Dani" }));
    expect(api.deleteSection).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Borrar" }));
    await waitFor(() => expect(api.deleteSection).toHaveBeenCalled());
  });

  it("sin secciones ni nada, explica cómo empezar", () => {
    montar(
      <PackingSections
        listId="list-1"
        sections={[]}
        items={[]}
        onDeleted={vi.fn()}
        onAddHere={vi.fn()}
      />,
      [],
    );

    expect(screen.getByText(/Empieza creando una sección/)).toBeInTheDocument();
  });
});

describe("Barra de abajo de una lista de equipaje", () => {
  function barra(checked: number, total: number) {
    const onRestart = vi.fn();
    montar(<PackingBar checked={checked} total={total} onRestart={onRestart} />);
    return onRestart;
  }

  it("dice cuánto falta", () => {
    barra(2, 5);
    expect(screen.getByText("2 de 5 listo")).toBeInTheDocument();
  });

  it("y cuando está todo, lo celebra", () => {
    barra(5, 5);
    expect(screen.getByText("¡Todo listo!")).toBeInTheDocument();
  });

  /** No hay «terminar»: una maleta no se borra, se vuelve a hacer. */
  it("«Empezar de nuevo» pide confirmación y entonces desmarca", async () => {
    const onRestart = barra(3, 5);

    await userEvent.click(screen.getByRole("button", { name: "Empezar de nuevo" }));
    expect(onRestart).not.toHaveBeenCalled();
    expect(screen.getByText("¿Desmarcar todo para la próxima vez?")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Desmarcar todo" }));
    expect(onRestart).toHaveBeenCalledTimes(1);
  });

  it("cancelar no toca nada", async () => {
    const onRestart = barra(3, 5);

    await userEvent.click(screen.getByRole("button", { name: "Empezar de nuevo" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onRestart).not.toHaveBeenCalled();
    expect(screen.getByText("3 de 5 listo")).toBeInTheDocument();
  });

  it("sin nada marcado no hay nada que reiniciar", () => {
    barra(0, 5);
    expect(screen.queryByRole("button", { name: "Empezar de nuevo" })).not.toBeInTheDocument();
  });
});

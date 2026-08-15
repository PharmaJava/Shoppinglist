import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ResultadoReceta } from "@/app/[locale]/recetas/actions";
import messages from "@/i18n/messages/es.json";
import { RecipeClient } from "./recipe-client";

const leerRecetaAction = vi.fn<() => Promise<ResultadoReceta>>();
vi.mock("@/app/[locale]/recetas/actions", () => ({
  leerRecetaAction: () => leerRecetaAction(),
}));

const createListFromTemplate = vi.fn(async (..._args: unknown[]) => ({ id: "lista-nueva" }));
vi.mock("@/features/list/api", () => ({
  createListFromTemplate: (...args: unknown[]) => createListFromTemplate(...args),
}));

const push = vi.fn();

function montar() {
  const router = {
    push,
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  };

  return render(
    <AppRouterContext.Provider value={router as unknown as AppRouterInstance}>
      <NextIntlClientProvider locale="es" messages={messages}>
        <RecipeClient />
      </NextIntlClientProvider>
    </AppRouterContext.Provider>,
  );
}

function ingrediente(name: string, qty: number | null = null, unit: string | null = null) {
  return { name, qty, unit, raw: name };
}

const TORTILLA: ResultadoReceta = {
  ok: true,
  receta: {
    title: "Tortilla de patatas",
    servings: 4,
    ingredients: [ingrediente("Huevos", 6), ingrediente("Patatas", 1, "kg"), ingrediente("Sal")],
  },
};

/** Pega una receta cualquiera y pulsa «Leer la receta». */
async function pegarYLeer() {
  await userEvent.type(screen.getByLabelText("La receta"), "una receta");
  await userEvent.click(screen.getByRole("button", { name: "Leer la receta" }));
}

beforeEach(() => {
  leerRecetaAction.mockResolvedValue(TORTILLA);
  createListFromTemplate.mockClear();
  push.mockClear();
});

afterEach(cleanup);

describe("RecipeClient", () => {
  it("enseña lo que ha entendido antes de crear nada", async () => {
    montar();
    await pegarYLeer();

    expect(await screen.findByText("3 ingredientes")).toBeInTheDocument();
    expect(screen.getByText("Huevos")).toBeInTheDocument();
    expect(createListFromTemplate).not.toHaveBeenCalled();
  });

  it("propone el título de la receta como nombre de la lista", async () => {
    montar();
    await pegarYLeer();

    expect(await screen.findByLabelText("Nombre de la lista")).toHaveValue("Tortilla de patatas");
  });

  /**
   * La sal y el aceite salen en todas las recetas y ya están en casa. Poder
   * quitarlos antes de crear la lista es la diferencia entre usar esto y no
   * usarlo.
   */
  it("lo desmarcado no entra en la lista", async () => {
    montar();
    await pegarYLeer();
    await screen.findByText("3 ingredientes");

    await userEvent.click(screen.getByRole("checkbox", { name: /Sal/ }));
    await userEvent.click(screen.getByRole("button", { name: /Crear la lista con 2/ }));

    await waitFor(() => expect(createListFromTemplate).toHaveBeenCalled());
    const [, productos] = createListFromTemplate.mock.calls[0] as [string, { name: string }[]];
    expect(productos.map((p) => p.name)).toEqual(["Huevos", "Patatas"]);
  });

  it("reescala las cantidades al cambiar los comensales", async () => {
    montar();
    await pegarYLeer();
    await screen.findByText("3 ingredientes");

    const comensales = screen.getByLabelText("Número de comensales");
    await userEvent.clear(comensales);
    await userEvent.type(comensales, "8");

    // 6 huevos para 4 son 12 para 8. Y la sal sigue sin cantidad.
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("2 kg")).toBeInTheDocument();
  });

  it("al crear la lista lleva a ella", async () => {
    montar();
    await pegarYLeer();
    await screen.findByText("3 ingredientes");

    await userEvent.click(screen.getByRole("button", { name: /Crear la lista/ }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/l/lista-nueva"));
  });

  it("los productos van con su categoría, para que la lista salga por pasillos", async () => {
    montar();
    await pegarYLeer();
    await screen.findByText("3 ingredientes");

    await userEvent.click(screen.getByRole("button", { name: /Crear la lista/ }));

    await waitFor(() => expect(createListFromTemplate).toHaveBeenCalled());
    const [, productos] = createListFromTemplate.mock.calls[0] as [
      string,
      { name: string; categoryId: string }[],
    ];
    expect(productos[0]).toEqual(expect.objectContaining({ name: "Huevos", categoryId: "dairy" }));
  });

  /** Si el servidor dice que no se puede, se dice; no se finge que sí. */
  it("un plan gratuito lo dice y no crea nada", async () => {
    leerRecetaAction.mockResolvedValue({ ok: false, motivo: "no_premium" });
    montar();
    await pegarYLeer();

    expect(await screen.findByRole("alert")).toHaveTextContent(messages.recipes.error.no_premium);
    expect(screen.queryByRole("button", { name: /Crear la lista/ })).not.toBeInTheDocument();
  });

  it("si no ha sacado ingredientes lo explica en vez de dejar la pantalla vacía", async () => {
    leerRecetaAction.mockResolvedValue({
      ok: true,
      receta: { title: null, servings: null, ingredients: [] },
    });
    montar();
    await pegarYLeer();

    expect(await screen.findByText(messages.recipes.nothingFound)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Crear la lista/ })).not.toBeInTheDocument();
  });
});

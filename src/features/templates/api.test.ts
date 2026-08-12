import { afterEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
const order = vi.fn();
const eqSelect = vi.fn(() => ({ order }));

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    rpc,
    from: () => ({ select: () => ({ eq: eqSelect, order }) }),
  }),
}));

vi.mock("@/lib/supabase/get-current-user-id", () => ({
  getCurrentUserId: async () => "usuario-1",
}));

const createListFromTemplate = vi.fn(async () => ({ id: "lista-nueva" }));
vi.mock("@/features/list/api", () => ({
  createListFromTemplate: (...args: unknown[]) => createListFromTemplate(...(args as [])),
}));

const { fetchMyTemplates, fetchTemplateItems, saveListAsTemplate } = await import("./api");

afterEach(() => {
  rpc.mockReset();
  order.mockReset();
});

describe("saveListAsTemplate", () => {
  it("llama a la RPC y devuelve el id de la plantilla", async () => {
    rpc.mockResolvedValue({ data: "plantilla-1", error: null });

    expect(await saveListAsTemplate("lista-1", "  Semanal  ")).toBe("plantilla-1");
    expect(rpc).toHaveBeenCalledWith("save_list_as_template", {
      p_list: "lista-1",
      p_title: "  Semanal  ",
    });
  });

  // El tope de 100 plantillas y «esa lista no es tuya» llegan como error de
  // Postgres: el mensaje tiene que subir tal cual hasta la pantalla.
  it("deja pasar el mensaje del servidor", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "Esa lista no es tuya." } });

    await expect(saveListAsTemplate("ajena", "X")).rejects.toThrow("Esa lista no es tuya.");
  });
});

describe("fetchMyTemplates", () => {
  it("saca el número de productos del agregado de PostgREST", async () => {
    order.mockResolvedValue({
      data: [
        {
          id: "p1",
          title: "Semanal",
          created_at: "2026-08-01T00:00:00Z",
          template_items: [{ count: 12 }],
        },
      ],
      error: null,
    });

    expect(await fetchMyTemplates()).toEqual([
      { id: "p1", title: "Semanal", createdAt: "2026-08-01T00:00:00Z", itemCount: 12 },
    ]);
  });

  // Una plantilla sin productos llega con el agregado vacío, no con un cero.
  it("una plantilla vacía cuenta cero, no `undefined`", async () => {
    order.mockResolvedValue({
      data: [{ id: "p2", title: "Vacía", created_at: "2026-08-01T00:00:00Z", template_items: [] }],
      error: null,
    });

    expect((await fetchMyTemplates())[0]?.itemCount).toBe(0);
  });
});

describe("fetchTemplateItems", () => {
  it("traduce las columnas al formato que espera crear la lista", async () => {
    order.mockResolvedValue({
      data: [
        { name: "Leche", qty: 2, unit: "L", category_id: "dairy" },
        { name: "Pan", qty: null, unit: null, category_id: null },
      ],
      error: null,
    });

    expect(await fetchTemplateItems("p1")).toEqual([
      { name: "Leche", qty: 2, unit: "L", categoryId: "dairy" },
      // Sin categoría va a «otros», que es donde la interfaz sabe ponerlo;
      // un `null` dejaría el producto fuera de todos los pasillos.
      { name: "Pan", qty: undefined, unit: undefined, categoryId: "other" },
    ]);
  });
});

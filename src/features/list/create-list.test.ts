import { beforeEach, describe, expect, it, vi } from "vitest";
import { listPendingMutations, removeMutation } from "@/lib/sync/outbox";

/** Lo que llega al servidor, petición a petición. */
const servidor = vi.hoisted(() => ({
  peticiones: [] as Array<{ tabla: string; filas: unknown }>,
  falloDeRedEnProductos: false,
}));

vi.mock("@/features/auth/ensure-guest-session", () => ({
  ensureGuestSession: async () => "usuario-1",
}));
vi.mock("@/lib/supabase/get-current-user-id", () => ({
  getCurrentUserId: async () => "usuario-1",
}));
vi.mock("./history", () => ({
  recordProductsAdded: vi.fn(),
  recordProductPrice: vi.fn(),
}));
vi.mock("@/lib/sync/flush", async () => {
  const { enqueueMutation } = await import("@/lib/sync/outbox");
  // Sólo encola: aquí interesa qué acaba en la cola, no enviarlo.
  return { queueRowMutation: enqueueMutation };
});
vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    from: (tabla: string) => ({
      insert: (fila: Record<string, unknown>) => ({
        select: () => ({
          single: async () => {
            servidor.peticiones.push({ tabla, filas: fila });
            return { data: { ...fila, archived_at: null, budget_cents: null }, error: null };
          },
        }),
      }),
      upsert: async (filas: unknown) => {
        servidor.peticiones.push({ tabla, filas });
        if (tabla === "list_items" && servidor.falloDeRedEnProductos) {
          return { data: null, error: { message: "TypeError: Failed to fetch" }, status: 0 };
        }
        return { data: null, error: null, status: 201 };
      },
    }),
  }),
}));

const { createListFromInput, createListFromTemplate } = await import("./api");

beforeEach(async () => {
  servidor.peticiones.length = 0;
  servidor.falloDeRedEnProductos = false;
  const pendientes = await listPendingMutations();
  await Promise.all(pendientes.map((op) => removeMutation(op.key)));
});

describe("crear una lista con productos", () => {
  /**
   * Antes se creaba la lista, se encolaban los productos uno a uno y se
   * navegaba. La lista se abría vacía o a medias y se iba rellenando delante
   * de quien la acababa de escribir.
   */
  it("guarda todos los productos en una sola petición antes de devolver la lista", async () => {
    const creada = await createListFromInput("leche pan tomate", "es", "Mi lista");

    const productos = servidor.peticiones.filter((p) => p.tabla === "list_items");
    expect(productos).toHaveLength(1);
    expect(productos[0]?.filas).toHaveLength(3);

    expect(creada.items.map((item) => item.name)).toEqual(["Leche", "Pan", "Tomate"]);
    expect(creada.items.every((item) => item.list_id === creada.list.id)).toBe(true);
    expect(await listPendingMutations()).toHaveLength(0);
  });

  it("conserva el orden escrito con claves de orden crecientes", async () => {
    const { items } = await createListFromInput("leche, pan, tomate, huevos", "es", "Mi lista");

    const claves = items.map((item) => item.sort_key);
    expect([...claves].sort()).toEqual(claves);
    expect(new Set(claves).size).toBe(claves.length);
  });

  it("primero la lista y después sus productos", async () => {
    await createListFromInput("leche pan", "es", "Mi lista");

    expect(servidor.peticiones.map((p) => p.tabla)).toEqual(["lists", "list_items"]);
  });

  /** Si la red cae justo entre crear la lista y guardar lo de dentro, nada se
   *  pierde: va a la cola y llega al volver la conexión. */
  it("si falla la red al guardar los productos, los deja en la cola", async () => {
    servidor.falloDeRedEnProductos = true;

    const creada = await createListFromInput("leche pan tomate", "es", "Mi lista");

    const enCola = await listPendingMutations();
    expect(enCola.map((op) => op.row.id).sort()).toEqual(
      creada.items.map((item) => item.id).sort(),
    );
  });

  it("la plantilla respeta su categoría y su orden", async () => {
    const { items } = await createListFromTemplate(
      "Semana",
      [
        { name: "Manzanas", categoryId: "fruta" },
        { name: "Leche", qty: 2, unit: "l", categoryId: "lacteos" },
      ],
      "es",
    );

    expect(items.map((item) => [item.name, item.category_id, item.qty])).toEqual([
      ["Manzanas", "fruta", null],
      ["Leche", "lacteos", 2],
    ]);
  });

  it("una lista vacía no hace una petición de productos de balde", async () => {
    await createListFromTemplate("Vacía", [], "es");

    expect(servidor.peticiones.map((p) => p.tabla)).toEqual(["lists"]);
  });
});

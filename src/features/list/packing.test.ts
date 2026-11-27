import { beforeEach, describe, expect, it, vi } from "vitest";
import { listPendingMutations, removeMutation } from "@/lib/sync/outbox";
import type { ListItem, ListSection } from "./types";

/**
 * Un servidor de mentira con datos: guarda lo que llega y devuelve lo que
 * tiene cuando se le pregunta. Hace falta para duplicar, que primero lee la
 * lista original y después escribe la copia.
 */
const servidor = vi.hoisted(() => ({
  peticiones: [] as Array<{ tabla: string; filas: unknown }>,
  tablas: {} as Record<string, Array<Record<string, unknown>>>,
  falloEnSecciones: false,
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
  return { queueRowMutation: enqueueMutation };
});
vi.mock("@/lib/supabase/client", () => {
  function filasDe(tabla: string) {
    servidor.tablas[tabla] = servidor.tablas[tabla] ?? [];
    return servidor.tablas[tabla];
  }

  function consulta(tabla: string) {
    const filtros: Array<(fila: Record<string, unknown>) => boolean> = [];
    const builder = {
      eq(columna: string, valor: unknown) {
        filtros.push((fila) => fila[columna] === valor);
        return builder;
      },
      is(columna: string, valor: unknown) {
        filtros.push((fila) => (fila[columna] ?? null) === valor);
        return builder;
      },
      order() {
        return builder;
      },
      filas() {
        return (servidor.tablas[tabla] ?? []).filter((fila) => filtros.every((f) => f(fila)));
      },
      async single() {
        return { data: builder.filas()[0] ?? null, error: null };
      },
      // biome-ignore lint/suspicious/noThenProperty: imita el «thenable» de supabase-js
      then(resolver: (r: { data: unknown; error: null }) => void) {
        resolver({ data: builder.filas(), error: null });
      },
    };
    return builder;
  }

  return {
    getSupabaseBrowserClient: () => ({
      from: (tabla: string) => ({
        select: () => consulta(tabla),
        insert: (fila: Record<string, unknown>) => ({
          select: () => ({
            single: async () => {
              servidor.peticiones.push({ tabla, filas: fila });
              const guardada = { archived_at: null, budget_cents: null, ...fila };
              filasDe(tabla).push(guardada);
              return { data: guardada, error: null };
            },
          }),
        }),
        upsert: async (filas: Array<Record<string, unknown>>) => {
          servidor.peticiones.push({ tabla, filas });
          if (tabla === "list_sections" && servidor.falloEnSecciones) {
            return { data: null, error: { message: "TypeError: Failed to fetch" }, status: 0 };
          }
          filasDe(tabla).push(...filas);
          return { data: null, error: null, status: 201 };
        },
      }),
    }),
  };
});

const { addParsedItems, addSection, createList, deleteSection, duplicateList, renameSection } =
  await import("./api");

beforeEach(async () => {
  servidor.peticiones.length = 0;
  servidor.tablas = {};
  servidor.falloEnSecciones = false;
  const pendientes = await listPendingMutations();
  await Promise.all(pendientes.map((op) => removeMutation(op.key)));
});

const LISTA = "11111111-1111-4111-8111-111111111111";

function seccion(id: string, name: string, sort_key: string): ListSection {
  return {
    id,
    list_id: LISTA,
    name,
    sort_key,
    created_by: "usuario-1",
    created_at: "2026-11-01T10:00:00Z",
    updated_at: "2026-11-01T10:00:00Z",
    deleted_at: null,
  };
}

function producto(id: string, name: string, sectionId: string | null, isChecked = false) {
  return {
    id,
    list_id: LISTA,
    name,
    qty: null,
    unit: null,
    note: null,
    category_id: null,
    price_cents: null,
    is_checked: isChecked,
    checked_by: null,
    checked_at: null,
    assigned_to: null,
    sort_key: id,
    created_by: "usuario-1",
    created_at: "2026-11-01T10:00:00Z",
    updated_at: "2026-11-01T10:00:00Z",
    deleted_at: null,
    section_id: sectionId,
  } satisfies ListItem;
}

describe("listas de equipaje", () => {
  it("se crean con su tipo", async () => {
    const lista = await createList("Vacaciones", "packing");

    expect(lista.kind).toBe("packing");
    expect(servidor.peticiones[0]?.filas).toMatchObject({ kind: "packing" });
  });

  it("y si no se dice nada, son de la compra", async () => {
    await createList("Sábado");

    expect(servidor.peticiones[0]?.filas).toMatchObject({ kind: "shopping" });
  });

  /** Por la cola, como los productos: la maleta se hace sin cobertura. */
  it("una sección nueva va a la cola, detrás de la anterior", async () => {
    const primera = await addSection(LISTA, "  Mochila niños  ", null);
    const segunda = await addSection(LISTA, "Maleta Dani", primera.sort_key);

    expect(primera.name).toBe("Mochila niños");
    expect(segunda.sort_key > primera.sort_key).toBe(true);

    const enCola = await listPendingMutations();
    expect(enCola.map((op) => op.key)).toEqual([
      `list_sections:${primera.id}`,
      `list_sections:${segunda.id}`,
    ]);
  });

  it("lo que se añade con una sección elegida va dentro de ella", async () => {
    const creados = await addParsedItems(
      LISTA,
      [
        { name: "Botella de agua", qty: null, unit: null },
        { name: "Cuaderno", qty: null, unit: null },
      ],
      "es",
      null,
      "seccion-1",
    );

    expect(creados.map((item) => item.section_id)).toEqual(["seccion-1", "seccion-1"]);
  });

  it("sin sección elegida, queda suelto", async () => {
    const [creado] = await addParsedItems(
      LISTA,
      [{ name: "Gafas", qty: null, unit: null }],
      "es",
      null,
    );

    expect(creado?.section_id).toBeNull();
  });

  it("renombrar recorta el nombre y lo manda a la cola", async () => {
    const renombrada = await renameSection(seccion("s1", "Maleta", "a0"), "  Maleta de Dani ");

    expect(renombrada.name).toBe("Maleta de Dani");
    expect((await listPendingMutations())[0]?.row).toMatchObject({ name: "Maleta de Dani" });
  });

  /** Borrar «Maleta Dani» no deja su cargador flotando en la lista. */
  it("borrar una sección se lleva lo que tiene dentro", async () => {
    const maleta = seccion("s1", "Maleta Dani", "a0");
    await deleteSection(maleta, [
      producto("p1", "Cargador", "s1"),
      producto("p2", "Cartera", "s1"),
    ]);

    const enCola = await listPendingMutations();
    expect(enCola).toHaveLength(3);
    expect(enCola.every((op) => typeof op.row.deleted_at === "string")).toBe(true);
    expect(enCola.map((op) => op.key).sort()).toEqual([
      "list_items:p1",
      "list_items:p2",
      "list_sections:s1",
    ]);
  });
});

describe("duplicar una lista de equipaje", () => {
  function sembrar() {
    servidor.tablas.lists = [
      { id: LISTA, title: "Maleta Dani", owner_id: "usuario-1", kind: "packing" },
    ];
    servidor.tablas.list_sections = [seccion("s1", "Neceser", "a0"), seccion("s2", "Ropa", "a1")];
    servidor.tablas.list_items = [
      producto("p1", "Cepillo", "s1", true),
      producto("p2", "Camisetas", "s2"),
      producto("p3", "Gafas", null),
    ];
  }

  it("copia el tipo, las secciones y lo que hay en cada una, todo desmarcado", async () => {
    sembrar();

    const copia = await duplicateList(LISTA, "Maleta Ana", "es");

    expect(copia.list.kind).toBe("packing");
    expect(copia.sections.map((s) => s.name)).toEqual(["Neceser", "Ropa"]);
    expect(copia.sections.every((s) => s.list_id === copia.list.id)).toBe(true);
    // Ids nuevos: las secciones de la copia son de otra lista.
    expect(copia.sections.map((s) => s.id)).not.toContain("s1");

    const neceser = copia.sections.find((s) => s.name === "Neceser");
    const ropa = copia.sections.find((s) => s.name === "Ropa");
    const porNombre = new Map(copia.items.map((item) => [item.name, item]));
    expect(porNombre.get("Cepillo")?.section_id).toBe(neceser?.id);
    expect(porNombre.get("Camisetas")?.section_id).toBe(ropa?.id);
    expect(porNombre.get("Gafas")?.section_id).toBeNull();
    expect(copia.items.every((item) => !item.is_checked)).toBe(true);
  });

  it("guarda las secciones antes que los productos que las usan", async () => {
    sembrar();

    await duplicateList(LISTA, "Maleta Ana", "es");

    const escrituras = servidor.peticiones.map((p) => p.tabla);
    expect(escrituras).toEqual(["lists", "list_sections", "list_items"]);
  });

  /** Si las secciones no llegan, los productos no se intentan: irían a una
   *  sección que el servidor aún no tiene y los rechazaría. A la cola, en
   *  orden, y llegan juntos al volver la red. */
  it("si fallan las secciones, todo va a la cola, secciones primero", async () => {
    sembrar();
    servidor.falloEnSecciones = true;

    await duplicateList(LISTA, "Maleta Ana", "es");

    expect(servidor.peticiones.map((p) => p.tabla)).toEqual(["lists", "list_sections"]);
    const enCola = await listPendingMutations();
    const tablas = enCola.map((op) => op.table);
    expect(tablas.slice(0, 2)).toEqual(["list_sections", "list_sections"]);
    expect(tablas.slice(2)).toEqual(["list_items", "list_items", "list_items"]);
  });

  it("una lista de la compra se sigue duplicando como siempre, sin secciones", async () => {
    servidor.tablas.lists = [
      { id: LISTA, title: "Sábado", owner_id: "usuario-1", kind: "shopping" },
    ];
    servidor.tablas.list_items = [producto("p1", "Leche", null)];

    const copia = await duplicateList(LISTA, "Sábado (copia)", "es");

    expect(copia.list.kind).toBe("shopping");
    expect(copia.sections).toEqual([]);
    expect(servidor.peticiones.map((p) => p.tabla)).toEqual(["lists", "list_items"]);
  });
});

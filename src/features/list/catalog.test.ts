import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Filas como las devuelve la tabla `products`: los dos idiomas juntos, que es
 * lo que se pide ahora en una sola petición.
 */
const FILAS = [
  { name: "Sandía", normalized: "sandia", category_id: "produce", locale: "es" },
  { name: "Nectarina", normalized: "nectarina", category_id: "produce", locale: "es" },
  { name: "Watermelon", normalized: "watermelon", category_id: "produce", locale: "en" },
];

const select = vi.fn(async () => ({ data: FILAS, error: null }));
const from = vi.fn(() => ({ select }));

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({ from }),
}));

beforeEach(() => {
  // El catálogo se guarda en variables de módulo: sin esto, la primera prueba
  // le dejaría el trabajo hecho a las demás.
  vi.resetModules();
  from.mockClear();
  select.mockClear();
});

describe("loadProductCatalog", () => {
  it("pide los dos idiomas de una vez, sin filtrar", async () => {
    const { loadProductCatalog } = await import("./catalog");

    await loadProductCatalog("es");

    expect(from).toHaveBeenCalledTimes(1);
    expect(select).toHaveBeenCalledWith(expect.stringContaining("locale"));
  });

  it("devuelve para sugerir sólo los del idioma pedido", async () => {
    const { loadProductCatalog, getCatalogProducts } = await import("./catalog");

    const productos = await loadProductCatalog("es");

    expect(productos.map((producto) => producto.normalized)).toEqual(["sandia", "nectarina"]);
    expect(getCatalogProducts("en").map((producto) => producto.normalized)).toEqual(["watermelon"]);
  });

  /**
   * El motivo de cargar los dos: quien tiene el móvil en inglés y escribe en
   * español necesita el catálogo **español** para que su compra se ordene por
   * pasillo. Con la petición filtrada por idioma, «sandía» se quedaba sin
   * categoría por muy cargado que estuviera el catálogo inglés.
   */
  it("clasifica un producto español con la interfaz en inglés", async () => {
    const { loadProductCatalog } = await import("./catalog");
    const { categorize } = await import("./categorize");

    expect(categorize("Sandía", "en")).toBe("other");

    await loadProductCatalog("en");

    expect(categorize("Sandía", "en")).toBe("produce");
  });

  it("una segunda llamada no vuelve a pedirlo", async () => {
    const { loadProductCatalog } = await import("./catalog");

    await loadProductCatalog("es");
    await loadProductCatalog("en");

    expect(from).toHaveBeenCalledTimes(1);
  });

  it("sin red se queda sin catálogo, no revienta", async () => {
    select.mockImplementationOnce(async () => {
      throw new Error("sin conexión");
    });
    const { loadProductCatalog } = await import("./catalog");

    await expect(loadProductCatalog("es")).resolves.toEqual([]);
  });
});

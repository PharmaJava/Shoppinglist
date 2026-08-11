import { describe, expect, it } from "vitest";
import type { CatalogProduct } from "./catalog";
import type { HistoryEntry } from "./history";
import { suggestProducts } from "./suggest";

const history: HistoryEntry[] = [
  {
    name: "Leche desnatada",
    normalized: "leche desnatada",
    categoryId: "dairy",
    timesAdded: 12,
    avgPriceCents: 145,
  },
  {
    name: "Tomates cherry",
    normalized: "tomates cherry",
    categoryId: "produce",
    timesAdded: 5,
    avgPriceCents: null,
  },
  {
    name: "Pan de molde",
    normalized: "pan de molde",
    categoryId: "bakery",
    timesAdded: 3,
    avgPriceCents: null,
  },
];

const catalog: CatalogProduct[] = [
  { name: "Leche", normalized: "leche", categoryId: "dairy" },
  { name: "Leche de avena", normalized: "leche de avena", categoryId: "dairy" },
  { name: "Lechuga", normalized: "lechuga", categoryId: "produce" },
  { name: "Tomate", normalized: "tomate", categoryId: "produce" },
  { name: "Batido de leche", normalized: "batido de leche", categoryId: "drinks" },
];

describe("suggestProducts", () => {
  it("con el campo vacío devuelve el historial, lo más comprado primero", () => {
    const result = suggestProducts("", { history, catalog });

    expect(result.map((s) => s.name)).toEqual([
      "Leche desnatada",
      "Tomates cherry",
      "Pan de molde",
    ]);
    expect(result.every((s) => s.source === "history")).toBe(true);
  });

  it("pone lo propio por delante del catálogo", () => {
    const result = suggestProducts("leche", { history, catalog });

    expect(result[0]).toEqual({
      name: "Leche desnatada",
      categoryId: "dairy",
      source: "history",
    });
  });

  it("prefiere lo que empieza por lo escrito a lo que sólo lo contiene", () => {
    const result = suggestProducts("leche", { history, catalog });
    const names = result.map((s) => s.name);

    expect(names.indexOf("Leche")).toBeLessThan(names.indexOf("Batido de leche"));
  });

  it("ordena el catálogo de más genérico a más específico", () => {
    const result = suggestProducts("leche", { history, catalog });
    const names = result.map((s) => s.name);

    expect(names.indexOf("Leche")).toBeLessThan(names.indexOf("Leche de avena"));
  });

  it("ignora acentos y mayúsculas", () => {
    const result = suggestProducts("  LÉCHUGA ", { history, catalog });

    expect(result.map((s) => s.name)).toContain("Lechuga");
  });

  it("no sugiere lo que ya está en la lista", () => {
    const result = suggestProducts("tomate", {
      history,
      catalog,
      exclude: ["tomate", "tomates cherry"],
    });

    expect(result).toEqual([]);
  });

  it("no repite un producto presente en el historial y en el catálogo", () => {
    const repetido: HistoryEntry[] = [
      {
        name: "Leche",
        normalized: "leche",
        categoryId: "dairy",
        timesAdded: 4,
        avgPriceCents: null,
      },
    ];
    const result = suggestProducts("leche", { history: repetido, catalog });

    expect(result.filter((s) => s.name === "Leche")).toHaveLength(1);
    expect(result[0]?.source).toBe("history");
  });

  it("respeta el límite pedido", () => {
    const result = suggestProducts("leche", { history, catalog, limit: 2 });

    expect(result).toHaveLength(2);
  });
});

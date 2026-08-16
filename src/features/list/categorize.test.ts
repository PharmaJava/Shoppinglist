import { describe, expect, it } from "vitest";
import {
  categorize,
  isKnownProduct,
  mergeCatalogEntries,
  normalizeProductName,
} from "./categorize";

describe("normalizeProductName", () => {
  it("quita acentos y pasa a minúsculas", () => {
    expect(normalizeProductName("Jamón")).toBe("jamon");
    expect(normalizeProductName("  Plátanos  ")).toBe("platanos");
  });
});

describe("categorize", () => {
  it("reconoce una coincidencia exacta en español", () => {
    expect(categorize("Leche", "es")).toBe("dairy");
    expect(categorize("tomates", "es")).toBe("produce");
  });

  it("reconoce una coincidencia exacta en inglés", () => {
    expect(categorize("Milk", "en")).toBe("dairy");
    expect(categorize("bananas", "en")).toBe("produce");
  });

  it("reconoce variantes con acentos y mayúsculas", () => {
    expect(categorize("JAMÓN serrano", "es")).not.toBe("other");
  });

  it("cae en 'other' cuando no hay coincidencia", () => {
    expect(categorize("xyzzy-no-existe", "es")).toBe("other");
  });
});

describe("mergeCatalogEntries", () => {
  it("añade cobertura sin perder las entradas del diccionario estático", () => {
    mergeCatalogEntries("es", { quinoa: "pantry" });

    expect(categorize("quinoa", "es")).toBe("pantry");
    expect(categorize("leche", "es")).toBe("dairy"); // sigue funcionando el diccionario base
  });

  it("una entrada del catálogo puede sobrescribir al diccionario estático", () => {
    mergeCatalogEntries("es", { pan: "breakfast" });

    expect(categorize("pan", "es")).toBe("breakfast");

    // se deja como estaba para no filtrar estado entre tests
    mergeCatalogEntries("es", { pan: "bakery" });
  });
});

/**
 * Lo usa el parser para decidir si «leche pan tomate» son tres cosas o una
 * sola con nombre largo, así que un «casi» aquí parte «carne picada» en dos
 * productos que no existen.
 */
describe("isKnownProduct", () => {
  it("reconoce un producto del diccionario estático", () => {
    expect(isKnownProduct("Leche", "es")).toBe(true);
    expect(isKnownProduct("PAN", "es")).toBe(true);
    expect(isKnownProduct("plátano", "es")).toBe(true);
  });

  it("y uno que sólo está en el catálogo cargado", () => {
    mergeCatalogEntries("es", { boniato: "produce" });

    expect(isKnownProduct("boniato", "es")).toBe(true);
  });

  it("pero no una palabra que sólo forma parte de un nombre", () => {
    expect(isKnownProduct("picada", "es")).toBe(false);
    expect(isKnownProduct("higienico", "es")).toBe(false);
    expect(isKnownProduct("semidesnatada", "es")).toBe(false);
  });

  it("ni un número, ni el vacío", () => {
    expect(isKnownProduct("500", "es")).toBe(false);
    expect(isKnownProduct("   ", "es")).toBe(false);
  });
});

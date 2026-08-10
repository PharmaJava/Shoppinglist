import { describe, expect, it } from "vitest";
import { categorize, mergeCatalogEntries, normalizeProductName } from "./categorize";

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

import { describe, expect, it } from "vitest";
import { categorize, normalizeProductName } from "./categorize";

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

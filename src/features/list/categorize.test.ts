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

/**
 * El caso real que lo motivó: el móvil en inglés y la compra escrita en
 * español. La interfaz en inglés es correcta —es el idioma del teléfono— pero
 * los productos («sandía», «nectarina», «plátano») no estaban en ningún
 * diccionario inglés y la lista entera caía en «Otros», con lo que el orden
 * por pasillo, que es de lo que vive esto, no hacía nada.
 */
describe("el idioma del móvil no decide en qué idioma se escribe", () => {
  it("clasifica productos en español con la interfaz en inglés", () => {
    expect(categorize("Tomate", "en")).toBe("produce");
    expect(categorize("Plátano", "en")).toBe("produce");
    expect(categorize("Leche", "en")).toBe("dairy");
  });

  it("y productos en inglés con la interfaz en español", () => {
    expect(categorize("Milk", "es")).toBe("dairy");
    expect(categorize("Chicken", "es")).toBe("meat");
  });

  it("lo que no está en ninguno de los dos sigue siendo «otros»", () => {
    expect(categorize("xyzzy-no-existe", "en")).toBe("other");
  });

  it("también reconoce productos en el otro idioma", () => {
    expect(isKnownProduct("tomate", "en")).toBe(true);
    expect(isKnownProduct("milk", "es")).toBe(true);
    expect(isKnownProduct("picada", "en")).toBe(false);
  });

  /**
   * Las seis palabras que comparten los dos diccionarios estáticos están en la
   * misma categoría en ambos. Si un día dejaran de estarlo, mirar los dos
   * idiomas empezaría a dar resultados según de dónde sea el móvil, que es
   * exactamente lo que esto viene a arreglar.
   */
  it("las palabras que están en los dos idiomas coinciden de categoría", () => {
    for (const palabra of ["pasta", "pizza", "chocolate", "salmon", "baguette", "croissant"]) {
      expect(categorize(palabra, "es")).toBe(categorize(palabra, "en"));
    }
  });

  it("el catálogo de un idioma sirve para quien tiene la interfaz en el otro", () => {
    // «Sandía» no está en ninguno de los dos diccionarios estáticos: llega con
    // el catálogo de la base de datos, que ahora se carga entero.
    expect(categorize("Sandia", "en")).toBe("other");

    mergeCatalogEntries("es", { sandia: "produce", nectarina: "produce" });

    expect(categorize("Sandia", "en")).toBe("produce");
    expect(categorize("Nectarina", "en")).toBe("produce");
  });
});

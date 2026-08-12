import { describe, expect, it } from "vitest";
import { flattenPastedList, valueAfterPaste } from "./paste";

describe("flattenPastedList", () => {
  it("convierte las líneas en comas", () => {
    expect(flattenPastedList("Agua\nGazpacho\nChocolate")).toBe("Agua, Gazpacho, Chocolate");
  });

  it("limpia espacios sueltos y líneas vacías", () => {
    expect(flattenPastedList(" Agua \n\n  \n Gazpacho ")).toBe("Agua, Gazpacho");
  });

  it("quita las viñetas con las que se copian las listas", () => {
    expect(flattenPastedList("- Pan\n• Leche\n* Huevos")).toBe("Pan, Leche, Huevos");
  });

  it("aguanta los saltos de Windows", () => {
    expect(flattenPastedList("Pan\r\nLeche")).toBe("Pan, Leche");
  });
});

describe("valueAfterPaste", () => {
  it("no toca un pegado de una sola línea", () => {
    expect(valueAfterPaste("", 0, 0, "Pan")).toBeNull();
  });

  it("sobre un campo vacío, deja la lista entera", () => {
    expect(valueAfterPaste("", 0, 0, "Agua\nPan")).toBe("Agua, Pan");
  });

  // Pegar detrás de lo ya escrito no puede producir «panagua».
  it("añade separador si había algo escrito", () => {
    expect(valueAfterPaste("Pan", 3, 3, "Agua\nLeche")).toBe("Pan, Agua, Leche");
  });

  it("no duplica el separador si ya estaba", () => {
    expect(valueAfterPaste("Pan, ", 5, 5, "Agua\nLeche")).toBe("Pan, Agua, Leche");
  });

  it("respeta lo que hay a la derecha del cursor", () => {
    expect(valueAfterPaste("Pan, queso", 5, 5, "Agua\nLeche")).toBe("Pan, Agua, Lechequeso");
  });

  it("sustituye la selección, como haría el navegador", () => {
    expect(valueAfterPaste("Pan, queso", 5, 10, "Agua\nLeche")).toBe("Pan, Agua, Leche");
  });

  it("un pegado con saltos pero sin contenido no cambia nada", () => {
    expect(valueAfterPaste("Pan", 3, 3, "\n\n  \n")).toBeNull();
  });
});

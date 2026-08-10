import { describe, expect, it } from "vitest";
import { parseVoiceTranscript } from "./parse-voice";

describe("parseVoiceTranscript — español", () => {
  it("separa por comas y por 'y', extrayendo cantidad y unidad", () => {
    const result = parseVoiceTranscript("dos litros de leche y pan", "es");
    expect(result).toEqual([
      { name: "Leche", qty: 2, unit: "litros" },
      { name: "Pan", qty: null, unit: null },
    ]);
  });

  it("reconoce cantidades numéricas", () => {
    const result = parseVoiceTranscript("3 manzanas", "es");
    expect(result).toEqual([{ name: "Manzanas", qty: 3, unit: null }]);
  });

  it("reconoce cantidades escritas", () => {
    const result = parseVoiceTranscript("una docena de huevos", "es");
    expect(result).toEqual([{ name: "Huevos", qty: 1, unit: "docena" }]);
  });

  it("sin cantidad, deja el producto tal cual", () => {
    const result = parseVoiceTranscript("tomates", "es");
    expect(result).toEqual([{ name: "Tomates", qty: null, unit: null }]);
  });

  it("separa varios productos por comas", () => {
    const result = parseVoiceTranscript("leche, pan, huevos", "es");
    expect(result.map((item) => item.name)).toEqual(["Leche", "Pan", "Huevos"]);
  });

  // `createListFromInput` depende de este contrato para decidir cuándo caer
  // al texto original en vez de crear una lista sin productos.
  it("devuelve una lista vacía si no queda nada tras separar", () => {
    expect(parseVoiceTranscript(" , , ", "es")).toEqual([]);
  });
});

describe("parseVoiceTranscript — inglés", () => {
  it("splits on commas and 'and', extracting quantity and unit", () => {
    const result = parseVoiceTranscript("two liters of milk and bread", "en");
    expect(result).toEqual([
      { name: "Milk", qty: 2, unit: "liters" },
      { name: "Bread", qty: null, unit: null },
    ]);
  });

  it("recognizes numeric quantities", () => {
    const result = parseVoiceTranscript("3 apples", "en");
    expect(result).toEqual([{ name: "Apples", qty: 3, unit: null }]);
  });
});

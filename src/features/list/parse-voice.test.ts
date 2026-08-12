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

// Al teclear, la cantidad se escribe al final: nadie escribe "500 g de carne
// picada" en el campo de añadir, escribe "carne picada 500g".
describe("parseVoiceTranscript — cantidad escrita al final", () => {
  it("separa peso con espacio", () => {
    expect(parseVoiceTranscript("carne picada 500 g", "es")).toEqual([
      { name: "Carne picada", qty: 500, unit: "g" },
    ]);
  });

  it("separa peso pegado al número", () => {
    expect(parseVoiceTranscript("arroz 1kg", "es")).toEqual([
      { name: "Arroz", qty: 1, unit: "kg" },
    ]);
  });

  it("acepta decimales con coma", () => {
    expect(parseVoiceTranscript("queso 1,5 kg", "es")).toEqual([
      { name: "Queso", qty: 1.5, unit: "kg" },
    ]);
  });

  it("reconoce el multiplicador de unidades", () => {
    expect(parseVoiceTranscript("tomates x3", "es")).toEqual([
      { name: "Tomates", qty: 3, unit: null },
    ]);
  });

  it("cantidad sin unidad al final", () => {
    expect(parseVoiceTranscript("huevos 12", "es")).toEqual([
      { name: "Huevos", qty: 12, unit: null },
    ]);
  });

  it("no confunde un número que forma parte del nombre", () => {
    expect(parseVoiceTranscript("leche semidesnatada", "es")).toEqual([
      { name: "Leche semidesnatada", qty: null, unit: null },
    ]);
  });

  it("funciona igual en inglés", () => {
    expect(parseVoiceTranscript("ground beef 500 g", "en")).toEqual([
      { name: "Ground beef", qty: 500, unit: "g" },
    ]);
    expect(parseVoiceTranscript("tomatoes x3", "en")).toEqual([
      { name: "Tomatoes", qty: 3, unit: null },
    ]);
  });

  it("la cantidad al principio sigue teniendo prioridad", () => {
    expect(parseVoiceTranscript("2 litros de leche", "es")).toEqual([
      { name: "Leche", qty: 2, unit: "litros" },
    ]);
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

describe("listas pegadas de otro sitio", () => {
  // El caso real que lo motivó: una lista escrita en las notas del móvil, un
  // producto por línea, sin una sola coma. Antes entraba como un único
  // producto llamado "agua gazpacho chocolate galletas…".
  const pegado = `Agua
 Gazpacho
 Chocolate 
Galletas
Chuches
Helado
Servilletas 
Pollo
Queso
Fuet
Patatas
Agua
Gazpacho 
Cerveza
 Pasta
 Quinoa
Tomates 
Lechuga 
Tortitas
 Aceite oliva
Huevos 24
Gazpacho
 Queso feta
 Hamburguesa
Queso
Bacon
Patatas normales
 Patatas fritas
Servilletas
Pan hamburguesa
 Papel higienico`;

  it("saca un producto por línea", () => {
    const result = parseVoiceTranscript(pegado, "es");

    expect(result.length).toBeGreaterThan(20);
    expect(result.map((item) => item.name)).toContain("Chuches");
  });

  it("respeta los nombres de varias palabras", () => {
    const names = parseVoiceTranscript(pegado, "es").map((item) => item.name);

    expect(names).toContain("Aceite oliva");
    expect(names).toContain("Queso feta");
    expect(names).toContain("Pan hamburguesa");
    expect(names).toContain("Papel higienico");
  });

  it("lee la cantidad escrita al final de la línea", () => {
    const huevos = parseVoiceTranscript(pegado, "es").find((item) => item.name === "Huevos");

    expect(huevos).toEqual({ name: "Huevos", qty: 24, unit: null });
  });

  // Tres líneas iguales no son tres gazpachos: son un gazpacho apuntado tres
  // veces. Quien quiera dos escribe «gazpacho x2».
  it("no repite lo que aparece varias veces", () => {
    const names = parseVoiceTranscript(pegado, "es").map((item) => item.name);

    expect(names.filter((name) => name === "Gazpacho")).toHaveLength(1);
    expect(names.filter((name) => name === "Agua")).toHaveLength(1);
    expect(names.filter((name) => name === "Servilletas")).toHaveLength(1);
  });

  it("pero no confunde lo que sólo se parece", () => {
    const names = parseVoiceTranscript(pegado, "es").map((item) => item.name);

    expect(names).toContain("Patatas");
    expect(names).toContain("Patatas normales");
    expect(names).toContain("Patatas fritas");
  });

  it("al repetir, hereda la cantidad de la línea que la lleva", () => {
    const result = parseVoiceTranscript("Agua\nPan\nAgua 6", "es");

    expect(result).toEqual([
      { name: "Agua", qty: 6, unit: null },
      { name: "Pan", qty: null, unit: null },
    ]);
  });

  it("dentro de una línea siguen valiendo las comas y la conjunción", () => {
    const result = parseVoiceTranscript("Pan, leche y huevos\nTomates", "es");

    expect(result.map((item) => item.name)).toEqual(["Pan", "Leche", "Huevos", "Tomates"]);
  });

  it("quita los guiones y viñetas con los que se pegan las listas", () => {
    const result = parseVoiceTranscript("- Pan\n• Leche\n* Huevos\n– Aceite", "es");

    expect(result.map((item) => item.name)).toEqual(["Pan", "Leche", "Huevos", "Aceite"]);
  });

  it("aguanta líneas vacías y saltos de Windows", () => {
    const result = parseVoiceTranscript("Pan\r\n\r\n   \r\nLeche", "es");

    expect(result.map((item) => item.name)).toEqual(["Pan", "Leche"]);
  });
});

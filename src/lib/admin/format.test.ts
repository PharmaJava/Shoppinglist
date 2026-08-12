import { describe, expect, it } from "vitest";
import { anchoBarra, cuota, euros, numero, porcentaje, puntosSparkline, variacion } from "./format";

describe("formatos", () => {
  it("los miles se separan a la española", () => {
    expect(numero(1234567)).toBe("1.234.567");
  });

  // El separador antes del € es un espacio duro (U+00A0), no uno normal: lo
  // pone `Intl` para que el importe no se parta al final de una línea.
  it("los euros salen de céntimos", () => {
    expect(euros(0)).toBe("0 €");
    expect(euros(5000)).toBe("50 €");
    expect(euros(1499)).toBe("14,99 €");
  });

  it("los porcentajes no arrastran decimales inútiles", () => {
    expect(porcentaje(25)).toBe("25 %");
    expect(porcentaje(25.44)).toBe("25,4 %");
  });
});

describe("variacion", () => {
  it("compara con el periodo anterior", () => {
    expect(variacion(120, 100)).toMatchObject({ pct: 20, sentido: "sube", etiqueta: "+20 %" });
    expect(variacion(80, 100)).toMatchObject({ pct: -20, sentido: "baja", etiqueta: "-20 %" });
  });

  // Dividir entre el cero del periodo anterior da infinito, y «+∞ %» en un
  // panel no informa de nada: lo que pasa es que antes no había nada.
  it("de cero a algo es «nuevo», no un aumento infinito", () => {
    expect(variacion(5, 0)).toMatchObject({ sentido: "nuevo", etiqueta: "nuevo" });
  });

  it("de cero a cero es igual, no un error", () => {
    expect(variacion(0, 0)).toMatchObject({ sentido: "igual" });
  });

  it("caer a cero sí es un -100 %", () => {
    expect(variacion(0, 40)).toMatchObject({ pct: -100, sentido: "baja" });
  });
});

describe("puntosSparkline", () => {
  // El eje Y arranca en cero a propósito: escalar al mínimo de la serie
  // convierte una variación de dos unidades en un acantilado.
  it("el máximo toca arriba y el cero abajo", () => {
    expect(puntosSparkline([0, 10], 100, 50)).toBe("0,50 100,0");
  });

  it("una serie plana no se dibuja como una montaña", () => {
    expect(puntosSparkline([4, 4, 4], 100, 50)).toBe("0,0 50,0 100,0");
  });

  it("todo a cero se queda en la base, sin dividir entre cero", () => {
    expect(puntosSparkline([0, 0, 0], 100, 50)).toBe("0,50 50,50 100,50");
  });

  it("aguanta series vacías o de un solo punto", () => {
    expect(puntosSparkline([], 100, 50)).toBe("");
    expect(puntosSparkline([7], 100, 50)).toBe("0,50 100,50");
  });
});

describe("cuota y barras", () => {
  it("una división entre cero no acaba en NaN en pantalla", () => {
    expect(cuota(0, 0)).toBe(0);
    expect(anchoBarra(5, 0)).toBe("0%");
  });

  it("un valor pequeño pero no nulo sigue viéndose", () => {
    expect(anchoBarra(1, 1000)).toBe("2%");
  });

  it("el máximo ocupa la barra entera", () => {
    expect(anchoBarra(50, 50)).toBe("100%");
  });
});

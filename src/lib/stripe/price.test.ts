import { describe, expect, it } from "vitest";
import { formatearImporte, precioDeStripe } from "./price";

describe("formatearImporte", () => {
  /**
   * Stripe da los importes en la unidad mínima: 990 son 9,90 €. Equivocarse
   * aquí es enseñar un precio cien veces mayor, que es el peor error posible
   * en una página de precios.
   */
  it("convierte céntimos a euros", () => {
    // El espacio antes del € es un espacio duro (U+00A0), que es lo que pone
    // `Intl`: en español el símbolo va separado y no se parte de línea.
    expect(formatearImporte(990, "eur", "es")).toBe("9,90 €");
    expect(formatearImporte(1500, "eur", "es")).toBe("15,00 €");
  });

  it("cada idioma escribe el precio a su manera", () => {
    expect(formatearImporte(990, "eur", "en")).toBe("€9.90");
    expect(formatearImporte(990, "usd", "en")).toBe("$9.90");
  });

  /** «10 €» y «9,90 €» uno debajo del otro se leen peor sin los decimales. */
  it("mantiene los dos decimales aunque el importe sea redondo", () => {
    expect(formatearImporte(1000, "eur", "es")).toBe("10,00 €");
  });
});

describe("precioDeStripe", () => {
  it("trae el importe y cada cuánto se cobra", () => {
    expect(precioDeStripe(990, "eur", "month", "es")).toEqual({
      importe: "9,90 €",
      intervalo: "month",
    });
  });

  /** Un precio sin importe es un precio que no se puede enseñar. */
  it("sin importe no hay precio", () => {
    expect(precioDeStripe(null, "eur", "month", "es")).toBeNull();
  });

  /**
   * El yen no tiene céntimos: dividir entre cien convertiría 990 ¥ en 9,90 ¥.
   * No va a pasar aquí —el precio será en euros— pero cuesta una línea.
   */
  it("las monedas sin decimales no se dividen entre cien", () => {
    const precio = precioDeStripe(990, "jpy", "month", "es");

    expect(precio?.importe).toContain("990");
    expect(precio?.importe).not.toContain("9,90");
  });
});

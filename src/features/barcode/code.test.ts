import { describe, expect, it } from "vitest";
import { digitoDeControl, esCodigoValido, normalizarCodigo } from "./code";

/**
 * Los códigos de esta prueba son reales y su dígito de control se puede
 * comprobar a mano: 5449000000996 es una Coca-Cola de 33 cl y 96385074 es el
 * EAN-8 que usa la propia especificación de ejemplo.
 */
describe("esCodigoValido", () => {
  it.each([
    ["5449000000996", "EAN-13"],
    ["4006381333931", "EAN-13"],
    ["96385074", "EAN-8"],
    ["036000291452", "UPC-A"],
  ])("acepta %s (%s)", (code) => {
    expect(esCodigoValido(code)).toBe(true);
  });

  /**
   * Esto es lo que de verdad hace falta: una cámara con poca luz devuelve
   * dígitos de más o de menos, y sin comprobar el control se acabaría
   * preguntando a Open Food Facts por productos que no existen.
   */
  it("rechaza un código con un dígito cambiado", () => {
    expect(esCodigoValido("5449000000997")).toBe(false);
    expect(esCodigoValido("5449000010996")).toBe(false);
  });

  it("rechaza lo que no tiene pinta de código", () => {
    expect(esCodigoValido("")).toBe(false);
    expect(esCodigoValido("123")).toBe(false);
    expect(esCodigoValido("54490000009961")).toBe(false); // 14 dígitos, control mal
    expect(esCodigoValido("544900000099a")).toBe(false);
  });

  /**
   * Un cero delante no cambia el dígito de control —ese cero pesa cero—, así
   * que el mismo producto vale escrito como EAN-13 y como GTIN-14. Las cajas
   * de producto vienen con el largo.
   */
  it("un GTIN-14 bien formado sí entra", () => {
    expect(esCodigoValido("05449000000996")).toBe(true);
    expect(esCodigoValido("15449000000996")).toBe(false);
  });
});

describe("normalizarCodigo", () => {
  it("se queda con los dígitos, que la gente teclea con espacios y guiones", () => {
    expect(normalizarCodigo(" 5449 0000-00996 ")).toBe("5449000000996");
  });

  /**
   * Un UPC-A de 12 dígitos es el mismo producto que el EAN-13 que empieza por
   * cero. Sin unificarlos, el mismo bote acabaría dos veces en la memoria de
   * códigos según con qué lector se hubiera leído.
   */
  it("un UPC-A de 12 dígitos se guarda como su EAN-13", () => {
    expect(normalizarCodigo("036000291452")).toBe("0036000291452");
    expect(esCodigoValido(normalizarCodigo("036000291452"))).toBe(true);
  });

  it("no toca los de 13", () => {
    expect(normalizarCodigo("5449000000996")).toBe("5449000000996");
  });
});

describe("digitoDeControl", () => {
  it("es el que lleva impreso el envase", () => {
    expect(digitoDeControl("544900000099")).toBe(6);
    expect(digitoDeControl("9638507")).toBe(4);
  });
});

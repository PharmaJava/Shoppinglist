import { describe, expect, it } from "vitest";
import { nombreDeFicha, productoDeFicha } from "./product-name";

describe("nombreDeFicha", () => {
  it("usa el nombre del idioma de quien escanea", () => {
    const ficha = { product_name_es: "Leche entera", product_name_en: "Whole milk" };

    expect(nombreDeFicha(ficha, "es")).toBe("Leche entera");
    expect(nombreDeFicha(ficha, "en")).toBe("Whole milk");
  });

  it("si no está en su idioma, tira del que haya", () => {
    expect(nombreDeFicha({ product_name: "Leche entera" }, "en")).toBe("Leche entera");
  });

  /** Mejor «Leche entera» que nada: el genérico es el último recurso. */
  it("cae al nombre genérico antes que rendirse", () => {
    expect(nombreDeFicha({ generic_name_es: "Leche" }, "es")).toBe("Leche");
  });

  it("sin nombre no se inventa uno", () => {
    expect(nombreDeFicha({}, "es")).toBeNull();
    expect(nombreDeFicha({ product_name: "   " }, "es")).toBeNull();
  });

  /** Con marca se sabe cuál coger del lineal. */
  it("añade la marca", () => {
    expect(nombreDeFicha({ product_name: "Leche entera", brands: "Hacendado" }, "es")).toBe(
      "Leche entera Hacendado",
    );
  });

  it("pero no la repite si ya está dicha", () => {
    expect(nombreDeFicha({ product_name: "Leche Pascual entera", brands: "Pascual" }, "es")).toBe(
      "Leche Pascual entera",
    );
  });

  it("de varias marcas se queda con la primera", () => {
    expect(
      nombreDeFicha({ product_name: "Galletas María", brands: "Fontaneda, Mondelez" }, "es"),
    ).toBe("Galletas María Fontaneda");
  });

  /**
   * Las fichas traen nombres larguísimos con el formato y el envase dentro.
   * En una fila de la lista eso no se lee, así que se corta por palabra
   * entera.
   */
  it("recorta los nombres kilométricos sin partir palabras", () => {
    const largo = nombreDeFicha(
      {
        product_name:
          "Leche entera de vaca pasteurizada de alta calidad procedente de ganaderías sostenibles",
      },
      "es",
    );

    expect(largo?.length).toBeLessThanOrEqual(80);
    expect(largo?.endsWith(" ")).toBe(false);
    expect(largo).toBe(
      "Leche entera de vaca pasteurizada de alta calidad procedente de ganaderías",
    );
  });
});

describe("productoDeFicha", () => {
  it("trae el formato del envase para poder reconocerlo", () => {
    expect(
      productoDeFicha("5449000000996", { product_name: "Coca-Cola", quantity: "330 ml" }, "es"),
    ).toEqual({ code: "5449000000996", name: "Coca-Cola", quantity: "330 ml" });
  });

  it("sin nombre no hay producto", () => {
    expect(productoDeFicha("5449000000996", { quantity: "330 ml" }, "es")).toBeNull();
  });
});

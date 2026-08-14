import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  empezarCompra,
  hayCompraEnCurso,
  leerCompraEnCurso,
  terminarCompra,
} from "./shopping-session";

beforeEach(() => localStorage.clear());
afterEach(() => vi.unstubAllGlobals());

describe("compra en curso", () => {
  it("empieza, se recuerda y termina", () => {
    expect(leerCompraEnCurso()).toBeNull();

    empezarCompra("lista-1");
    expect(hayCompraEnCurso("lista-1")).toBe(true);

    terminarCompra();
    expect(hayCompraEnCurso("lista-1")).toBe(false);
  });

  /**
   * El motivo de que esto viva fuera de React: dentro del súper la pantalla se
   * apaga y al volver la página puede haberse recargado. Si la compra viviera
   * en `useState`, se saldría del modo compra sin que nadie lo pidiera y la
   * pantalla volvería a apagarse a los treinta segundos.
   */
  it("sobrevive a que la página se recargue", () => {
    empezarCompra("lista-1");

    // Una recarga es exactamente esto: el módulo vuelve a leer del almacén.
    expect(leerCompraEnCurso()).toBe("lista-1");
  });

  it("la compra es de una lista, no de todas", () => {
    empezarCompra("lista-1");

    expect(hayCompraEnCurso("lista-2")).toBe(false);
  });

  it("empezar otra compra sustituye a la anterior", () => {
    empezarCompra("lista-1");
    empezarCompra("lista-2");

    expect(hayCompraEnCurso("lista-1")).toBe(false);
    expect(hayCompraEnCurso("lista-2")).toBe(true);
  });

  // En modo privado `localStorage` lanza. La compra tiene que funcionar
  // igual, sólo que sin sobrevivir a una recarga.
  it("sin almacenamiento no revienta, sólo no se recuerda", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("SecurityError");
      },
      setItem: () => {
        throw new Error("SecurityError");
      },
      removeItem: () => {
        throw new Error("SecurityError");
      },
    });

    expect(() => empezarCompra("lista-1")).not.toThrow();
    expect(() => terminarCompra()).not.toThrow();
    expect(leerCompraEnCurso()).toBeNull();
  });
});

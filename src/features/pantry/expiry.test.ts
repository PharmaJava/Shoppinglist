import { describe, expect, it } from "vitest";
import { diasHasta, estadoCaducidad, ordenarPorCaducidad, urge } from "./expiry";

const HOY = new Date(2026, 7, 15); // 15 de agosto de 2026, hora local

describe("diasHasta", () => {
  it("cuenta días naturales", () => {
    expect(diasHasta("2026-08-15", HOY)).toBe(0);
    expect(diasHasta("2026-08-16", HOY)).toBe(1);
    expect(diasHasta("2026-08-14", HOY)).toBe(-1);
    expect(diasHasta("2026-09-15", HOY)).toBe(31);
  });

  /**
   * El motivo de contar por día natural y no restando milisegundos: en el
   * cambio de hora un día dura 23 o 25 horas, y una división entre 86 400 000
   * convierte «caduca mañana» en «caduca hoy». Dos veces al año, y siempre
   * pareciendo un fallo aleatorio.
   */
  it("el cambio de hora no adelanta ni atrasa una caducidad", () => {
    // En España el horario de verano acaba la madrugada del 25 de octubre.
    const vispera = new Date(2026, 9, 24);
    expect(diasHasta("2026-10-25", vispera)).toBe(1);
    expect(diasHasta("2026-10-26", vispera)).toBe(2);
  });

  it("una fecha que no lo es no revienta", () => {
    expect(Number.isNaN(diasHasta("mañana", HOY))).toBe(true);
  });
});

describe("estadoCaducidad", () => {
  it.each([
    ["2026-08-10", "caducado"],
    ["2026-08-15", "hoy"],
    ["2026-08-16", "pronto"],
    ["2026-08-22", "pronto"],
    ["2026-08-23", "lejos"],
  ])("%s → %s", (fecha, esperado) => {
    expect(estadoCaducidad(fecha, HOY)).toBe(esperado);
  });

  it("sin fecha no es un problema, es que no caduca", () => {
    expect(estadoCaducidad(null, HOY)).toBe("sin-fecha");
    expect(urge("sin-fecha")).toBe(false);
  });

  it("urge lo que caduca esta semana y lo que ya caducó", () => {
    expect(urge("caducado")).toBe(true);
    expect(urge("hoy")).toBe(true);
    expect(urge("pronto")).toBe(true);
    expect(urge("lejos")).toBe(false);
  });
});

describe("ordenarPorCaducidad", () => {
  const producto = (name: string, expiresOn: string | null) => ({ name, expiresOn });

  it("primero lo caducado, luego lo que caduca antes", () => {
    const orden = ordenarPorCaducidad(
      [
        producto("Arroz", null),
        producto("Yogur", "2026-08-16"),
        producto("Lechuga", "2026-08-10"),
        producto("Atún", "2026-12-01"),
      ],
      HOY,
    );

    expect(orden.map((p) => p.name)).toEqual(["Lechuga", "Yogur", "Atún", "Arroz"]);
  });

  // Lo que no caduca no puede llenar el principio de la lista: no pide nada.
  it("lo que no caduca va al final, ordenado por nombre", () => {
    const orden = ordenarPorCaducidad(
      [producto("Sal", null), producto("Aceite", null), producto("Pan", "2026-08-16")],
      HOY,
    );

    expect(orden.map((p) => p.name)).toEqual(["Pan", "Aceite", "Sal"]);
  });

  it("con la misma fecha, por nombre y respetando los acentos", () => {
    const orden = ordenarPorCaducidad(
      [producto("Ñoquis", "2026-08-16"), producto("Atún", "2026-08-16")],
      HOY,
    );

    expect(orden.map((p) => p.name)).toEqual(["Atún", "Ñoquis"]);
  });

  it("no toca el array que recibe", () => {
    const original = [producto("B", null), producto("A", "2026-08-16")];
    ordenarPorCaducidad(original, HOY);

    expect(original.map((p) => p.name)).toEqual(["B", "A"]);
  });
});

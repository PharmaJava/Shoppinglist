import { describe, expect, it } from "vitest";
import { crearLimitador } from "./rate-limit";

const OPCIONES = { maxIntentos: 3, bloqueoMs: 60_000, olvidoMs: 300_000 };
const T0 = 1_800_000_000_000;

describe("limitador de intentos", () => {
  it("de entrada no bloquea a nadie", () => {
    const limitador = crearLimitador(OPCIONES);

    expect(limitador.esperaRestante("1.2.3.4", T0)).toBe(0);
  });

  it("bloquea al llegar al máximo de fallos", () => {
    const limitador = crearLimitador(OPCIONES);

    limitador.registrarFallo("1.2.3.4", T0);
    limitador.registrarFallo("1.2.3.4", T0 + 100);
    expect(limitador.esperaRestante("1.2.3.4", T0 + 200)).toBe(0);

    limitador.registrarFallo("1.2.3.4", T0 + 200);
    expect(limitador.esperaRestante("1.2.3.4", T0 + 300)).toBeGreaterThan(0);
  });

  it("el bloqueo se levanta solo", () => {
    const limitador = crearLimitador(OPCIONES);
    for (let i = 0; i < 3; i++) limitador.registrarFallo("1.2.3.4", T0);

    expect(limitador.esperaRestante("1.2.3.4", T0 + 59_000)).toBe(1000);
    expect(limitador.esperaRestante("1.2.3.4", T0 + 60_001)).toBe(0);
  });

  it("acertar borra el contador", () => {
    const limitador = crearLimitador(OPCIONES);
    limitador.registrarFallo("1.2.3.4", T0);
    limitador.registrarFallo("1.2.3.4", T0);

    limitador.registrarExito("1.2.3.4");
    limitador.registrarFallo("1.2.3.4", T0);

    expect(limitador.esperaRestante("1.2.3.4", T0)).toBe(0);
  });

  // Bloquear a todo el mundo porque uno se equivoque convertiría el freno en
  // una forma de dejar al administrador fuera de su propio panel.
  it("el bloqueo es por IP, no general", () => {
    const limitador = crearLimitador(OPCIONES);
    for (let i = 0; i < 3; i++) limitador.registrarFallo("1.2.3.4", T0);

    expect(limitador.esperaRestante("1.2.3.4", T0)).toBeGreaterThan(0);
    expect(limitador.esperaRestante("5.6.7.8", T0)).toBe(0);
  });

  // Quien se equivocó dos veces hace un mes no debe arrastrar penalización.
  it("los fallos viejos se olvidan", () => {
    const limitador = crearLimitador(OPCIONES);
    limitador.registrarFallo("1.2.3.4", T0);
    limitador.registrarFallo("1.2.3.4", T0);

    const muchoDespues = T0 + 400_000;
    limitador.registrarFallo("1.2.3.4", muchoDespues);

    expect(limitador.esperaRestante("1.2.3.4", muchoDespues)).toBe(0);
  });
});

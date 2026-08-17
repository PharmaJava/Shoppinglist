import type Stripe from "stripe";
import { describe, expect, it } from "vitest";
import { finDePeriodo } from "./server";

/** 1 de septiembre de 2026, 00:00 UTC, en segundos como los manda Stripe. */
const SEGUNDOS = 1_788_220_800;
const ESPERADO = new Date(SEGUNDOS * 1000).toISOString();

function suscripcion(parcial: Record<string, unknown>): Stripe.Subscription {
  return parcial as unknown as Stripe.Subscription;
}

describe("finDePeriodo", () => {
  it("lo lee de la línea de la suscripción, que es donde vive ahora", () => {
    const s = suscripcion({ items: { data: [{ current_period_end: SEGUNDOS }] } });

    expect(finDePeriodo(s)).toBe(ESPERADO);
  });

  /**
   * El endpoint de Stripe tiene su propia versión de la API, la del día que se
   * creó, y los avisos llegan serializados con ésa y no con la del SDK. Uno
   * creado antes de que el campo se moviera manda la suscripción con la fecha
   * en la raíz. Sin este respaldo se guardaba `null` y la cuenta no podía decir
   * hasta cuándo está pagada.
   */
  it("y si no está ahí, de la raíz, que es donde vivía antes", () => {
    const s = suscripcion({ current_period_end: SEGUNDOS });

    expect(finDePeriodo(s)).toBe(ESPERADO);
  });

  it("con las dos, manda la línea", () => {
    const s = suscripcion({
      items: { data: [{ current_period_end: SEGUNDOS }] },
      current_period_end: 1,
    });

    expect(finDePeriodo(s)).toBe(ESPERADO);
  });

  /** Sin fecha no se inventa una: `null` y la cuenta no promete nada. */
  it.each([
    ["sin líneas", { items: { data: [] } }],
    ["sin nada", {}],
    ["con la fecha nula", { current_period_end: null }],
  ])("%s devuelve null", (_caso, datos) => {
    expect(finDePeriodo(suscripcion(datos))).toBeNull();
  });
});

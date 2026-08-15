import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

async function cargarFlags(valor?: string) {
  vi.resetModules();
  if (valor === undefined) vi.stubEnv("NEXT_PUBLIC_FEATURE_PREMIUM", "");
  else vi.stubEnv("NEXT_PUBLIC_FEATURE_PREMIUM", valor);
  return import("./flags");
}

describe("flagActivo", () => {
  /**
   * Lo que de verdad importa de este archivo: que en producción, sin tocar
   * nada, la Fase 3 esté apagada. Si esto se pusiera en `true` por defecto, se
   * publicarían pantallas a medio hacer sin que nadie lo pidiera.
   */
  it("sin variable, premium está apagado", async () => {
    const { flagActivo, PREMIUM_VISIBLE } = await cargarFlags();

    expect(flagActivo("premium")).toBe(false);
    expect(PREMIUM_VISIBLE).toBe(false);
  });

  it.each(["1", "true"])("con «%s» se enciende", async (valor) => {
    const { flagActivo } = await cargarFlags(valor);

    expect(flagActivo("premium")).toBe(true);
  });

  // Un `0` o un `false` mal copiados en Vercel no pueden encender nada, y un
  // valor raro tampoco: sólo lo que se reconoce enciende.
  it.each(["0", "false", "sí", "yes", "no", " 1"])("con «%s» sigue apagado", async (valor) => {
    const { flagActivo } = await cargarFlags(valor);

    expect(flagActivo("premium")).toBe(false);
  });
});

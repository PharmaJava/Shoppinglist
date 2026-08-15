import { describe, expect, it } from "vitest";
import { estadoFinal, hayQueDarlaPorTerminada, horasRestantes } from "./auto-finish";
import type { List } from "./types";

const AHORA = new Date("2026-08-15T12:00:00Z");

function lista(parcial: Partial<List> = {}): List {
  return {
    id: "l1",
    owner_id: "u1",
    title: "Compra",
    emoji: null,
    currency: "EUR",
    budget_cents: null,
    archived_at: null,
    auto_finish_at: null,
    created_at: "2026-08-15T00:00:00Z",
    updated_at: "2026-08-15T00:00:00Z",
    ...parcial,
  };
}

describe("estadoFinal", () => {
  /** Quien tiene cuenta no tiene fecha: su lista dura lo que quiera. */
  it("sin fecha no hay nada que avisar", () => {
    expect(estadoFinal(lista(), AHORA)).toBe("sin-caducidad");
  });

  it("con muchas horas por delante tampoco se avisa", () => {
    expect(estadoFinal(lista({ auto_finish_at: "2026-08-16T06:00:00Z" }), AHORA)).toBe("lejos");
  });

  // Seis horas antes: da tiempo a crear la cuenta o a terminar la compra.
  it("en las últimas horas se avisa", () => {
    expect(estadoFinal(lista({ auto_finish_at: "2026-08-15T15:00:00Z" }), AHORA)).toBe("pronto");
  });

  it("pasada la hora, está vencida", () => {
    expect(estadoFinal(lista({ auto_finish_at: "2026-08-15T11:59:00Z" }), AHORA)).toBe("vencida");
  });
});

describe("horasRestantes", () => {
  /**
   * Hacia arriba: durante los últimos cincuenta minutos, «queda 1 hora» es
   * más honesto que «quedan 0 horas», que suena a que ya no queda nada.
   */
  it("redondea hacia arriba", () => {
    expect(horasRestantes(lista({ auto_finish_at: "2026-08-15T14:10:00Z" }), AHORA)).toBe(3);
    expect(horasRestantes(lista({ auto_finish_at: "2026-08-15T12:10:00Z" }), AHORA)).toBe(1);
  });

  it("lo vencido no da horas negativas", () => {
    expect(horasRestantes(lista({ auto_finish_at: "2026-08-15T10:00:00Z" }), AHORA)).toBe(0);
  });
});

describe("hayQueDarlaPorTerminada", () => {
  it("una lista vencida y abierta hay que cerrarla", () => {
    expect(hayQueDarlaPorTerminada(lista({ auto_finish_at: "2026-08-15T10:00:00Z" }), AHORA)).toBe(
      true,
    );
  });

  /** Si ya está archivada no hay nada que hacer: no se archiva dos veces. */
  it("una que ya está archivada se deja en paz", () => {
    const yaEsta = lista({
      auto_finish_at: "2026-08-15T10:00:00Z",
      archived_at: "2026-08-15T10:00:01Z",
    });

    expect(hayQueDarlaPorTerminada(yaEsta, AHORA)).toBe(false);
  });

  it("y la de quien tiene cuenta no se toca nunca", () => {
    expect(hayQueDarlaPorTerminada(lista(), AHORA)).toBe(false);
  });
});

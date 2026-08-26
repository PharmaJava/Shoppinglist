import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CONSENT_KEY,
  CONSENT_VERSION,
  denyAll,
  grantAll,
  parseConsent,
  readConsent,
  writeConsent,
} from "./consent";

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("parseConsent", () => {
  /**
   * «Todavía no ha contestado» y «ha dicho que no» son cosas distintas: con la
   * primera no se mide **y se pregunta**; con la segunda no se mide y no se
   * vuelve a molestar. Colapsarlas en un booleano perdería justo eso.
   */
  it("sin nada guardado, nadie ha contestado", () => {
    expect(parseConsent(null)).toBeNull();
  });

  it("lee un sí y un no", () => {
    expect(parseConsent(JSON.stringify(grantAll()))?.measurement).toBe("granted");
    expect(parseConsent(JSON.stringify(denyAll()))?.measurement).toBe("denied");
  });

  /**
   * Si cambia lo que se pregunta, la respuesta de antes no responde a esto:
   * se vuelve a preguntar. Es el mecanismo para el día que se añada una
   * herramienta nueva.
   */
  it("una respuesta de otra versión no vale", () => {
    const vieja = JSON.stringify({ ...grantAll(), version: CONSENT_VERSION - 1 });

    expect(parseConsent(vieja)).toBeNull();
  });

  it.each([
    ["no es JSON", "{lo que sea"],
    ["sin el campo", JSON.stringify({ version: CONSENT_VERSION })],
    ["con un valor inventado", JSON.stringify({ measurement: "quizás", version: CONSENT_VERSION })],
  ])("un valor corrupto (%s) se trata como si no estuviera", (_caso, guardado) => {
    expect(parseConsent(guardado)).toBeNull();
  });
});

describe("readConsent / writeConsent", () => {
  it("lo guardado se vuelve a leer", () => {
    writeConsent(grantAll());

    expect(readConsent()?.measurement).toBe("granted");
  });

  it("guarda cuándo se decidió, para poder demostrarlo", () => {
    writeConsent(grantAll(new Date("2026-08-20T10:00:00Z")));

    expect(readConsent()?.decidedAt).toBe("2026-08-20T10:00:00.000Z");
  });

  /**
   * Safari en privado, cookies bloqueadas o dentro de un iframe: ahí
   * `localStorage` **lanza**. Quedarse sin recordar la respuesta es molesto;
   * tumbar la web por eso, no.
   */
  it("si el navegador no deja guardar, no revienta", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("acceso denegado");
    });

    expect(() => writeConsent(grantAll())).not.toThrow();
  });

  it("y si no deja leer, se pregunta otra vez", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("acceso denegado");
    });

    expect(readConsent()).toBeNull();
  });

  it("guarda bajo una clave propia y sin tocar nada más", () => {
    localStorage.setItem("otra-cosa", "no me toques");
    writeConsent(denyAll());

    expect(localStorage.getItem(CONSENT_KEY)).toContain("denied");
    expect(localStorage.getItem("otra-cosa")).toBe("no me toques");
  });
});

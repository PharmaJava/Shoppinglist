import { afterEach, describe, expect, it, vi } from "vitest";
import { ASKED_CATEGORIES } from "./categories";
import {
  CONSENT_KEY,
  CONSENT_VERSION,
  denyAll,
  fromChoices,
  grantAll,
  isGranted,
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
    expect(isGranted(parseConsent(JSON.stringify(grantAll())), "measurement")).toBe(true);
    expect(isGranted(parseConsent(JSON.stringify(denyAll())), "measurement")).toBe(false);
  });

  it("una respuesta de otra versión no vale", () => {
    const vieja = JSON.stringify({ ...grantAll(), version: CONSENT_VERSION - 1 });

    expect(parseConsent(vieja)).toBeNull();
  });

  /**
   * El mecanismo pensado para el día que se configure Google Analytics: si
   * hoy se pregunta por algo que no estaba cuando la persona contestó, su
   * respuesta **no responde a esto**, así que se vuelve a preguntar. Sin
   * depender de que nadie se acuerde de subir un número a mano, que es
   * exactamente el tipo de cosa que se olvida.
   */
  it("una respuesta que no cubre todo lo que hoy se pregunta, tampoco", () => {
    const incompleta = JSON.stringify({
      choices: {},
      decidedAt: new Date().toISOString(),
      version: CONSENT_VERSION,
    });

    expect(parseConsent(incompleta)).toBeNull();
  });

  it.each([
    ["no es JSON", "{lo que sea"],
    ["sin las respuestas", JSON.stringify({ version: CONSENT_VERSION })],
    [
      "con un valor inventado",
      JSON.stringify({ choices: { measurement: "quizás" }, version: CONSENT_VERSION }),
    ],
  ])("un valor corrupto (%s) se trata como si no estuviera", (_caso, guardado) => {
    expect(parseConsent(guardado)).toBeNull();
  });
});

describe("fromChoices", () => {
  /** Lo que no se marca queda denegado: el consentimiento no se presupone. */
  it("lo que no se marca, no se concede", () => {
    const decision = fromChoices({});

    for (const categoria of ASKED_CATEGORIES) {
      expect(isGranted(decision, categoria)).toBe(false);
    }
  });

  it("y lo que se marca, sí", () => {
    expect(isGranted(fromChoices({ measurement: true }), "measurement")).toBe(true);
  });
});

describe("isGranted", () => {
  /** Quien todavía no ha dicho que sí, no ha dicho que sí. */
  it("sin respuesta, nada está concedido", () => {
    expect(isGranted(null, "measurement")).toBe(false);
    expect(isGranted(null, "analytics")).toBe(false);
  });

  /**
   * `analytics` no se pregunta mientras Google Analytics no esté configurado,
   * así que ni siquiera un «aceptar todo» lo concede. Es lo que impide que un
   * permiso dado hoy sirva para cargar mañana algo que la persona no vio.
   */
  it("aceptar todo no concede lo que hoy no se pregunta", () => {
    const decision = grantAll();

    expect(isGranted(decision, "measurement")).toBe(true);
    if (!ASKED_CATEGORIES.includes("analytics")) {
      expect(isGranted(decision, "analytics")).toBe(false);
    }
  });
});

describe("readConsent / writeConsent", () => {
  it("lo guardado se vuelve a leer", () => {
    writeConsent(grantAll());

    expect(isGranted(readConsent(), "measurement")).toBe(true);
  });

  it("guarda cuándo se decidió, para poder demostrarlo", () => {
    writeConsent(grantAll());

    expect(readConsent()?.decidedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
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

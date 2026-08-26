import { describe, expect, it } from "vitest";
import { isValidUsername, looksLikeEmail, normalizeUsername } from "./username";

describe("normalizeUsername", () => {
  it("quita espacios y baja a minúsculas", () => {
    expect(normalizeUsername("  AnA_87 ")).toBe("ana_87");
  });
});

describe("isValidUsername", () => {
  it.each(["ana", "ana_87", "pedro_jesus_molina", "a1_"])("«%s» vale", (nombre) => {
    expect(isValidUsername(nombre)).toBe(true);
  });

  /**
   * Las mismas reglas que `profiles_username_format` en la migración 0016.
   * Aquí sólo se adelanta el «no» para no gastar un viaje de red; la base de
   * datos sigue siendo la autoridad, que es la única que no se puede saltar.
   */
  it.each([
    ["jo", "demasiado corto"],
    ["a".repeat(21), "demasiado largo"],
    ["con espacio", "espacios"],
    ["con-guion", "guion normal"],
    ["josé", "acentos"],
    ["ana@ejemplo.com", "arroba"],
    ["", "vacío"],
  ])("«%s» no vale (%s)", (nombre) => {
    expect(isValidUsername(nombre)).toBe(false);
  });

  it("las mayúsculas no lo invalidan: se normalizan antes", () => {
    expect(isValidUsername("ANA_87")).toBe(true);
  });
});

/**
 * Es lo que permite tener un solo campo al entrar en vez de obligar a acertar
 * la pestaña antes de escribir.
 */
describe("looksLikeEmail", () => {
  it("distingue por la arroba, que es lo único que hace falta aquí", () => {
    expect(looksLikeEmail("ana@ejemplo.com")).toBe(true);
    expect(looksLikeEmail("ana_87")).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { createSessionToken, isSessionValid } from "./session";

const SECRETO = "scrypt$32768$8$1$abc$def";
const AHORA = 1_800_000_000_000;
const UNA_HORA = 60 * 60 * 1000;

describe("sesión del panel", () => {
  it("un token recién hecho vale", () => {
    const token = createSessionToken(SECRETO, AHORA + UNA_HORA);

    expect(isSessionValid(SECRETO, token, AHORA)).toBe(true);
  });

  it("caduca", () => {
    const token = createSessionToken(SECRETO, AHORA + UNA_HORA);

    expect(isSessionValid(SECRETO, token, AHORA + UNA_HORA + 1)).toBe(false);
  });

  // Lo que impide que alguien se fabrique una sesión: puede leer la cookie
  // —no está cifrada— pero no puede firmar otra fecha sin el secreto.
  it("no se puede alargar la caducidad a mano", () => {
    const token = createSessionToken(SECRETO, AHORA + UNA_HORA);
    const firma = token.split(".")[1];
    const falsificado = `${AHORA + 10 * UNA_HORA}.${firma}`;

    expect(isSessionValid(SECRETO, falsificado, AHORA)).toBe(false);
  });

  /**
   * La clave de firma se deriva del hash de la contraseña, así que esto sale
   * gratis: al cambiar la contraseña, las sesiones abiertas dejan de valer sin
   * llevar ningún registro de sesiones.
   */
  it("cambiar la contraseña invalida lo que hubiera abierto", () => {
    const token = createSessionToken(SECRETO, AHORA + UNA_HORA);

    expect(isSessionValid("scrypt$32768$8$1$otra$cosa", token, AHORA)).toBe(false);
  });

  it.each([
    ["sin cookie", undefined],
    ["vacío", ""],
    ["sin punto", "1800000000000"],
    ["sin fecha", ".firma"],
    ["con una fecha que no lo es", "mañana.firma"],
    ["con la firma vacía", "1800003600000."],
  ])("rechaza un token %s", (_caso, token) => {
    expect(isSessionValid(SECRETO, token, AHORA)).toBe(false);
  });

  it("sin secreto no vale nada, ni siquiera un token bien formado", () => {
    const token = createSessionToken(SECRETO, AHORA + UNA_HORA);

    expect(isSessionValid("", token, AHORA)).toBe(false);
  });
});

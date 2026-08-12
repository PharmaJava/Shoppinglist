import { describe, expect, it } from "vitest";
import { hashPassword, normalizePassword, verifyPassword } from "./password";

// scrypt con N=2^15 tarda ~100 ms por llamada y aquí se llama varias veces.
const LENTO = 20_000;

describe("hashPassword", () => {
  it(
    "la contraseña no aparece en el hash",
    async () => {
      const hash = await hashPassword("@TuLista123!ñ");

      expect(hash).not.toContain("@TuLista123");
      expect(hash).toMatch(/^scrypt\$32768\$8\$1\$[0-9a-f]{32}\$[0-9a-f]{64}$/);
    },
    LENTO,
  );

  // Sin sal, dos personas con la misma contraseña tendrían el mismo hash y
  // una tabla precalculada las abriría las dos de golpe.
  it(
    "la misma contraseña da hashes distintos cada vez",
    async () => {
      const [a, b] = await Promise.all([
        hashPassword("misma-contraseña"),
        hashPassword("misma-contraseña"),
      ]);

      expect(a).not.toBe(b);
      expect(await verifyPassword("misma-contraseña", a)).toBe(true);
      expect(await verifyPassword("misma-contraseña", b)).toBe(true);
    },
    LENTO,
  );
});

describe("verifyPassword", () => {
  it(
    "acepta la buena y rechaza la mala",
    async () => {
      const hash = await hashPassword("@TuLista123!ñ");

      expect(await verifyPassword("@TuLista123!ñ", hash)).toBe(true);
      expect(await verifyPassword("@TuLista123!n", hash)).toBe(false);
      expect(await verifyPassword("@tulista123!ñ", hash)).toBe(false);
      expect(await verifyPassword("", hash)).toBe(false);
    },
    LENTO,
  );

  /**
   * La contraseña lleva una «ñ», y en Unicode se puede escribir de dos formas
   * distintas que se ven idénticas: un carácter (NFC) o «n» + tilde combinante
   * (NFD). Un teclado de iPhone puede mandar una y el de un portátil la otra.
   * Sin normalizar, la contraseña correcta fallaría según desde dónde se
   * escriba, y sería imposible de diagnosticar mirando la pantalla.
   */
  it(
    "la «ñ» descompuesta también entra",
    async () => {
      const compuesta = "@TuLista123!ñ"; // ñ
      const descompuesta = "@TuLista123!ñ"; // n + ̃
      expect(compuesta).not.toBe(descompuesta);

      const hash = await hashPassword(compuesta);
      expect(await verifyPassword(descompuesta, hash)).toBe(true);
    },
    LENTO,
  );

  // Un panel de administración que devuelve un 500 le está diciendo a quien
  // llama que ha encontrado algo raro. Mejor un `false` seco.
  it.each([
    ["vacío", ""],
    ["sin prefijo", "bcrypt$1$2$3$aa$bb"],
    ["con partes de menos", "scrypt$32768$8$1$aa"],
    ["con la sal vacía", "scrypt$32768$8$1$$bb"],
    ["con basura", "esto no es un hash"],
  ])("no revienta con un hash %s", async (_caso, guardado) => {
    expect(await verifyPassword("lo que sea", guardado)).toBe(false);
  });
});

describe("normalizePassword", () => {
  it("deja las dos formas de la ñ en la misma", () => {
    expect(normalizePassword("ñ")).toBe("ñ");
  });
});

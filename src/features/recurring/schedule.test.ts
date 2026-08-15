import { generateKeyBetween } from "fractional-indexing";
import { describe, expect, it } from "vitest";
import { diasHasta, fechaLarga, nombreDia, valoresPorDefecto } from "./schedule";

describe("valoresPorDefecto", () => {
  // Quien programa la compra un viernes suele querer «los viernes»; proponer
  // un lunes fijo obliga a corregirlo a casi todo el mundo.
  it("propone el día de hoy", () => {
    // 2026-08-21 es viernes: 5 en ISO.
    expect(valoresPorDefecto(new Date(2026, 7, 21)).weekday).toBe(5);
  });

  // `getDay()` devuelve 0 el domingo y la base de datos usa ISO, donde es 7.
  // Sin la conversión, programar en domingo daría un día que no existe.
  it("el domingo es 7, no 0", () => {
    expect(valoresPorDefecto(new Date(2026, 7, 23)).weekday).toBe(7);
  });

  it("el día del mes se topa en 28, como en la base de datos", () => {
    expect(valoresPorDefecto(new Date(2026, 7, 31)).dayOfMonth).toBe(28);
    expect(valoresPorDefecto(new Date(2026, 7, 15)).dayOfMonth).toBe(15);
  });
});

describe("nombreDia", () => {
  /**
   * Cada idioma escribe los días a su manera: en español van en minúscula
   * («los viernes») y en inglés en mayúscula («on Friday»). Forzar una de las
   * dos formas estropea la otra, así que se deja lo que da `Intl`.
   */
  it("da el día en la forma correcta de cada idioma", () => {
    expect(nombreDia(5, "es")).toBe("viernes");
    expect(nombreDia(5, "en")).toBe("Friday");
    expect(nombreDia(1, "es")).toBe("lunes");
    expect(nombreDia(7, "es")).toBe("domingo");
  });
});

describe("fechaLarga", () => {
  it("dice el día de la semana y la fecha, sin año", () => {
    expect(fechaLarga("2026-08-21", "es")).toBe("viernes, 21 de agosto");
    expect(fechaLarga("2026-08-21", "en")).toBe("Friday, August 21");
  });
});

describe("diasHasta", () => {
  /**
   * Días naturales y no horas: entre las 23:00 de hoy y las 08:00 de mañana
   * hay «un día», no cero. Mismo criterio que la caducidad de la despensa.
   */
  it("cuenta días de calendario, no periodos de 24 horas", () => {
    const casiMedianoche = new Date(2026, 7, 20, 23, 30);
    expect(diasHasta("2026-08-21", casiMedianoche)).toBe(1);
    expect(diasHasta("2026-08-20", casiMedianoche)).toBe(0);
  });

  it("lo que ya pasó sale negativo", () => {
    expect(diasHasta("2026-08-18", new Date(2026, 7, 20))).toBe(-2);
  });

  it("cruza el cambio de mes sin despeinarse", () => {
    expect(diasHasta("2026-09-01", new Date(2026, 7, 30))).toBe(2);
  });
});

/**
 * Las listas recurrentes las crea SQL (`run_recurring_list`, migración 0012),
 * así que las claves de orden de sus productos también salen de SQL, de
 * `sort_key_at`. Esa función es un espejo de lo que hace `fractional-indexing`
 * en el cliente, y aquí se comprueba que el espejo no está roto: si un día
 * dejaran de encajar, el primer producto que alguien añadiera a mano a una
 * lista automática reventaría al validar la clave anterior.
 */
describe("las claves que genera sort_key_at en SQL", () => {
  /** Copia en JavaScript de `public.sort_key_at`. Cambiar una obliga a la otra. */
  function sortKeyAt(indice: number): string {
    const digitos = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    let resto = indice;
    let clave = "";
    for (let i = 0; i < 3; i++) {
      clave = digitos[resto % 62] + clave;
      resto = Math.floor(resto / 62);
    }
    return `c${clave}`;
  }

  it("son las que da la migración", () => {
    // Comprobadas contra PostgreSQL 16 con las doce migraciones aplicadas.
    expect([sortKeyAt(1), sortKeyAt(62), sortKeyAt(300)]).toEqual(["c001", "c010", "c04q"]);
  });

  it("la librería las acepta y sabe seguir a partir de ellas", () => {
    expect(generateKeyBetween(sortKeyAt(1), null)).toBe("c002");
    expect(generateKeyBetween(sortKeyAt(300), null)).toBe("c04r");
    // Y entre dos consecutivas cabe otra, que es de lo que va todo esto.
    expect(generateKeyBetween(sortKeyAt(1), sortKeyAt(2))).toBe("c001V");
  });

  it("ordenan como el índice del que salen", () => {
    const claves = [1, 2, 61, 62, 63, 299, 300].map(sortKeyAt);
    expect([...claves].sort()).toEqual(claves);
  });
});

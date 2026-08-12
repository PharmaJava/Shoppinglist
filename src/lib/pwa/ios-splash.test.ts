import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { IOS_SPLASH_DEVICES, iosStartupImages, splashPath } from "./ios-splash";

const publico = resolve(import.meta.dirname, "../../../public");

function dimensiones(ruta: string): string {
  const png = readFileSync(resolve(publico, ruta.replace(/^\//, "")));
  return `${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`;
}

describe("pantallas de arranque de iOS", () => {
  // Safari descarta sin avisar la imagen que no mida exactamente lo que dice
  // la media query, y el resultado —un arranque en blanco— es indistinguible
  // de no haberlas puesto. Sólo se ve en un iPhone de verdad; aquí no.
  it("cada dispositivo declarado tiene su imagen, y del tamaño exacto", () => {
    for (const dispositivo of IOS_SPLASH_DEVICES) {
      const ruta = splashPath(dispositivo);
      const esperado = `${dispositivo.ancho * dispositivo.dpr}x${dispositivo.alto * dispositivo.dpr}`;

      expect(() => dimensiones(ruta), `${dispositivo.modelo} · ${ruta}`).not.toThrow();
      expect(dimensiones(ruta), `${dispositivo.modelo} · ${ruta}`).toBe(esperado);
    }
  });

  it("la media query lleva las cuatro condiciones que exige Safari", () => {
    for (const imagen of iosStartupImages()) {
      expect(imagen.media).toMatch(/device-width: \d+px/);
      expect(imagen.media).toMatch(/device-height: \d+px/);
      expect(imagen.media).toMatch(/-webkit-device-pixel-ratio: \d/);
      expect(imagen.media).toContain("orientation: portrait");
    }
  });

  // Dos entradas con la misma media query harían que una de las dos no se
  // usara nunca, y no hay forma de notarlo mirando.
  it("no hay dos dispositivos con la misma media query", () => {
    const medias = iosStartupImages().map((imagen) => imagen.media);
    expect(new Set(medias).size).toBe(medias.length);
  });

  it("cubre los iPhone de uso corriente", () => {
    const cubiertos = new Set(IOS_SPLASH_DEVICES.map((d) => `${d.ancho}x${d.alto}@${d.dpr}`));

    // iPhone SE 2.ª/3.ª, 12/13/14, 14 Pro/15/16 y 15 Pro Max.
    expect(cubiertos).toContain("375x667@2");
    expect(cubiertos).toContain("390x844@3");
    expect(cubiertos).toContain("393x852@3");
    expect(cubiertos).toContain("430x932@3");
  });
});

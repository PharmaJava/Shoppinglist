import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import manifest from "./manifest";

const publico = resolve(import.meta.dirname, "../../public");

/** Ancho y alto de un PNG: están en la cabecera IHDR, bytes 16 a 24. */
function dimensiones(ruta: string): string {
  const png = readFileSync(resolve(publico, ruta.replace(/^\//, "")));
  return `${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`;
}

const m = manifest();

describe("manifest", () => {
  // Un icono que no existe no rompe el build: rompe la instalación, y sólo se
  // ve en un móvil de verdad. Aquí se ve en un segundo.
  it("todos los iconos que declara existen y miden lo que dice", () => {
    for (const icono of m.icons ?? []) {
      expect(() => dimensiones(icono.src), icono.src).not.toThrow();
      expect(dimensiones(icono.src), icono.src).toBe(icono.sizes);
    }
  });

  it("las capturas existen y miden lo que dice", () => {
    for (const captura of m.screenshots ?? []) {
      expect(() => dimensiones(captura.src), captura.src).not.toThrow();
      expect(dimensiones(captura.src), captura.src).toBe(captura.sizes);
    }
  });

  // Chrome exige las dos formas para enseñar el diálogo grande de instalación
  // en Android; con una sola vuelve a la barrita gris de siempre.
  it("hay capturas de móvil y de escritorio", () => {
    const formatos = new Set((m.screenshots ?? []).map((captura) => captura.form_factor));
    expect(formatos).toEqual(new Set(["narrow", "wide"]));
  });

  // Todas las `narrow` tienen que compartir proporción o Chrome las descarta.
  it("las capturas de móvil tienen la misma proporción", () => {
    const proporciones = (m.screenshots ?? [])
      .filter((captura) => captura.form_factor === "narrow")
      .map((captura) => captura.sizes);

    expect(new Set(proporciones).size).toBe(1);
  });

  it("hay icono maskable, que es el que Android recorta a su forma", () => {
    const maskable = (m.icons ?? []).filter((icono) => icono.purpose === "maskable");
    expect(maskable.map((icono) => icono.sizes)).toContain("512x512");
  });

  // Cambiar `id` después de publicar convierte la app instalada en otra app
  // distinta para el navegador. Este test está para que se piense dos veces.
  it("la identidad de la app no cambia", () => {
    expect(m.id).toBe("/");
    expect(m.scope).toBe("/");
    expect(m.start_url).toBe("/");
  });

  it("los atajos apuntan a rutas con idioma, que es lo único que resuelve", () => {
    for (const atajo of m.shortcuts ?? []) {
      expect(atajo.url, atajo.name).toMatch(/^\/(es|en)(\/|\?|$)/);
    }
  });
});

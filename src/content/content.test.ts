import { describe, expect, it } from "vitest";
import { getGuideByKey, getGuides, getTemplateByKey, getTemplates } from "./index";
import { countTemplateItems, flattenTemplateItems } from "./types";

const LOCALES = ["es", "en"] as const;

describe("coherencia del contenido entre idiomas", () => {
  // Si una pieza existe en un idioma y no en el otro, los alternates de
  // hreflang apuntarían a una URL inexistente. Falla en silencio en producción,
  // así que se comprueba aquí.
  it("toda plantilla tiene equivalente en el otro idioma", () => {
    for (const locale of LOCALES) {
      const other = locale === "es" ? "en" : "es";
      for (const template of getTemplates(locale)) {
        expect(
          getTemplateByKey(other, template.key),
          `falta ${template.key} en ${other}`,
        ).toBeDefined();
      }
    }
  });

  it("toda guía tiene equivalente en el otro idioma", () => {
    for (const locale of LOCALES) {
      const other = locale === "es" ? "en" : "es";
      for (const guide of getGuides(locale)) {
        expect(getGuideByKey(other, guide.key), `falta ${guide.key} en ${other}`).toBeDefined();
      }
    }
  });

  it("los slugs no se repiten dentro de un idioma", () => {
    for (const locale of LOCALES) {
      const slugs = [...getTemplates(locale), ...getGuides(locale)].map((entry) => entry.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
    }
  });

  it("los enlaces internos apuntan a piezas que existen", () => {
    for (const locale of LOCALES) {
      for (const entry of [...getTemplates(locale), ...getGuides(locale)]) {
        for (const key of entry.relatedTemplates) {
          expect(getTemplateByKey(locale, key), `${entry.slug} → ${key}`).toBeDefined();
        }
        for (const key of entry.relatedGuides) {
          expect(getGuideByKey(locale, key), `${entry.slug} → ${key}`).toBeDefined();
        }
      }
    }
  });
});

describe("plantillas", () => {
  it("ninguna plantilla se enlaza a sí misma como relacionada", () => {
    for (const locale of LOCALES) {
      for (const template of getTemplates(locale)) {
        expect(template.relatedTemplates).not.toContain(template.key);
      }
    }
  });

  it("aplanar las secciones conserva todos los productos y su categoría", () => {
    for (const locale of LOCALES) {
      for (const template of getTemplates(locale)) {
        const flat = flattenTemplateItems(template);
        expect(flat).toHaveLength(countTemplateItems(template));
        expect(flat.every((item) => item.categoryId.length > 0)).toBe(true);
      }
    }
  });
});

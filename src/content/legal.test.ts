import { describe, expect, it } from "vitest";
import { getPrivacy, getTerms } from "./index";
import { type LegalDocument, OPERATOR_PLACEHOLDER } from "./types";

const LOCALES = ["es", "en"] as const;

function placeholdersIn(doc: LegalDocument): string[] {
  const text = doc.blocks
    .flatMap((block) => [...block.paragraphs, ...(block.bullets ?? [])])
    .join(" ");

  return [...text.matchAll(new RegExp(OPERATOR_PLACEHOLDER, "g"))].map((match) => match[0]).sort();
}

describe("documentos legales", () => {
  // Los marcadores ya están rellenos. El test cambia de sentido: antes vigilaba
  // que no se rellenara un idioma y se olvidara el otro; ahora, que no vuelva a
  // colarse un `[HUECO]` al editar los textos. Publicar una política con
  // corchetes es peor que no tenerla.
  it("no queda ningún dato del responsable sin rellenar", () => {
    for (const locale of LOCALES) {
      expect(placeholdersIn(getPrivacy(locale)), `privacidad en ${locale}`).toEqual([]);
      expect(placeholdersIn(getTerms(locale)), `términos en ${locale}`).toEqual([]);
    }
  });

  // Quien lee una política necesita saber a quién escribir. Que exista el dato
  // en un idioma y no en el otro es el descuido realista.
  it("ambos documentos dicen a quién dirigirse, en los dos idiomas", () => {
    for (const locale of LOCALES) {
      for (const doc of [getPrivacy(locale), getTerms(locale)]) {
        const text = doc.blocks
          .flatMap((block) => [...block.paragraphs, ...(block.bullets ?? [])])
          .join(" ");

        expect(text, `${doc.slug} en ${locale}`).toContain("Antonio");
        expect(text, `${doc.slug} en ${locale}`).toContain("linkedin.com/in/farmaiant");
      }
    }
  });

  it("todo documento legal declara fecha de revisión y descripción", () => {
    for (const locale of LOCALES) {
      for (const doc of [getPrivacy(locale), getTerms(locale)]) {
        expect(doc.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(doc.metaDescription.length).toBeGreaterThan(50);
        expect(doc.blocks.length).toBeGreaterThan(3);
      }
    }
  });
});

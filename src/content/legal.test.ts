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
  // El fallo realista no es olvidar los marcadores, sino rellenarlos en un
  // idioma y no en el otro: quedaría publicada una política a medias sin que
  // nada avise. Se compara la cantidad, no el texto, porque los marcadores
  // están escritos en el idioma de cada documento.
  it("privacidad tiene los mismos datos pendientes en ambos idiomas", () => {
    const counts = LOCALES.map((locale) => placeholdersIn(getPrivacy(locale)).length);
    expect(counts[0]).toBe(counts[1]);
  });

  it("términos tiene los mismos datos pendientes en ambos idiomas", () => {
    const counts = LOCALES.map((locale) => placeholdersIn(getTerms(locale)).length);
    expect(counts[0]).toBe(counts[1]);
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

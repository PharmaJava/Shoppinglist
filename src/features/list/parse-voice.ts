import type { Locale } from "@/lib/supabase/types";

export interface ParsedVoiceItem {
  name: string;
  qty: number | null;
  unit: string | null;
}

const SEPARATORS: Record<Locale, RegExp> = {
  es: /,| y | e (?=[aeiouáéíóú])/gi,
  en: /,| and /gi,
};

const NUMBER_WORDS: Record<Locale, Record<string, number>> = {
  es: {
    un: 1,
    uno: 1,
    una: 1,
    dos: 2,
    tres: 3,
    cuatro: 4,
    cinco: 5,
    seis: 6,
    siete: 7,
    ocho: 8,
    nueve: 9,
    diez: 10,
    docena: 12,
  },
  en: {
    a: 1,
    an: 1,
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    dozen: 12,
  },
};

const CONNECTOR_WORDS: Record<Locale, string> = {
  es: "de",
  en: "of",
};

const UNIT_WORDS: Record<Locale, string[]> = {
  es: [
    "kg",
    "kilo",
    "kilos",
    "g",
    "gr",
    "gramo",
    "gramos",
    "l",
    "litro",
    "litros",
    "paquete",
    "paquetes",
    "lata",
    "latas",
    "botella",
    "botellas",
    "docena",
    "docenas",
    "barra",
    "barras",
  ],
  en: [
    "kg",
    "kilo",
    "kilos",
    "g",
    "gram",
    "grams",
    "l",
    "liter",
    "liters",
    "litre",
    "litres",
    "pack",
    "packs",
    "can",
    "cans",
    "bottle",
    "bottles",
    "dozen",
    "dozens",
    "loaf",
    "loaves",
  ],
};

/**
 * Convierte una transcripción de voz en una lista de productos.
 * Heurística deliberadamente simple (docs/00-PLAN.md §7.2): separa por comas
 * y conjunción, y extrae una cantidad + unidad iniciales si las hay.
 * "dos litros de leche y pan" → [{name:"leche", qty:2, unit:"litros"}, {name:"pan"}]
 */
export function parseVoiceTranscript(transcript: string, locale: Locale): ParsedVoiceItem[] {
  const segments = transcript
    .toLowerCase()
    .split(SEPARATORS[locale])
    .map((segment) => segment.trim())
    .filter(Boolean);

  return segments.map((segment) => parseSegment(segment, locale));
}

function parseSegment(segment: string, locale: Locale): ParsedVoiceItem {
  const words = segment.split(/\s+/);
  const numberWords = NUMBER_WORDS[locale];
  const unitWords = UNIT_WORDS[locale];

  let qty: number | null = null;
  let cursor = 0;

  const first = words[0];
  if (first) {
    const digit = Number.parseFloat(first.replace(",", "."));
    if (!Number.isNaN(digit) && /^\d/.test(first)) {
      qty = digit;
      cursor = 1;
    } else if (first in numberWords) {
      qty = numberWords[first] ?? null;
      cursor = 1;
    }
  }

  let unit: string | null = null;
  const next = words[cursor];
  if (qty !== null && next && unitWords.includes(next)) {
    unit = next;
    cursor += 1;
  }

  // "dos litros de leche" / "two liters of milk": la preposición que queda
  // pegada tras la unidad no aporta nada al nombre del producto.
  const connector = CONNECTOR_WORDS[locale];
  const rest = words
    .slice(cursor)
    .filter((word) => word !== connector)
    .join(" ")
    .trim();

  const name = rest || segment;

  return {
    name: capitalize(name),
    qty,
    unit,
  };
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

import type { Locale } from "@/lib/supabase/types";
import { isKnownProduct } from "./categorize";

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

/** Viñetas con las que la gente pega listas desde notas o desde un chat. */
const BULLET = /^[\s\u00a0]*[-–—*•·+]+\s*/;

/**
 * Convierte texto libre en una lista de productos, venga dictado, escrito o
 * pegado de otro sitio.
 *
 * Heurística deliberadamente simple (docs/00-PLAN.md §7.2): separa por saltos
 * de línea y por comas y conjunción, y reconoce la cantidad escrita como la
 * escribe la gente —al principio al dictar ("dos litros de leche"), al final
 * al teclear ("carne picada 500 g", "tomates x3", "huevos 24").
 *
 * El salto de línea manda sobre todo lo demás: una lista pegada desde las
 * notas del móvil viene con un producto por línea y sin una sola coma, y hasta
 * ahora entraba entera como un único producto llamado "agua gazpacho
 * chocolate galletas…".
 *
 * Y cuando no hay ni comas ni saltos —"leche pan tomate", escrito de un tirón
 * en la portada— se separa por palabras, pero sólo si todas son productos
 * conocidos (ver `separarProductosSueltos`).
 */
export function parseVoiceTranscript(transcript: string, locale: Locale): ParsedVoiceItem[] {
  const segments = transcript
    .toLowerCase()
    // En español la coma es a la vez separador de productos y separador
    // decimal: sin esto, "queso 1,5 kg" se parte en dos productos. Se pasa a
    // punto antes de separar. Se hace por sustitución y no con un lookbehind
    // en el separador porque Safari no los soporta hasta la 16.4.
    .replace(/(\d),(\d)/g, "$1.$2")
    // Primero las líneas; dentro de cada una siguen valiendo comas y
    // conjunciones, para que «pan y leche» en una sola línea se parta igual.
    .split(/\r?\n/)
    .flatMap((line) => line.split(SEPARATORS[locale]))
    .map((segment) => segment.replace(BULLET, "").trim())
    .filter(Boolean)
    .flatMap((segment) => separarProductosSueltos(segment, locale));

  return dedupe(segments.map((segment) => parseSegment(segment, locale)));
}

/**
 * "leche pan tomate" son tres cosas, no una.
 *
 * Escribir sin comas es lo natural cuando se va rápido, y hasta ahora eso
 * creaba un único producto llamado "Leche pan tomate". Pero separar por
 * espacios a secas rompería "carne picada", "papel higiénico" o "queso de
 * cabra", que son un producto con nombre de dos palabras y son igual de
 * frecuentes.
 *
 * La regla que distingue un caso del otro: se parte **sólo si cada palabra,
 * ella sola, es un producto conocido** —del diccionario o del catálogo—. En
 * "carne picada", "picada" no lo es, así que no se toca. Equivocarse hacia
 * este lado es lo correcto: dejar junto lo que iba separado se arregla
 * borrando una línea; partir "carne picada" en dos deja al usuario con dos
 * productos que no existen.
 *
 * Las cantidades no estorban: un número o un "de" nunca es un producto
 * conocido, así que "dos litros de leche" ni se plantea partirse.
 */
function separarProductosSueltos(segment: string, locale: Locale): string[] {
  const words = segment.split(/\s+/).filter(Boolean);
  if (words.length < 2) return [segment];
  if (!words.every((word) => isKnownProduct(word, locale))) return [segment];

  return words;
}

/**
 * Quita los repetidos de una misma tanda.
 *
 * Una lista pegada casi siempre trae duplicados —se apunta «gazpacho» el lunes
 * y otra vez el jueves— y tres líneas iguales en la lista de la compra no
 * significan tres gazpachos: significan que hay que comprar gazpacho. Quien
 * quiera dos escribe «gazpacho x2», que el parser ya entiende.
 *
 * Se conserva la primera aparición, pero hereda la cantidad de cualquiera de
 * las repetidas: al pegar «agua» y más abajo «agua 6», lo que se quería decir
 * era seis.
 */
function dedupe(items: ParsedVoiceItem[]): ParsedVoiceItem[] {
  const byName = new Map<string, ParsedVoiceItem>();

  for (const item of items) {
    const key = item.name.toLowerCase();
    const seen = byName.get(key);

    if (!seen) {
      byName.set(key, item);
      continue;
    }
    if (seen.qty === null && item.qty !== null) {
      byName.set(key, { ...seen, qty: item.qty, unit: item.unit });
    }
  }

  return [...byName.values()];
}

interface Amount {
  qty: number;
  unit: string | null;
  /** Palabras que ocupa, para saber qué queda como nombre. */
  words: number;
}

function parseSegment(segment: string, locale: Locale): ParsedVoiceItem {
  // "tomates x3": multiplicador al final. Es unidades, nunca peso, así que no
  // lleva unidad asociada.
  const multiplier = segment.match(/[x×]\s*(\d+(?:[.,]\d+)?)\s*$/);
  if (multiplier?.index !== undefined && multiplier[1]) {
    const name = segment.slice(0, multiplier.index).trim();
    if (name) return { name: capitalize(name), qty: toNumber(multiplier[1]), unit: null };
  }

  const words = segment.split(/\s+/);
  const connector = CONNECTOR_WORDS[locale];

  // Cantidad al principio: "dos litros de leche", "500 g de carne picada".
  const leading = readAmount(words, 0, locale);
  if (leading) {
    const rest = words
      .slice(leading.words)
      .filter((word) => word !== connector)
      .join(" ")
      .trim();
    if (rest) return { name: capitalize(rest), qty: leading.qty, unit: leading.unit };
  }

  // Cantidad al final: "carne picada 500 g", "leche 2 litros", "arroz 1kg".
  // Se recorre hacia atrás buscando un punto desde el que la cantidad llegue
  // justo hasta el final; así "2 latas de atún 400 g" no confunde las dos.
  for (let start = words.length - 1; start >= 1; start -= 1) {
    const trailing = readAmount(words, start, locale);
    if (trailing && start + trailing.words === words.length) {
      const rest = words.slice(0, start).join(" ").trim();
      if (rest) return { name: capitalize(rest), qty: trailing.qty, unit: trailing.unit };
    }
  }

  return { name: capitalize(segment), qty: null, unit: null };
}

/** Lee una cantidad (y su unidad, si la lleva) empezando en `index`. */
function readAmount(words: string[], index: number, locale: Locale): Amount | null {
  const token = words[index];
  if (!token) return null;

  const unitWords = UNIT_WORDS[locale];
  const numberWords = NUMBER_WORDS[locale];

  // "500g", "1,5kg": número y unidad pegados, como se teclea de verdad.
  const glued = token.match(/^(\d+(?:[.,]\d+)?)([a-zá-ú]+)$/);
  if (glued?.[1] && glued[2] && unitWords.includes(glued[2])) {
    return { qty: toNumber(glued[1]), unit: glued[2], words: 1 };
  }

  let qty: number | null = null;
  if (/^\d/.test(token)) {
    const parsed = toNumber(token);
    if (!Number.isNaN(parsed)) qty = parsed;
  } else if (token in numberWords) {
    qty = numberWords[token] ?? null;
  }
  if (qty === null) return null;

  const next = words[index + 1];
  if (next && unitWords.includes(next)) return { qty, unit: next, words: 2 };

  return { qty, unit: null, words: 1 };
}

function toNumber(text: string): number {
  return Number.parseFloat(text.replace(",", "."));
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

import type { Locale } from "@/lib/supabase/types";

export function normalizeProductName(name: string): string {
  return name.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/**
 * Diccionario de arranque para asignar categoría/pasillo automáticamente.
 * Cubre los productos más comunes de la cesta semanal en cada mercado.
 * TODO(F1-3): mover a la tabla `products` (~500 por idioma) con búsqueda
 * difusa (pg_trgm) en vez de este mapa en memoria.
 */
const KEYWORDS: Record<Locale, Record<string, string>> = {
  es: {
    tomate: "produce",
    tomates: "produce",
    lechuga: "produce",
    cebolla: "produce",
    patata: "produce",
    patatas: "produce",
    platano: "produce",
    platanos: "produce",
    manzana: "produce",
    manzanas: "produce",
    naranja: "produce",
    naranjas: "produce",
    pimiento: "produce",
    zanahoria: "produce",
    aguacate: "produce",
    ajo: "produce",
    limon: "produce",
    fresas: "produce",
    pan: "bakery",
    baguette: "bakery",
    bolleria: "bakery",
    croissant: "bakery",
    leche: "dairy",
    yogur: "dairy",
    yogures: "dairy",
    queso: "dairy",
    huevos: "dairy",
    mantequilla: "dairy",
    nata: "dairy",
    pollo: "meat",
    ternera: "meat",
    cerdo: "meat",
    carne: "meat",
    salchichas: "meat",
    pescado: "fish",
    salmon: "fish",
    atun: "fish",
    gambas: "fish",
    jamon: "deli",
    chorizo: "deli",
    embutido: "deli",
    helado: "frozen",
    congelado: "frozen",
    pizza: "frozen",
    arroz: "pantry",
    pasta: "pantry",
    aceite: "pantry",
    sal: "pantry",
    azucar: "pantry",
    harina: "pantry",
    lentejas: "pantry",
    garbanzos: "pantry",
    conservas: "pantry",
    agua: "drinks",
    zumo: "drinks",
    cerveza: "drinks",
    vino: "drinks",
    refresco: "drinks",
    cafe: "drinks",
    patatas_fritas: "snacks",
    chocolate: "snacks",
    galletas: "snacks",
    caramelos: "snacks",
    cereales: "breakfast",
    mermelada: "breakfast",
    lavavajillas: "cleaning",
    detergente: "cleaning",
    papel_higienico: "cleaning",
    lejia: "cleaning",
    champu: "personal",
    jabon: "personal",
    pasta_de_dientes: "personal",
    panales: "baby",
    toallitas: "baby",
    pienso: "pet",
  },
  en: {
    tomato: "produce",
    tomatoes: "produce",
    lettuce: "produce",
    onion: "produce",
    potato: "produce",
    potatoes: "produce",
    banana: "produce",
    bananas: "produce",
    apple: "produce",
    apples: "produce",
    orange: "produce",
    oranges: "produce",
    pepper: "produce",
    carrot: "produce",
    avocado: "produce",
    garlic: "produce",
    lemon: "produce",
    strawberries: "produce",
    bread: "bakery",
    baguette: "bakery",
    croissant: "bakery",
    milk: "dairy",
    yogurt: "dairy",
    cheese: "dairy",
    eggs: "dairy",
    butter: "dairy",
    cream: "dairy",
    chicken: "meat",
    beef: "meat",
    pork: "meat",
    meat: "meat",
    sausages: "meat",
    fish: "fish",
    salmon: "fish",
    tuna: "fish",
    shrimp: "fish",
    ham: "deli",
    salami: "deli",
    deli: "deli",
    "ice cream": "frozen",
    frozen: "frozen",
    pizza: "frozen",
    rice: "pantry",
    pasta: "pantry",
    oil: "pantry",
    salt: "pantry",
    sugar: "pantry",
    flour: "pantry",
    lentils: "pantry",
    beans: "pantry",
    canned: "pantry",
    water: "drinks",
    juice: "drinks",
    beer: "drinks",
    wine: "drinks",
    soda: "drinks",
    coffee: "drinks",
    chips: "snacks",
    chocolate: "snacks",
    cookies: "snacks",
    candy: "snacks",
    cereal: "breakfast",
    jam: "breakfast",
    "dish soap": "cleaning",
    detergent: "cleaning",
    "toilet paper": "cleaning",
    bleach: "cleaning",
    shampoo: "personal",
    soap: "personal",
    toothpaste: "personal",
    diapers: "baby",
    wipes: "baby",
    "pet food": "pet",
  },
};

const OTHER_CATEGORY = "other";

/**
 * El otro idioma, para cuando el del móvil no es el que se escribe.
 *
 * Caso real: una persona con el móvil en inglés escribiendo su compra en
 * español. La interfaz sale en inglés —eso es correcto— pero los productos
 * («sandía», «nectarina», «plátano») no estaban en ningún diccionario inglés,
 * así que la lista entera caía en «Otros» y el orden por pasillo, que es de lo
 * que vive esta aplicación, no hacía nada.
 *
 * El idioma de la interfaz sigue mandando; el otro es la segunda pasada. No
 * hay conflicto que resolver: las seis palabras que comparten los dos
 * diccionarios (pasta, pizza, chocolate, salmon, baguette, croissant) están en
 * la misma categoría en ambos, y hay una prueba que lo fija.
 */
const OTRO_IDIOMA: Record<Locale, Locale> = { es: "en", en: "es" };

/** Los dos diccionarios, el de la interfaz primero. */
function dictionaries(locale: Locale): Record<string, string>[] {
  return [getDictionary(locale), getDictionary(OTRO_IDIOMA[locale])];
}

/**
 * Entradas cargadas desde la tabla `products` (ver ./catalog.ts), fusionadas
 * en caliente sobre el diccionario estático. Éste último sigue siendo la
 * fuente offline-first: si la carga de red no ha terminado (o falla), la
 * categorización sigue funcionando igual, sólo que con menos cobertura.
 */
const mergedDictionaryCache: Partial<Record<Locale, Record<string, string>>> = {};

export function mergeCatalogEntries(locale: Locale, entries: Record<string, string>): void {
  mergedDictionaryCache[locale] = { ...KEYWORDS[locale], ...entries };
}

function getDictionary(locale: Locale): Record<string, string> {
  return mergedDictionaryCache[locale] ?? KEYWORDS[locale];
}

/**
 * ¿Esta palabra, ella sola, es un producto que conocemos?
 *
 * Coincidencia exacta y nada de parecidos: la usa el parser para decidir si
 * «leche pan tomate» son tres cosas o una sola con nombre largo, y ahí un
 * «casi» convertiría «carne picada» en dos productos. Cubre el diccionario
 * estático y el catálogo de la base de datos, cuando ya ha llegado, **en los
 * dos idiomas**: quien tiene el móvil en inglés y escribe en español también
 * escribe «leche pan tomate».
 */
export function isKnownProduct(word: string, locale: Locale): boolean {
  const normalized = normalizeProductName(word);
  if (!normalized) return false;

  return dictionaries(locale).some((dictionary) => normalized in dictionary);
}

export function categorize(name: string, locale: Locale): string {
  const normalized = normalizeProductName(name);

  // Primero lo exacto en los dos idiomas y sólo después los parecidos: un
  // «contiene» del idioma de la interfaz no puede ganarle a un nombre que en
  // el otro idioma está clavado.
  for (const dictionary of dictionaries(locale)) {
    const exact = dictionary[normalized];
    if (exact) return exact;
  }

  for (const dictionary of dictionaries(locale)) {
    const matchKey = Object.keys(dictionary).find(
      (keyword) => normalized.includes(keyword) || keyword.includes(normalized),
    );
    const found = matchKey && dictionary[matchKey];
    if (found) return found;
  }

  return OTHER_CATEGORY;
}

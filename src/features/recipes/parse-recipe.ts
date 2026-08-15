import type { Locale } from "@/lib/supabase/types";

/**
 * De una receta pegada a la lista de la compra.
 *
 * Heurística, no IA (docs/04-BACKLOG.md, F3-6: «heurística primero, LLM
 * después»). Y el orden importa: una receta pegada de internet tiene una
 * estructura muy reconocible —un encabezado «Ingredientes», una línea por
 * ingrediente, y luego prosa— y resolver eso con un modelo sería pagar por
 * cada receta para hacer peor lo que hacen bien tres expresiones regulares.
 *
 * Lo que **no** hace: entender la receta. No sabe que el sofrito lleva cebolla
 * si no está escrita, ni que «harina de fuerza» y «harina» son lo mismo. Por
 * eso el resultado se enseña antes de crear la lista, para poder quitar lo que
 * sobre.
 */

export interface RecipeIngredient {
  name: string;
  qty: number | null;
  unit: string | null;
  /** La línea de la que sale, tal cual. Sirve para enseñar de dónde viene. */
  raw: string;
}

export interface ParsedRecipe {
  /** El título de la receta, si se puede adivinar: sirve de nombre de la lista. */
  title: string | null;
  /** Para cuántos es la receta, si lo dice. Es lo que permite reescalarla. */
  servings: number | null;
  ingredients: RecipeIngredient[];
}

/** Dónde empiezan los ingredientes. */
const ENCABEZADO_INGREDIENTES: Record<Locale, RegExp> = {
  es: /^(lista de\s+)?ingredientes\b/i,
  en: /^ingredients\b/i,
};

/** Dónde dejan de estar: a partir de aquí es prosa. */
const ENCABEZADO_PASOS: Record<Locale, RegExp> = {
  es: /^(preparaci[óo]n|elaboraci[óo]n|instrucciones|pasos|modo de (preparaci[óo]n|hacerlo)|c[óo]mo se hace)\b/i,
  en: /^(preparation|method|directions|instructions|steps|how to (make|cook))\b/i,
};

const NUMEROS_ESCRITOS: Record<Locale, Record<string, number>> = {
  es: {
    un: 1,
    uno: 1,
    una: 1,
    medio: 0.5,
    media: 0.5,
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
    half: 0.5,
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

/**
 * Unidades de cocina, que son otras que las del súper: nadie compra «dos
 * cucharadas», pero una receta se escribe así y hay que saber leerlo para que
 * el producto no acabe llamándose «cucharadas de aceite».
 */
const UNIDADES: Record<Locale, string[]> = {
  es: [
    "g",
    "gr",
    "gramo",
    "gramos",
    "kg",
    "kilo",
    "kilos",
    "ml",
    "cl",
    "dl",
    "l",
    "litro",
    "litros",
    "cucharada",
    "cucharadas",
    "cda",
    "cdas",
    "cucharadita",
    "cucharaditas",
    "cdta",
    "cdtas",
    "taza",
    "tazas",
    "vaso",
    "vasos",
    "pizca",
    "pizcas",
    "chorro",
    "chorrito",
    "puñado",
    "puñados",
    "diente",
    "dientes",
    "rama",
    "ramas",
    "hoja",
    "hojas",
    "manojo",
    "manojos",
    "lata",
    "latas",
    "bote",
    "botes",
    "sobre",
    "sobres",
    "paquete",
    "paquetes",
    "loncha",
    "lonchas",
    "rodaja",
    "rodajas",
    "filete",
    "filetes",
    "unidad",
    "unidades",
  ],
  en: [
    "g",
    "gram",
    "grams",
    "kg",
    "kilo",
    "kilos",
    "ml",
    "cl",
    "dl",
    "l",
    "liter",
    "liters",
    "litre",
    "litres",
    "tablespoon",
    "tablespoons",
    "tbsp",
    "teaspoon",
    "teaspoons",
    "tsp",
    "cup",
    "cups",
    "glass",
    "glasses",
    "pinch",
    "pinches",
    "handful",
    "handfuls",
    "clove",
    "cloves",
    "sprig",
    "sprigs",
    "leaf",
    "leaves",
    "bunch",
    "bunches",
    "oz",
    "ounce",
    "ounces",
    "lb",
    "pound",
    "pounds",
    "can",
    "cans",
    "jar",
    "jars",
    "packet",
    "packets",
    "pack",
    "packs",
    "slice",
    "slices",
    "stick",
    "sticks",
    "unit",
    "units",
  ],
};

const CONECTOR: Record<Locale, RegExp> = {
  es: /^(de|del|de la|de los|de las)\s+/i,
  en: /^of\s+/i,
};

/** «Sal al gusto» es sal, sin cantidad. La coletilla no es parte del nombre. */
const AL_GUSTO: Record<Locale, RegExp> = {
  es: /\s*,?\s*(al gusto|a gusto|c\.?\s?s\.?|cantidad suficiente|opcional)\s*$/i,
  en: /\s*,?\s*(to taste|as needed|optional)\s*$/i,
};

const RACIONES: Record<Locale, RegExp> = {
  es: /(?:para|rinde|sirve)\s+(\d{1,2})\s*(?:personas?|comensales?|raciones?|porciones?)|(\d{1,2})\s*(?:raciones|personas|comensales|porciones)/i,
  en: /(?:serves|for|makes)\s+(\d{1,2})\s*(?:people|persons?|servings?|portions?)?|(\d{1,2})\s*(?:servings|portions)/i,
};

/**
 * Viñetas y numeraciones con las que vienen las listas de ingredientes.
 *
 * La numeración exige un espacio detrás («1. harina») a propósito: sin él,
 * «1.5 kg de patatas» perdería el «1.» y se quedaría en cinco kilos.
 */
const VINETA = /^[\s\u00a0]*(?:[-–—*•·+]+\s*|\[\s*\]\s*|\d{1,2}[.)]\s+)/;

/** Las fracciones que traen las recetas escritas a mano y las de internet. */
const FRACCIONES: Record<string, string> = {
  "½": "1/2",
  "⅓": "1/3",
  "⅔": "2/3",
  "¼": "1/4",
  "¾": "3/4",
  "⅕": "1/5",
  "⅙": "1/6",
  "⅛": "1/8",
};

export function parseRecipe(texto: string, locale: Locale): ParsedRecipe {
  const lineas = texto
    .split(/\r?\n/)
    .map((linea) => normalizar(linea))
    .filter(Boolean);

  // El título se quita de las candidatas: en una receta sin encabezado
  // «Ingredientes» la primera línea es el nombre del plato, y «Tortilla de
  // patatas» no es algo que se compre.
  const titulo = adivinarTitulo(lineas, locale);
  const candidatas = recortarIngredientes(lineas, locale).filter((linea) => linea !== titulo);

  const ingredientes: RecipeIngredient[] = [];
  const vistos = new Set<string>();

  for (const linea of candidatas) {
    if (!pareceIngrediente(linea, locale)) continue;

    const ingrediente = leerIngrediente(linea, locale);
    if (!ingrediente) continue;

    // Una receta repite el aceite en tres sitios y eso es un aceite, no tres.
    const clave = ingrediente.name.toLowerCase();
    if (vistos.has(clave)) continue;
    vistos.add(clave);

    ingredientes.push(ingrediente);
  }

  return {
    title: titulo,
    servings: leerRaciones(texto, locale),
    ingredients: ingredientes,
  };
}

/**
 * Multiplica las cantidades para otro número de comensales.
 *
 * Lo que no lleva cantidad se queda como está: «sal al gusto» para ocho sigue
 * siendo sal al gusto, y multiplicar por dos una pizca no significa nada.
 */
export function escalarIngredientes(
  ingredientes: RecipeIngredient[],
  factor: number,
): RecipeIngredient[] {
  if (!Number.isFinite(factor) || factor <= 0 || factor === 1) return ingredientes;

  return ingredientes.map((ingrediente) =>
    ingrediente.qty === null
      ? ingrediente
      : // Dos decimales: «0.67 cucharaditas» ya es más precisión de la que
        // tiene una cuchara, y el resto son decimales de coma flotante.
        { ...ingrediente, qty: Math.round(ingrediente.qty * factor * 100) / 100 },
  );
}

function normalizar(linea: string): string {
  let texto = linea.replace(/ /g, " ").trim();
  for (const [signo, fraccion] of Object.entries(FRACCIONES)) {
    // «1½» se escribe pegado y significa «1 1/2».
    texto = texto.replace(new RegExp(signo, "g"), ` ${fraccion} `);
  }
  return texto.replace(/\s+/g, " ").trim();
}

/**
 * Se queda con el trozo que va del encabezado «Ingredientes» al de la
 * preparación. Si no hay encabezados —muchas recetas de blog no los tienen—
 * devuelve todo y que decida `pareceIngrediente`.
 */
function recortarIngredientes(lineas: string[], locale: Locale): string[] {
  const inicio = lineas.findIndex((linea) => ENCABEZADO_INGREDIENTES[locale].test(linea));
  const desde = inicio + 1;

  const relativo = lineas.slice(desde).findIndex((linea) => ENCABEZADO_PASOS[locale].test(linea));
  const hasta = relativo === -1 ? lineas.length : desde + relativo;

  return lineas.slice(desde, hasta);
}

/**
 * Un ingrediente es una línea corta; un paso es una frase.
 *
 * No hay forma de acertar siempre, así que se falla hacia el lado que se puede
 * arreglar de un toque: colar un paso se ve y se quita en la pantalla de
 * repaso, mientras que perder un ingrediente no se nota hasta el súper.
 */
function pareceIngrediente(linea: string, locale: Locale): boolean {
  // «Para la masa:», «Ingredientes:» — encabezados, no ingredientes.
  if (linea.endsWith(":")) return false;
  // «Para 4 personas» dice para cuántos es, no qué comprar.
  if (RACIONES[locale].test(linea) && linea.split(/\s+/).length <= 6) return false;
  if (ENCABEZADO_INGREDIENTES[locale].test(linea) || ENCABEZADO_PASOS[locale].test(linea)) {
    return false;
  }

  const limpia = linea.replace(VINETA, "");
  if (!limpia) return false;

  const palabras = limpia.split(/\s+/).length;
  // Un ingrediente con más de diez palabras no es un ingrediente. Y una frase
  // acabada en punto es prosa salvo que sea muy corta («Sal.»).
  if (palabras > 10) return false;
  if (/[.!?]$/.test(limpia) && palabras > 5) return false;

  return true;
}

function leerIngrediente(linea: string, locale: Locale): RecipeIngredient | null {
  const raw = linea;
  let texto = linea.replace(VINETA, "").trim();

  // Lo que va entre paréntesis es una aclaración de cocina («picada muy
  // fina»), no algo que se compre.
  texto = texto.replace(/\s*\([^)]*\)/g, "").trim();
  texto = texto.replace(AL_GUSTO[locale], "").trim();
  if (!texto) return null;

  const cantidad = leerCantidad(texto, locale);
  let resto = cantidad ? texto.slice(cantidad.consumido).trim() : texto;
  resto = resto.replace(CONECTOR[locale], "").trim();

  // Lo que quede detrás de una coma es cómo se corta, no qué se compra:
  // «1 cebolla, picada» se compra igual que una cebolla.
  const coma = resto.indexOf(",");
  if (coma > 0) resto = resto.slice(0, coma).trim();

  if (!resto) return null;

  return {
    name: capitalizar(resto),
    qty: cantidad?.qty ?? null,
    unit: cantidad?.unit ?? null,
    raw,
  };
}

interface Cantidad {
  qty: number;
  unit: string | null;
  /** Cuántos caracteres del principio ocupa. */
  consumido: number;
}

function leerCantidad(texto: string, locale: Locale): Cantidad | null {
  // «1 1/2», «1/2», «200», «1,5», y de paso «2-3» o «2 a 3», donde se coge la
  // primera: comprar para el rango alto sobra siempre.
  const numero = texto.match(
    /^(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:[.,]\d+)?)(?:\s*(?:[-–—]|a|to)\s*\d+(?:[.,]\d+)?)?/i,
  );

  let qty: number | null = null;
  let consumido = 0;

  if (numero?.[1] && numero[0]) {
    qty = aNumero(numero[1]);
    consumido = numero[0].length;
  } else {
    // «Una cebolla», «media docena de huevos».
    const primera = texto.split(/\s+/)[0]?.toLowerCase() ?? "";
    const escrito = NUMEROS_ESCRITOS[locale][primera];
    if (escrito === undefined) return null;
    qty = escrito;
    consumido = primera.length;
  }

  if (qty === null || Number.isNaN(qty)) return null;

  const resto = texto.slice(consumido);
  // «500g» sin espacio, que es como se escribe de verdad.
  const pegada = resto.match(/^([a-zá-úñ]+)/i);
  const siguiente = pegada?.[1]?.toLowerCase();

  if (siguiente && UNIDADES[locale].includes(siguiente)) {
    return { qty, unit: siguiente, consumido: consumido + (pegada?.[1]?.length ?? 0) };
  }

  const separada = resto.match(/^\s+([a-zá-úñ]+)/i);
  const palabra = separada?.[1]?.toLowerCase();
  if (palabra && UNIDADES[locale].includes(palabra)) {
    return { qty, unit: palabra, consumido: consumido + (separada?.[0]?.length ?? 0) };
  }

  return { qty, unit: null, consumido };
}

function leerRaciones(texto: string, locale: Locale): number | null {
  const encontrado = texto.match(RACIONES[locale]);
  const valor = encontrado?.[1] ?? encontrado?.[2];
  if (!valor) return null;

  const raciones = Number.parseInt(valor, 10);
  return raciones > 0 && raciones <= 50 ? raciones : null;
}

/**
 * El título es la primera línea si parece un título: sin cantidad, sin viñeta
 * y sin dos puntos. Sirve para proponer el nombre de la lista, así que
 * equivocarse cuesta poco —se puede cambiar antes de crearla.
 */
function adivinarTitulo(lineas: string[], locale: Locale): string | null {
  const primera = lineas[0];
  if (!primera) return null;

  // Hace falta que haya receta debajo. Con dos líneas o menos no hay título
  // que valga: lo pegado es un ingrediente suelto, y tomarlo por un título lo
  // dejaría fuera de la lista.
  if (lineas.length < 3) return null;

  if (
    primera.endsWith(":") ||
    VINETA.test(primera) ||
    /^\d/.test(primera) ||
    ENCABEZADO_INGREDIENTES[locale].test(primera) ||
    ENCABEZADO_PASOS[locale].test(primera) ||
    primera.length > 70
  ) {
    return null;
  }

  return primera;
}

function aNumero(texto: string): number {
  const mixta = texto.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixta) {
    return Number(mixta[1]) + Number(mixta[2]) / Number(mixta[3]);
  }

  const fraccion = texto.match(/^(\d+)\/(\d+)$/);
  if (fraccion) return Number(fraccion[1]) / Number(fraccion[2]);

  return Number.parseFloat(texto.replace(",", "."));
}

function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

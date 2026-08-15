import { describe, expect, it } from "vitest";
import { escalarIngredientes, parseRecipe } from "./parse-recipe";

/** Sólo los nombres, que es lo que acaba en la lista de la compra. */
function nombres(texto: string, locale: "es" | "en" = "es"): string[] {
  return parseRecipe(texto, locale).ingredients.map((i) => i.name);
}

const TORTILLA = `Tortilla de patatas
Para 4 personas

Ingredientes:
- 6 huevos
- 1 kg de patatas
- 1 cebolla grande
- Aceite de oliva virgen extra
- Sal al gusto

Preparación:
1. Pela las patatas y córtalas en láminas finas.
2. Calienta abundante aceite en una sartén y fríelas a fuego suave.
3. Bate los huevos en un bol grande y añade las patatas escurridas.`;

describe("parseRecipe", () => {
  it("saca los ingredientes de una receta pegada entera", () => {
    expect(nombres(TORTILLA)).toEqual([
      "Huevos",
      "Patatas",
      "Cebolla grande",
      "Aceite de oliva virgen extra",
      "Sal",
    ]);
  });

  /**
   * Lo que más veces se pega es la receta entera, pasos incluidos. Colar un
   * paso en la lista es la forma más rápida de que esto no se use.
   */
  it("no se trae la preparación", () => {
    const lista = nombres(TORTILLA);

    expect(lista.some((nombre) => nombre.toLowerCase().includes("pela"))).toBe(false);
    expect(lista.some((nombre) => nombre.toLowerCase().includes("bate"))).toBe(false);
  });

  it("lee cantidades y unidades de cocina", () => {
    const { ingredients } = parseRecipe(
      ["200 g de harina", "2 cucharadas de aceite", "1/2 litro de leche", "3 dientes de ajo"].join(
        "\n",
      ),
      "es",
    );

    expect(ingredients).toEqual([
      expect.objectContaining({ name: "Harina", qty: 200, unit: "g" }),
      expect.objectContaining({ name: "Aceite", qty: 2, unit: "cucharadas" }),
      expect.objectContaining({ name: "Leche", qty: 0.5, unit: "litro" }),
      expect.objectContaining({ name: "Ajo", qty: 3, unit: "dientes" }),
    ]);
  });

  it("entiende las fracciones tal y como vienen escritas", () => {
    const { ingredients } = parseRecipe("1 ½ tazas de azúcar\n¾ kg de tomates", "es");

    expect(ingredients).toEqual([
      expect.objectContaining({ name: "Azúcar", qty: 1.5, unit: "tazas" }),
      expect.objectContaining({ name: "Tomates", qty: 0.75, unit: "kg" }),
    ]);
  });

  /** «1.5 kg» empieza por «1.», que también es como se numera una lista. */
  it("no confunde un decimal con una numeración", () => {
    const { ingredients } = parseRecipe("1.5 kg de patatas", "es");

    expect(ingredients[0]).toEqual(expect.objectContaining({ qty: 1.5, unit: "kg" }));
  });

  it("de un rango se queda con lo justo, que siempre se puede comprar más", () => {
    const { ingredients } = parseRecipe("2-3 tomates maduros", "es");

    expect(ingredients[0]).toEqual(expect.objectContaining({ name: "Tomates maduros", qty: 2 }));
  });

  it("lo de después de la coma es cómo se corta, no qué se compra", () => {
    expect(nombres("1 cebolla, picada muy fina\n2 zanahorias, en rodajas")).toEqual([
      "Cebolla",
      "Zanahorias",
    ]);
  });

  it("los paréntesis son aclaraciones de cocina", () => {
    expect(nombres("- 250 g de mantequilla (a temperatura ambiente)")).toEqual(["Mantequilla"]);
  });

  it("«al gusto» no es parte del nombre", () => {
    const { ingredients } = parseRecipe("Pimienta negra al gusto", "es");

    expect(ingredients[0]).toEqual(
      expect.objectContaining({ name: "Pimienta negra", qty: null, unit: null }),
    );
  });

  it("los subtítulos de una receta por partes no son ingredientes", () => {
    expect(
      nombres(
        ["Ingredientes:", "Para la masa:", "300 g de harina", "Para el relleno:", "2 huevos"].join(
          "\n",
        ),
      ),
    ).toEqual(["Harina", "Huevos"]);
  });

  // Un aceite que sale en tres pasos es un aceite, no tres.
  it("no repite lo que la receta nombra dos veces", () => {
    expect(nombres("2 cucharadas de aceite\n1 cebolla\nAceite")).toEqual(["Aceite", "Cebolla"]);
  });

  it("el título sirve de nombre para la lista y no de ingrediente", () => {
    const receta = parseRecipe(TORTILLA, "es");

    expect(receta.title).toBe("Tortilla de patatas");
    expect(receta.ingredients.map((i) => i.name)).not.toContain("Tortilla de patatas");
  });

  it("sin encabezados también se apaña", () => {
    expect(nombres("Bizcocho\n3 huevos\n200 g de azúcar\n1 yogur natural")).toEqual([
      "Huevos",
      "Azúcar",
      "Yogur natural",
    ]);
  });

  it("«para 4 personas» dice para cuántos es, no qué comprar", () => {
    const receta = parseRecipe(TORTILLA, "es");

    expect(receta.servings).toBe(4);
    expect(receta.ingredients.map((i) => i.name)).not.toContain("Para 4 personas");
  });

  it("de un texto que no es una receta no se inventa nada", () => {
    const receta = parseRecipe(
      "Hoy hemos estado en el pueblo de mis abuelos y hacía un día precioso, así que comimos fuera.",
      "es",
    );

    expect(receta.ingredients).toEqual([]);
  });

  it("con el texto vacío no revienta", () => {
    expect(parseRecipe("", "es")).toEqual({ title: null, servings: null, ingredients: [] });
  });
});

describe("parseRecipe en inglés", () => {
  const PANCAKES = `Fluffy pancakes
Serves 4

Ingredients
- 1 1/2 cups all-purpose flour
- 2 tablespoons sugar
- 1 cup milk
- 2 large eggs
- Salt to taste

Method
1. Whisk the dry ingredients together in a large bowl.
2. Add the milk and the eggs and stir until just combined.`;

  it("lee una receta inglesa con sus unidades", () => {
    const receta = parseRecipe(PANCAKES, "en");

    expect(receta.servings).toBe(4);
    expect(receta.ingredients).toEqual([
      expect.objectContaining({ name: "All-purpose flour", qty: 1.5, unit: "cups" }),
      expect.objectContaining({ name: "Sugar", qty: 2, unit: "tablespoons" }),
      expect.objectContaining({ name: "Milk", qty: 1, unit: "cup" }),
      expect.objectContaining({ name: "Large eggs", qty: 2 }),
      expect.objectContaining({ name: "Salt", qty: null }),
    ]);
  });

  it("tampoco se trae el método", () => {
    expect(nombres(PANCAKES, "en").some((n) => n.toLowerCase().startsWith("whisk"))).toBe(false);
  });
});

describe("escalarIngredientes", () => {
  const receta = parseRecipe("400 g de arroz\n2 cebollas\nSal al gusto", "es").ingredients;

  it("multiplica las cantidades", () => {
    const doble = escalarIngredientes(receta, 2);

    expect(doble.map((i) => i.qty)).toEqual([800, 4, null]);
  });

  /** Media pizca de sal no significa nada: lo que no lleva cantidad se queda. */
  it("lo que no lleva cantidad se queda como está", () => {
    expect(escalarIngredientes(receta, 0.5).map((i) => i.qty)).toEqual([200, 1, null]);
  });

  it("redondea a dos decimales y no a lo que salga en coma flotante", () => {
    const [arroz] = escalarIngredientes(receta, 1 / 3);

    expect(arroz?.qty).toBe(133.33);
  });

  it("un factor que no vale devuelve lo mismo", () => {
    expect(escalarIngredientes(receta, 0)).toBe(receta);
    expect(escalarIngredientes(receta, Number.NaN)).toBe(receta);
  });
});

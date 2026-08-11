import type { Template } from "../types";

/**
 * Plantillas en español. No son traducción de las inglesas (ver
 * docs/02-SEO.md §4.3): en España se compra varias veces por semana, en
 * superficies más pequeñas y con otra cesta.
 *
 * Regla anti-thin content: cada plantilla se escribe con un criterio propio.
 * Si sólo cambia el número de comensales, no se publica.
 */
export const templatesEs: Template[] = [
  {
    key: "weekly",
    slug: "lista-compra-semanal",
    locale: "es",
    title: "Lista de la compra semanal para 2 personas",
    metaTitle: "Lista de la compra semanal para 2 personas (con cantidades)",
    metaDescription:
      "Plantilla de lista de la compra semanal para dos, con cantidades reales y orden por pasillos. Úsala en un clic y compártela con quien compre contigo.",
    excerpt:
      "La cesta de una semana para dos personas, con cantidades pensadas para que no sobre media nevera el domingo.",
    serves: "2 personas · 7 días",
    budget: "55-70 € por semana",
    updatedAt: "2026-08-10",
    sections: [
      {
        categoryId: "produce",
        items: [
          { name: "Plátanos", qty: 6 },
          { name: "Manzanas", qty: 4 },
          { name: "Naranjas de zumo", qty: 2, unit: "kg" },
          { name: "Tomates para ensalada", qty: 1, unit: "kg" },
          { name: "Cebollas", qty: 1, unit: "kg" },
          { name: "Ajos", qty: 1, unit: "cabeza" },
          { name: "Pimiento verde", qty: 2 },
          { name: "Calabacín", qty: 2 },
          { name: "Zanahorias", qty: 1, unit: "kg" },
          { name: "Patatas", qty: 2, unit: "kg" },
          { name: "Lechuga", qty: 1, note: "O bolsa de brotes si vais justos de tiempo" },
        ],
      },
      {
        categoryId: "dairy",
        items: [
          { name: "Leche", qty: 6, unit: "briks" },
          { name: "Huevos", qty: 12 },
          { name: "Yogur natural", qty: 8 },
          { name: "Queso rallado", qty: 1 },
        ],
      },
      {
        categoryId: "meat",
        items: [
          { name: "Pechuga de pollo", qty: 700, unit: "g" },
          { name: "Carne picada", qty: 500, unit: "g" },
        ],
      },
      {
        categoryId: "fish",
        items: [
          { name: "Salmón", qty: 2, unit: "lomos" },
          { name: "Merluza congelada", qty: 500, unit: "g" },
        ],
      },
      {
        categoryId: "bakery",
        items: [
          { name: "Pan de barra", qty: 2, note: "Congela una nada más llegar" },
          { name: "Pan de molde integral", qty: 1 },
        ],
      },
      {
        categoryId: "pantry",
        items: [
          { name: "Arroz", qty: 1, unit: "kg" },
          { name: "Pasta", qty: 500, unit: "g" },
          { name: "Tomate triturado", qty: 2, unit: "botes" },
          { name: "Garbanzos cocidos", qty: 2, unit: "botes" },
          { name: "Atún en lata", qty: 4 },
          { name: "Aceite de oliva virgen extra", qty: 1 },
        ],
      },
      {
        categoryId: "breakfast",
        items: [
          { name: "Café", qty: 1 },
          { name: "Copos de avena", qty: 1 },
        ],
      },
    ],
    body: [
      {
        heading: "Por qué esta lista y no otra",
        paragraphs: [
          "Está calculada para dos personas que comen en casa entre cinco y seis días, y que desayunan y cenan allí casi siempre. Ese es el escenario más común y el que más se desajusta cuando uno copia una lista pensada para una familia y la divide entre dos.",
          "Las cantidades salen de un reparto sencillo: unos 700 g de carne y dos raciones de pescado cubren la proteína principal de la semana sin que nada se quede olvidado al fondo del congelador. La verdura va sobrada a propósito, porque es lo que más se acaba estirando cuando un día no apetece cocinar lo previsto.",
        ],
      },
      {
        heading: "El orden importa: qué se estropea primero",
        paragraphs: [
          "Una compra semanal para dos falla casi siempre por lo mismo: la fruta y la ensalada llegan al viernes en mal estado. La solución no es comprar menos, es ordenar el consumo.",
        ],
        bullets: [
          "Días 1 y 2: lechuga, tomate y pescado fresco. Es lo que menos aguanta.",
          "Días 3 a 5: calabacín, pimiento, pollo y la fruta más madura.",
          "Días 6 y 7: patata, zanahoria, cebolla, legumbre de bote y lo que hayas congelado.",
          "Congela al llegar: una barra de pan y la mitad de la carne picada, en dos bolsas planas.",
        ],
      },
      {
        heading: "Cómo ajustarla a tu caso",
        paragraphs: [
          "Si coméis fuera dos días entre semana, quita un lomo de salmón y baja el pollo a 500 g: es el ajuste que más dinero ahorra y el que menos se nota en la variedad.",
          "Si desayunáis fuera, sobran cuatro briks de leche y la avena. Y si tenéis congelador grande, comprar la merluza y el pollo para dos semanas y congelar la mitad reduce una visita entera al supermercado.",
        ],
      },
    ],
    faq: [
      {
        question: "¿Cuánto cuesta esta lista de la compra semanal?",
        answer:
          "Entre 55 y 70 € en un supermercado de precio medio en España, según marcas y temporada. La fruta y verdura es lo que más oscila: en verano puede bajar del rango y en invierno superarlo.",
      },
      {
        question: "¿Sirve para una persona?",
        answer:
          "Sí, dividiendo la proteína a la mitad, pero no dividas la verdura ni la despensa: los formatos mínimos son los mismos y comprar la mitad de un kilo de patatas no suele ser posible. Para una persona sale mejor cocinar de más y congelar raciones.",
      },
      {
        question: "¿Puedo cambiar el pescado por más carne?",
        answer:
          "Puedes, pero el coste sube. El pescado congelado es la opción más barata por ración de proteína después de la legumbre y el huevo, y aguanta sin planificación.",
      },
      {
        question: "¿Cómo la comparto con quien vive conmigo?",
        answer:
          "Pulsa «Usar esta plantilla» y comparte el enlace de la lista. Quien lo abra puede añadir y marcar productos desde su móvil, sin registrarse, y los cambios se ven al instante en los dos teléfonos.",
      },
    ],
    relatedTemplates: ["single", "family-of-4", "batch-cooking"],
    relatedGuides: ["how-to-make", "share-with-family"],
  },
  {
    key: "family-of-4",
    slug: "lista-compra-semanal-4-personas",
    locale: "es",
    title: "Lista de la compra semanal para 4 personas",
    metaTitle: "Lista de la compra semanal para 4 personas (familia, con cantidades)",
    metaDescription:
      "Plantilla de lista de la compra para una familia de cuatro: cantidades reales, orden por pasillos y consejos para que no se dispare el ticket. Gratis y compartible.",
    excerpt:
      "La compra de una familia de cuatro, con el escalado real: hay cosas que se multiplican por dos y otras que no.",
    serves: "4 personas · 7 días",
    budget: "110-140 € por semana",
    updatedAt: "2026-08-10",
    sections: [
      {
        categoryId: "produce",
        items: [
          { name: "Plátanos", qty: 12 },
          { name: "Manzanas", qty: 8 },
          { name: "Mandarinas", qty: 2, unit: "kg" },
          { name: "Tomates", qty: 2, unit: "kg" },
          { name: "Cebollas", qty: 2, unit: "kg" },
          { name: "Patatas", qty: 4, unit: "kg" },
          { name: "Zanahorias", qty: 1, unit: "kg" },
          { name: "Calabacín", qty: 4 },
          { name: "Judías verdes", qty: 1, unit: "kg" },
          { name: "Lechuga", qty: 2 },
          { name: "Ajos", qty: 1, unit: "cabeza" },
        ],
      },
      {
        categoryId: "dairy",
        items: [
          { name: "Leche", qty: 12, unit: "briks" },
          { name: "Huevos", qty: 24 },
          { name: "Yogures", qty: 16 },
          { name: "Queso en lonchas", qty: 1 },
          { name: "Mantequilla", qty: 1 },
        ],
      },
      {
        categoryId: "meat",
        items: [
          { name: "Pollo entero troceado", qty: 1 },
          { name: "Carne picada mixta", qty: 1, unit: "kg" },
          { name: "Filetes de cerdo", qty: 8 },
        ],
      },
      {
        categoryId: "fish",
        items: [
          { name: "Merluza congelada", qty: 1, unit: "kg" },
          { name: "Salmón", qty: 4, unit: "lomos" },
        ],
      },
      {
        categoryId: "bakery",
        items: [
          { name: "Pan de barra", qty: 4, note: "Congela dos al llegar" },
          { name: "Pan de molde", qty: 2 },
        ],
      },
      {
        categoryId: "pantry",
        items: [
          { name: "Arroz", qty: 2, unit: "kg" },
          { name: "Pasta", qty: 1, unit: "kg" },
          { name: "Lentejas", qty: 1, unit: "kg" },
          { name: "Tomate triturado", qty: 4, unit: "botes" },
          { name: "Aceite de oliva virgen extra", qty: 2 },
          { name: "Atún en lata", qty: 8 },
        ],
      },
      {
        categoryId: "breakfast",
        items: [
          { name: "Cereales", qty: 2 },
          { name: "Cacao soluble", qty: 1 },
          { name: "Galletas", qty: 2 },
          { name: "Café", qty: 1 },
        ],
      },
      {
        categoryId: "cleaning",
        items: [
          { name: "Detergente lavadora", qty: 1 },
          { name: "Lavavajillas", qty: 1 },
          { name: "Papel de cocina", qty: 1, unit: "pack" },
        ],
      },
    ],
    body: [
      {
        heading: "Una familia de cuatro no es una pareja por dos",
        paragraphs: [
          "Es el error más habitual al escalar una lista: multiplicar todo por dos. En la práctica hay tres bloques que se comportan distinto.",
          "El desayuno y el almuerzo escolar sí se multiplican, y a veces más: la leche, la fruta de mano y el pan se disparan cuando hay niños. La proteína principal crece menos de lo esperado, porque las raciones infantiles son más pequeñas. Y la despensa —aceite, arroz, legumbre— apenas cambia de una semana a otra: se compra por formato grande y dura varias.",
        ],
      },
      {
        heading: "Dónde se dispara el ticket",
        paragraphs: [
          "En una compra familiar, tres categorías explican la mayor parte de la diferencia entre 110 € y 140 €.",
        ],
        bullets: [
          "Snacks y galletas: es la partida que más crece sin que nadie lo decida. Ponerla en la lista con cantidad cerrada evita que se llene el carro sobre la marcha.",
          "Carne en bandeja pequeña: el pollo entero troceado cuesta bastante menos por kilo que la pechuga en bandeja, y da para dos comidas.",
          "Producto de temporada: comprar fuera de temporada puede duplicar el precio de la misma verdura.",
        ],
      },
      {
        heading: "Cocinar una vez, comer dos",
        paragraphs: [
          "Con esta cesta salen tres comidas de las que rinden doble: la carne picada da para boloñesa y para albóndigas, el pollo troceado para un guiso y un arroz, y la lentejas para dos días. Si cocinas el domingo esas tres bases, la semana se resuelve con calentar y montar.",
          "Es también lo que hace que la lista funcione con horario laboral: no depende de tener tiempo cada día, sino de una tarde.",
        ],
      },
    ],
    faq: [
      {
        question: "¿Cuánto cuesta la compra semanal de una familia de 4?",
        answer:
          "Entre 110 y 140 € semanales en un supermercado de precio medio en España. La horquilla depende sobre todo de la carne y de cuántos snacks entren en el carro.",
      },
      {
        question: "¿Y si dos son niños pequeños?",
        answer:
          "Baja la proteína en torno a un 25 % y sube fruta de mano y lácteos. Las cantidades de despensa no cambian.",
      },
      {
        question: "¿Cómo evito comprar cosas repetidas?",
        answer:
          "El problema no suele ser la lista, sino que cada uno tiene la suya. Comparte esta lista con el enlace y todos añadís sobre la misma: si alguien ya ha puesto leche, se ve al momento.",
      },
      {
        question: "¿Cada cuánto conviene comprar?",
        answer:
          "Una compra semanal grande más una reposición corta a mitad de semana de fruta, pan y leche sale mejor que dos compras grandes: reduce lo que se tira sin obligar a cargar con todo de una vez.",
      },
    ],
    relatedTemplates: ["weekly", "holiday-rental", "monthly"],
    relatedGuides: ["share-with-family", "how-to-make"],
  },
  {
    key: "pantry",
    slug: "lista-compra-basica-despensa",
    locale: "es",
    title: "Lista de la compra básica para llenar la despensa",
    metaTitle: "Lista de la compra básica: qué tener siempre en la despensa",
    metaDescription:
      "Los básicos que conviene tener siempre en casa para poder cocinar cualquier día sin bajar a comprar. Lista completa por pasillos, lista para usar.",
    excerpt:
      "No es una compra semanal: es el fondo de armario de la cocina, lo que hace que siempre puedas cenar sin bajar a comprar.",
    serves: "Cualquier hogar · se repone, no se repite",
    budget: "70-90 € la primera vez",
    updatedAt: "2026-08-10",
    sections: [
      {
        categoryId: "pantry",
        items: [
          { name: "Aceite de oliva virgen extra", qty: 1 },
          { name: "Sal", qty: 1 },
          { name: "Pimienta negra molida", qty: 1 },
          { name: "Pimentón", qty: 1 },
          { name: "Orégano", qty: 1 },
          { name: "Vinagre", qty: 1 },
          { name: "Arroz redondo", qty: 1, unit: "kg" },
          { name: "Pasta corta", qty: 1, unit: "kg" },
          { name: "Lentejas", qty: 1, unit: "kg" },
          { name: "Garbanzos cocidos", qty: 4, unit: "botes" },
          { name: "Tomate triturado", qty: 4, unit: "botes" },
          { name: "Atún en lata", qty: 6 },
          { name: "Caldo de verduras", qty: 2, unit: "briks" },
          { name: "Harina", qty: 1, unit: "kg" },
          { name: "Azúcar", qty: 1, unit: "kg" },
        ],
      },
      {
        categoryId: "frozen",
        items: [
          { name: "Guisantes congelados", qty: 1, unit: "bolsa" },
          { name: "Verdura para salteado", qty: 1, unit: "bolsa" },
          { name: "Merluza congelada", qty: 1, unit: "bolsa" },
        ],
      },
      {
        categoryId: "produce",
        items: [
          { name: "Cebollas", qty: 2, unit: "kg" },
          { name: "Ajos", qty: 1, unit: "cabeza" },
          { name: "Patatas", qty: 3, unit: "kg" },
        ],
      },
      {
        categoryId: "dairy",
        items: [
          { name: "Huevos", qty: 12 },
          { name: "Leche", qty: 6, unit: "briks" },
        ],
      },
      {
        categoryId: "cleaning",
        items: [
          { name: "Detergente lavadora", qty: 1 },
          { name: "Lavavajillas a mano", qty: 1 },
          { name: "Bayetas", qty: 1, unit: "pack" },
          { name: "Bolsas de basura", qty: 1, unit: "rollo" },
          { name: "Papel higiénico", qty: 1, unit: "pack" },
        ],
      },
    ],
    body: [
      {
        heading: "Qué es exactamente una despensa básica",
        paragraphs: [
          "No es una compra semanal. Es la base que te permite cocinar sin haber planificado nada: con cebolla, ajo, aceite, tomate de bote, arroz o pasta y un huevo, hay cena. Todo lo demás es variación.",
          "La primera vez cuesta entre 70 y 90 €, pero no se repite: a partir de ahí sólo repones lo que se acaba. Es la lista que conviene tener guardada y revisar una vez al mes, no cada semana.",
        ],
      },
      {
        heading: "El criterio: aguanta, resuelve y combina",
        paragraphs: [
          "Un producto entra en esta lista si cumple las tres cosas. Aguanta meses sin estropearse, resuelve una comida por sí solo, y combina con casi todo lo demás.",
        ],
        bullets: [
          "Legumbre de bote: proteína lista en dos minutos, sin remojo ni planificación.",
          "Tomate triturado: base de la mitad de los guisos y de cualquier pasta.",
          "Verdura congelada: la única forma realista de tener verdura siempre disponible sin tirarla.",
          "Huevos: la comida de emergencia más barata que existe.",
        ],
      },
      {
        heading: "Qué NO poner en la despensa",
        paragraphs: [
          "Especias exóticas para una receta concreta, salsas de un solo uso y formatos gigantes de cosas que apenas gastas. Ocupan sitio, caducan y dan la falsa sensación de tener la despensa llena.",
          "La prueba es sencilla: si no lo vas a usar tres veces en los próximos dos meses, no es un básico, es un capricho puntual. Cómpralo cuando lo necesites.",
        ],
      },
    ],
    faq: [
      {
        question: "¿Cada cuánto se repone la despensa?",
        answer:
          "Una revisión al mes es suficiente. Lo práctico es no esperar a que algo se acabe: cuando abras el último bote de tomate, añádelo ya a la lista compartida.",
      },
      {
        question: "¿Merece la pena comprar formatos grandes?",
        answer:
          "Sólo en lo que gastas de verdad: aceite, arroz, pasta, legumbre y papel. En especias y salsas el formato grande casi siempre acaba caducando.",
      },
      {
        question: "¿Sirve para una persona que vive sola?",
        answer:
          "Especialmente. Vivir solo es cuando más rentable resulta tener despensa, porque evita la compra diaria y el pedido a domicilio, que es donde se va el dinero.",
      },
    ],
    relatedTemplates: ["monthly", "weekly", "budget"],
    relatedGuides: ["how-to-make"],
  },
  {
    key: "healthy",
    slug: "lista-compra-saludable",
    locale: "es",
    title: "Lista de la compra saludable",
    metaTitle: "Lista de la compra saludable: qué comprar (y qué no)",
    metaDescription:
      "Una lista de la compra saludable de verdad, con criterio para elegir en el supermercado y sin productos «light» que no lo son. Úsala en un clic.",
    excerpt:
      "Comer mejor se decide en el supermercado, no en la cocina. Esta es la cesta, con el criterio para elegir delante del lineal.",
    serves: "2 personas · 7 días",
    budget: "65-80 € por semana",
    updatedAt: "2026-08-10",
    sections: [
      {
        categoryId: "produce",
        items: [
          { name: "Espinacas frescas", qty: 2, unit: "bolsas" },
          { name: "Brócoli", qty: 1 },
          { name: "Tomates", qty: 1, unit: "kg" },
          { name: "Pepino", qty: 2 },
          { name: "Pimiento rojo", qty: 2 },
          { name: "Calabacín", qty: 3 },
          { name: "Cebolla", qty: 1, unit: "kg" },
          { name: "Aguacates", qty: 3 },
          { name: "Manzanas", qty: 6 },
          { name: "Plátanos", qty: 6 },
          { name: "Arándanos", qty: 1, unit: "tarrina" },
          { name: "Limones", qty: 4 },
        ],
      },
      {
        categoryId: "meat",
        items: [{ name: "Pechuga de pollo", qty: 600, unit: "g" }],
      },
      {
        categoryId: "fish",
        items: [
          { name: "Salmón", qty: 2, unit: "lomos" },
          { name: "Sardinas en lata", qty: 4, note: "En aceite de oliva, no en girasol" },
        ],
      },
      {
        categoryId: "dairy",
        items: [
          { name: "Yogur natural sin azúcar", qty: 8 },
          { name: "Huevos", qty: 12 },
          { name: "Queso fresco", qty: 1 },
        ],
      },
      {
        categoryId: "pantry",
        items: [
          { name: "Lentejas", qty: 1, unit: "kg" },
          { name: "Garbanzos cocidos", qty: 3, unit: "botes" },
          { name: "Arroz integral", qty: 1, unit: "kg" },
          { name: "Aceite de oliva virgen extra", qty: 1 },
          { name: "Nueces", qty: 250, unit: "g" },
          { name: "Almendras crudas", qty: 250, unit: "g" },
        ],
      },
      {
        categoryId: "breakfast",
        items: [
          { name: "Copos de avena", qty: 1 },
          {
            name: "Pan integral 100 %",
            qty: 1,
            note: "Mira que el primer ingrediente sea integral",
          },
        ],
      },
    ],
    body: [
      {
        heading: "La regla del plato, aplicada al carro",
        paragraphs: [
          "La forma más simple de que una compra sea saludable es que el carro se parezca al plato que quieres comer: la mitad verdura y fruta, un cuarto proteína, un cuarto cereal integral o legumbre.",
          "Si al llegar a la caja miras el carro y la verdura no ocupa la mitad, la semana ya está decidida. No hay fuerza de voluntad que arregle en la cocina lo que se compró mal en el supermercado.",
        ],
      },
      {
        heading: "Cómo leer la etiqueta en diez segundos",
        paragraphs: [
          "No hace falta entender la tabla nutricional entera. Con mirar la lista de ingredientes se resuelve casi todo.",
        ],
        bullets: [
          "Cuantos menos ingredientes, mejor. Si hay más de cinco y no reconoces varios, deja el producto.",
          "El orden importa: los ingredientes van de mayor a menor cantidad. Si el azúcar está entre los tres primeros, es un dulce.",
          "«Pan integral» no basta: el primer ingrediente debe ser harina integral, no harina de trigo.",
          "«Light», «bio» y «0 %» no significan saludable. Un producto puede ser ecológico y ser un ultraprocesado.",
        ],
      },
      {
        heading: "Lo que esta lista deja fuera a propósito",
        paragraphs: [
          "No lleva zumos, ni cereales de desayuno azucarados, ni yogures de sabores, ni embutido salvo el que quieras añadir tú. No es una cuestión moral: son los productos que más azúcar y más ultraprocesado aportan a la cesta media española sin que se note.",
          "Tampoco lleva sustitutos «saludables» caros. Comer bien con esta lista cuesta entre 65 y 80 € para dos personas, en línea con una compra normal. Lo que encarece la compra saludable no es la verdura: son los productos de dieta.",
        ],
      },
    ],
    faq: [
      {
        question: "¿Es más cara una lista de la compra saludable?",
        answer:
          "No necesariamente. Esta cesta cuesta 65-80 € para dos, similar a una compra convencional. Lo caro son los productos «de dieta» procesados, no la legumbre, el huevo, la verdura de temporada o el pescado congelado.",
      },
      {
        question: "¿Puedo comprar verdura congelada?",
        answer:
          "Sí. La verdura congelada conserva prácticamente los mismos nutrientes que la fresca, porque se congela justo tras la recolección. Además evita tirar lo que se estropea, que es el mayor coste oculto.",
      },
      {
        question: "¿Y si no me gusta el pescado?",
        answer:
          "Sustitúyelo por legumbre y huevo, no por más carne roja. Dos raciones más de legumbre a la semana cubren la proteína a menor coste.",
      },
      {
        question: "¿Cómo la adapto si soy vegetariano?",
        answer:
          "Quita pollo y pescado y sube la legumbre a cuatro botes y las lentejas a kilo y medio, añadiendo tofu o tempeh. La estructura del resto de la lista no cambia.",
      },
    ],
    relatedTemplates: ["gluten-free", "vegetarian", "weekly"],
    relatedGuides: ["how-to-make"],
  },
  {
    key: "monthly",
    slug: "lista-compra-mensual",
    locale: "es",
    title: "Lista de la compra mensual",
    metaTitle: "Lista de la compra mensual: qué comprar de una vez y qué no",
    metaDescription:
      "La compra grande del mes, con lo que de verdad aguanta y lo que no puede esperar. Cantidades para dos personas y estrategia de congelador.",
    excerpt:
      "Una compra mensual no es cuatro semanales juntas: es separar lo que aguanta de lo que no, y eso cambia la lista entera.",
    serves: "2 personas · 1 mes",
    budget: "160-200 € la compra grande",
    updatedAt: "2026-08-10",
    sections: [
      {
        categoryId: "pantry",
        items: [
          { name: "Arroz", qty: 5, unit: "kg" },
          { name: "Pasta", qty: 3, unit: "kg" },
          { name: "Lentejas", qty: 2, unit: "kg" },
          { name: "Garbanzos secos", qty: 1, unit: "kg" },
          { name: "Garbanzos cocidos", qty: 8, unit: "botes" },
          { name: "Tomate triturado", qty: 12, unit: "botes" },
          { name: "Atún en lata", qty: 12 },
          { name: "Aceite de oliva virgen extra", qty: 5, unit: "l" },
          { name: "Harina", qty: 2, unit: "kg" },
          { name: "Azúcar", qty: 1, unit: "kg" },
          { name: "Sal", qty: 1, unit: "kg" },
          { name: "Caldo de verduras", qty: 6, unit: "briks" },
        ],
      },
      {
        categoryId: "frozen",
        items: [
          { name: "Merluza congelada", qty: 2, unit: "kg" },
          { name: "Pollo troceado para congelar", qty: 3, unit: "kg" },
          { name: "Guisantes congelados", qty: 2, unit: "bolsas" },
          { name: "Verdura para salteado", qty: 3, unit: "bolsas" },
          { name: "Pan de molde", qty: 2, note: "Al congelador, sale como recién comprado" },
        ],
      },
      {
        categoryId: "produce",
        items: [
          { name: "Patatas", qty: 5, unit: "kg" },
          { name: "Cebollas", qty: 3, unit: "kg" },
          { name: "Ajos", qty: 2, unit: "cabezas" },
          { name: "Zanahorias", qty: 2, unit: "kg" },
          { name: "Calabaza", qty: 1, note: "Entera aguanta semanas en sitio fresco" },
        ],
      },
      {
        categoryId: "drinks",
        items: [
          { name: "Leche", qty: 24, unit: "briks" },
          { name: "Café", qty: 2 },
          { name: "Agua mineral", qty: 2, unit: "packs" },
        ],
      },
      {
        categoryId: "cleaning",
        items: [
          { name: "Detergente lavadora", qty: 2 },
          { name: "Lavavajillas", qty: 2 },
          { name: "Papel higiénico", qty: 2, unit: "packs" },
          { name: "Papel de cocina", qty: 2, unit: "packs" },
          { name: "Bolsas de basura", qty: 2, unit: "rollos" },
        ],
      },
      {
        categoryId: "personal",
        items: [
          { name: "Gel de ducha", qty: 2 },
          { name: "Champú", qty: 2 },
          { name: "Pasta de dientes", qty: 3 },
        ],
      },
    ],
    body: [
      {
        heading: "Lo que decide esta lista no es la cantidad, es la caducidad",
        paragraphs: [
          "Una compra mensual no es una semanal multiplicada por cuatro. Si lo intentas, la mitad de la fruta acaba en la basura la segunda semana y habrás pagado por tirarla.",
          "El criterio aquí es otro: entra lo que aguanta un mes sin cuidados —despensa, congelado, tubérculos, limpieza e higiene— y se queda fuera todo lo fresco, que sigue comprándose aparte cada semana en una visita corta.",
        ],
      },
      {
        heading: "Qué aguanta de verdad un mes",
        paragraphs: [
          "Más de lo que parece, si se guarda bien. Y bastante menos de lo que la gente asume con la fruta y la verdura.",
        ],
        bullets: [
          "Aguantan sin problema: arroz, pasta, legumbre, conservas, aceite, café, leche UHT, limpieza e higiene.",
          "Aguantan si tienen sitio fresco y oscuro: patatas, cebollas, ajos, calabaza entera, zanahorias.",
          "Aguantan sólo congelados: carne, pescado, pan y verdura. De ahí que el congelador sea la pieza clave.",
          "No aguantan: fruta de temporada, ensalada, lácteos frescos, huevos más allá de tres semanas.",
        ],
      },
      {
        heading: "El congelador es el límite real",
        paragraphs: [
          "Esta lista sólo funciona si cabe. Tres kilos de pollo y dos de merluza ocupan bastante, y conviene congelarlos el mismo día en porciones planas de ración: se descongelan en una hora y evitan sacar un bloque de tres kilos para dos filetes.",
          "Si tu congelador es el cajón de una nevera pequeña, esta compra no es para ti: sale mejor una quincenal. Es la limitación más honesta de comprar por meses, y casi nadie la menciona.",
        ],
      },
      {
        heading: "Lo que sigue siendo semanal",
        paragraphs: [
          "Fruta, ensalada, tomate, yogures, huevos y pan fresco. Son diez minutos de compra a mitad de semana, y son justo lo que hace que la compra mensual no acabe en una dieta de conservas.",
          "Lo práctico es tener dos listas vivas: esta, que se revisa una vez al mes, y una corta de fresco que se va llenando sola durante la semana. Con la lista compartida las dos las puede actualizar cualquiera de la casa.",
        ],
      },
    ],
    faq: [
      {
        question: "¿Cuánto se ahorra comprando una vez al mes?",
        answer:
          "El ahorro no viene del formato grande, viene de pisar menos el supermercado: menos visitas son menos compras no previstas. En formato grande sólo compensa de verdad en aceite, arroz, legumbre, papel y detergente.",
      },
      {
        question: "¿Y la fruta y la verdura?",
        answer:
          "No entran en la mensual salvo las que aguantan (patata, cebolla, zanahoria, calabaza). El resto se compra en una visita corta cada semana; intentar mensualizarlas es la forma más rápida de tirar comida.",
      },
      {
        question: "¿Necesito un congelador grande?",
        answer:
          "Para esta lista tal cual, sí: sólo la carne y el pescado ocupan un cajón entero. Con un congelador pequeño la alternativa razonable es la compra quincenal.",
      },
      {
        question: "¿Cómo sé qué me queda a mitad de mes?",
        answer:
          "Anotando lo que se acaba en el momento en que se acaba, no el día de la compra. Una lista compartida en el móvil sirve justo para eso: cualquiera de la casa apunta el bote de tomate cuando abre el último.",
      },
    ],
    relatedTemplates: ["batch-cooking", "pantry", "weekly"],
    relatedGuides: ["how-to-make"],
  },
  {
    key: "budget",
    slug: "lista-compra-barata",
    locale: "es",
    title: "Lista de la compra barata para toda la semana",
    metaTitle: "Lista de la compra barata: comer bien con poco presupuesto",
    metaDescription:
      "Una semana entera de comida para dos por menos de 45 €, sin vivir de pasta. Con el criterio para saber qué recortar y qué no tocar nunca.",
    excerpt:
      "Comer barato no es comer peor: es saber qué alimentos dan más comida por euro. Estos son, y esta es la cesta que sale.",
    serves: "2 personas · 7 días",
    budget: "38-45 € por semana",
    updatedAt: "2026-08-10",
    sections: [
      {
        categoryId: "pantry",
        items: [
          { name: "Lentejas", qty: 1, unit: "kg" },
          { name: "Garbanzos secos", qty: 1, unit: "kg" },
          { name: "Arroz", qty: 1, unit: "kg" },
          { name: "Pasta", qty: 1, unit: "kg" },
          { name: "Tomate triturado", qty: 3, unit: "botes" },
          { name: "Aceite de oliva", qty: 1 },
          { name: "Atún en lata", qty: 4 },
        ],
      },
      {
        categoryId: "produce",
        items: [
          { name: "Patatas", qty: 3, unit: "kg" },
          { name: "Cebollas", qty: 1, unit: "kg" },
          { name: "Zanahorias", qty: 1, unit: "kg" },
          { name: "Calabacín", qty: 3 },
          { name: "Repollo", qty: 1, note: "Rinde muchísimo y aguanta dos semanas" },
          { name: "Plátanos", qty: 6 },
          { name: "Naranjas", qty: 2, unit: "kg", note: "De temporada, el kilo más barato" },
        ],
      },
      {
        categoryId: "dairy",
        items: [
          { name: "Huevos", qty: 24 },
          { name: "Leche", qty: 6, unit: "briks" },
          { name: "Yogur natural", qty: 8 },
        ],
      },
      {
        categoryId: "meat",
        items: [
          {
            name: "Contramuslos de pollo",
            qty: 1,
            unit: "kg",
            note: "Mitad de precio que la pechuga",
          },
          { name: "Carne picada", qty: 500, unit: "g" },
        ],
      },
      {
        categoryId: "frozen",
        items: [
          { name: "Verdura congelada", qty: 2, unit: "bolsas" },
          { name: "Merluza congelada", qty: 500, unit: "g" },
        ],
      },
      {
        categoryId: "bakery",
        items: [{ name: "Pan de barra", qty: 3, note: "Congela dos" }],
      },
    ],
    body: [
      {
        heading: "El coste por ración, no el precio de la etiqueta",
        paragraphs: [
          "Lo que hace cara una cesta no son los productos caros, es cuántas comidas salen de ella. Un kilo de lentejas cuesta poco más que una bandeja de pechuga y da diez raciones en vez de cuatro.",
          "Esta lista está construida con esa cuenta: la proteína sale de legumbre, huevo, pollo de la parte barata y pescado congelado. Es la combinación que más comida da por euro sin caer en una semana de pasta con tomate.",
        ],
      },
      {
        heading: "Dónde recortar de verdad",
        paragraphs: [
          "Casi todo el gasto evitable de una compra media está en cuatro sitios, y ninguno es la comida en sí.",
        ],
        bullets: [
          "Bebidas: refrescos, zumos y cerveza pueden ser un tercio del ticket sin aportar una sola comida.",
          "Snacks y bollería: caros por kilo y no quitan el hambre. Es lo primero que sale.",
          "Precocinados: pagas la elaboración a precio de restaurante barato.",
          "Cortes caros de carne: el contramuslo cuesta la mitad que la pechuga y sale más jugoso guisado.",
        ],
      },
      {
        heading: "Lo que no conviene recortar",
        paragraphs: [
          "El aceite de oliva, la fruta y el huevo. Ahorrar ahí sale mal: el aceite barato se nota en todo lo que cocinas, la fruta es lo primero que se echa de menos, y el huevo ya es de lo más barato que hay por gramo de proteína.",
          "Tampoco la verdura congelada. Parece un lujo frente a la fresca de oferta, pero no se estropea, y lo que no se tira no hay que volver a comprarlo.",
        ],
      },
      {
        heading: "Cómo se reparte la semana",
        paragraphs: [
          "Con esta cesta salen unas doce comidas principales: dos de lentejas, dos de garbanzos, dos de pollo guisado con patata, una de pescado, una de pasta con tomate y carne, y el resto tortillas, arroces y ensaladas de repollo.",
          "Cocinar la legumbre en olla el domingo es lo que hace que funcione entre semana. Sin eso, la tentación de pedir a domicilio se come el ahorro de tres compras.",
        ],
      },
    ],
    faq: [
      {
        question: "¿Se puede comer bien con 40 € a la semana para dos?",
        answer:
          "Sí, si la proteína sale sobre todo de legumbre y huevo y la verdura es de temporada o congelada. Lo que no cabe en ese presupuesto es carne roja a diario, precocinados ni bebidas.",
      },
      {
        question: "¿Marca blanca en todo?",
        answer:
          "En básicos como legumbre, arroz, pasta, conservas, leche y congelados, la diferencia de calidad rara vez justifica el precio de marca. En aceite y café es donde más se nota, y donde puede compensar pagar algo más.",
      },
      {
        question: "¿Las ofertas ayudan?",
        answer:
          "Sólo si ibas a comprar ese producto igualmente. Un 3x2 de algo que no estaba en la lista no es un ahorro, es un gasto que no habías previsto.",
      },
      {
        question: "¿Y si tengo poco tiempo para cocinar?",
        answer:
          "Cocina una vez y come dos: la legumbre y el pollo guisado dan para dos días cada uno. Comer barato con prisa se sostiene en cocinar en tandas, no en cocinar rápido cada noche.",
      },
    ],
    relatedTemplates: ["student-flat", "weekly", "single"],
    relatedGuides: ["how-to-make"],
  },
  {
    key: "single",
    slug: "lista-compra-1-persona",
    locale: "es",
    title: "Lista de la compra para una persona",
    metaTitle: "Lista de la compra para 1 persona (sin que sobre la mitad)",
    metaDescription:
      "El problema de comprar para uno no es la cantidad, son los formatos. Lista semanal para una persona pensada para que no acabe medio carro en la basura.",
    excerpt:
      "Comprar para uno no es dividir entre dos: los formatos no bajan contigo. Esta lista está pensada alrededor de ese problema.",
    serves: "1 persona · 7 días",
    budget: "35-45 € por semana",
    updatedAt: "2026-08-10",
    sections: [
      {
        categoryId: "produce",
        items: [
          { name: "Cebollas", qty: 3, note: "Sueltas, no en malla de dos kilos" },
          { name: "Zanahorias", qty: 4 },
          { name: "Calabacín", qty: 2 },
          { name: "Tomates", qty: 4 },
          { name: "Patatas", qty: 1, unit: "kg" },
          { name: "Manzanas", qty: 4 },
          { name: "Plátanos", qty: 4 },
          { name: "Limón", qty: 2 },
        ],
      },
      {
        categoryId: "frozen",
        items: [
          {
            name: "Verdura congelada",
            qty: 2,
            unit: "bolsas",
            note: "Aquí el formato grande sí compensa",
          },
          { name: "Filetes de pescado congelado", qty: 1, unit: "bolsa" },
          { name: "Guisantes congelados", qty: 1, unit: "bolsa" },
        ],
      },
      {
        categoryId: "dairy",
        items: [
          { name: "Huevos", qty: 12 },
          { name: "Leche", qty: 3, unit: "briks" },
          { name: "Yogur natural", qty: 4 },
          {
            name: "Queso curado en cuña",
            qty: 1,
            note: "Aguanta semanas, a diferencia del fresco",
          },
        ],
      },
      {
        categoryId: "meat",
        items: [{ name: "Pollo", qty: 500, unit: "g", note: "Congela la mitad al llegar" }],
      },
      {
        categoryId: "pantry",
        items: [
          { name: "Arroz", qty: 1, unit: "kg" },
          { name: "Pasta", qty: 500, unit: "g" },
          { name: "Lentejas cocidas", qty: 3, unit: "botes" },
          { name: "Tomate triturado", qty: 2, unit: "botes" },
          { name: "Atún en lata", qty: 4 },
          { name: "Aceite de oliva", qty: 1 },
        ],
      },
      {
        categoryId: "bakery",
        items: [{ name: "Pan de molde", qty: 1, note: "Al congelador; se tuesta directamente" }],
      },
    ],
    body: [
      {
        heading: "El problema no es la cantidad, son los formatos",
        paragraphs: [
          "Quien vive solo no gasta la mitad que una pareja: gasta bastante más de la mitad. La razón es que los formatos mínimos no se dividen. Una lechuga, una malla de cebollas o un bote de tomate son lo mismo para uno que para cuatro, y lo que sobra acaba en la basura.",
          "Por eso esta lista prioriza lo que se compra suelto, lo que aguanta semanas y lo que se congela bien. No es una lista de raciones pequeñas: es una lista de formatos que perdonan.",
        ],
      },
      {
        heading: "Congelar en raciones es lo que lo hace viable",
        paragraphs: [
          "Cocinar para uno cada día no compensa ni en tiempo ni en dinero. Lo que funciona es cocinar cuatro raciones y congelar tres, con lo que la semana se resuelve con calentar.",
        ],
        bullets: [
          "Nada más comprar: parte el pollo en dos y congela una mitad; el pan de molde entero al congelador.",
          "Al cocinar: haz cuatro raciones de arroz, lentejas o guiso y congela tres en táperes individuales.",
          "Etiqueta con la fecha. Sin eso, el congelador se convierte en un museo de cosas sin identificar.",
        ],
      },
      {
        heading: "Dónde el formato grande sí compensa",
        paragraphs: [
          "En lo que no se estropea: arroz, pasta, aceite, conservas, papel. Ahí el precio por kilo manda y no hay riesgo.",
          "Y en la verdura congelada, que es el mejor invento para quien vive solo: coges la cantidad exacta que vas a cocinar, y el resto sigue en el cajón sin echarse a perder. Es la diferencia entre comer verdura a diario o comprarla con buena intención y tirarla el jueves.",
        ],
      },
      {
        heading: "Comparado con pedir a domicilio",
        paragraphs: [
          "Esta cesta ronda los 40 € y cubre la semana entera. Dos pedidos a domicilio cuestan lo mismo y cubren dos cenas. La cuenta no está reñida: cocinar para uno sale caro comparado con cocinar para cuatro, pero sigue siendo mucho más barato que la alternativa.",
        ],
      },
    ],
    faq: [
      {
        question: "¿Cuánto cuesta la compra semanal de una persona?",
        answer:
          "Entre 35 y 45 € con esta lista. No baja mucho más porque los formatos mínimos ponen un suelo: la despensa cuesta casi lo mismo se cocine para uno o para dos.",
      },
      {
        question: "¿Cómo evito tirar comida?",
        answer:
          "Comprando suelto lo fresco, congelando en raciones el día de la compra y usando verdura congelada para el día a día. El desperdicio de quien vive solo casi siempre viene de un formato demasiado grande, no de comprar de más.",
      },
      {
        question: "¿Merece la pena hacer la compra online?",
        answer:
          "Para una persona suele salir a cuenta si evitas el coste de envío juntando la compra grande, sobre todo porque no compras por impulso. La contrapartida es que no eliges tú el fresco.",
      },
      {
        question: "¿Y si como fuera varios días?",
        answer:
          "Baja el pollo y el pescado, no la verdura ni la despensa. Es el ajuste que menos desperdicio genera, porque la proteína fresca es lo que peor aguanta si cambian los planes.",
      },
    ],
    relatedTemplates: ["weekly", "budget", "pantry"],
    relatedGuides: ["how-to-make"],
  },
  {
    key: "vegetarian",
    slug: "lista-compra-vegetariana",
    locale: "es",
    title: "Lista de la compra vegetariana",
    metaTitle: "Lista de la compra vegetariana semanal (con la proteína cubierta)",
    metaDescription:
      "Cesta vegetariana para una semana, con las fuentes de proteína repartidas y sin sustitutos caros. Cantidades para dos personas.",
    excerpt:
      "Quitar la carne es la parte fácil. Lo que decide si una cesta vegetariana funciona es de dónde sale la proteína.",
    serves: "2 personas · 7 días",
    budget: "50-65 € por semana",
    updatedAt: "2026-08-10",
    sections: [
      {
        categoryId: "pantry",
        items: [
          { name: "Lentejas", qty: 1, unit: "kg" },
          { name: "Garbanzos cocidos", qty: 4, unit: "botes" },
          { name: "Alubias blancas", qty: 2, unit: "botes" },
          { name: "Arroz integral", qty: 1, unit: "kg" },
          { name: "Pasta", qty: 500, unit: "g" },
          { name: "Cuscús", qty: 500, unit: "g" },
          { name: "Tomate triturado", qty: 3, unit: "botes" },
          { name: "Aceite de oliva virgen extra", qty: 1 },
          { name: "Nueces", qty: 250, unit: "g" },
          { name: "Almendras", qty: 250, unit: "g" },
          { name: "Tahini", qty: 1, note: "Para hummus casero, sale mucho más barato" },
        ],
      },
      {
        categoryId: "produce",
        items: [
          { name: "Espinacas frescas", qty: 2, unit: "bolsas" },
          { name: "Brócoli", qty: 2 },
          { name: "Pimientos", qty: 4 },
          { name: "Calabacín", qty: 3 },
          { name: "Berenjena", qty: 2 },
          { name: "Cebollas", qty: 1, unit: "kg" },
          { name: "Ajos", qty: 1, unit: "cabeza" },
          { name: "Tomates", qty: 1, unit: "kg" },
          { name: "Aguacates", qty: 3 },
          { name: "Champiñones", qty: 500, unit: "g" },
          { name: "Naranjas", qty: 2, unit: "kg" },
        ],
      },
      {
        categoryId: "dairy",
        items: [
          { name: "Huevos", qty: 18 },
          { name: "Yogur natural", qty: 8 },
          { name: "Queso feta", qty: 1 },
          { name: "Leche", qty: 4, unit: "briks" },
        ],
      },
      {
        categoryId: "frozen",
        items: [
          { name: "Tofu firme", qty: 2, unit: "bloques" },
          { name: "Guisantes congelados", qty: 1, unit: "bolsa" },
          { name: "Edamame", qty: 1, unit: "bolsa" },
        ],
      },
      {
        categoryId: "bakery",
        items: [{ name: "Pan integral", qty: 1 }],
      },
    ],
    body: [
      {
        heading: "La proteína, repartida y sin dramas",
        paragraphs: [
          "La duda habitual al dejar la carne es de dónde sale la proteína. La respuesta corta: de la legumbre, el huevo, los lácteos, el tofu y los frutos secos, y con esta cesta sale de sobra sin comprar un solo producto especializado.",
          "Tampoco hace falta combinar legumbre y cereal en el mismo plato, como se decía hace décadas. Comiendo variado a lo largo del día el asunto se resuelve solo, y eso libera la lista de reglas que sólo complican la cocina.",
        ],
      },
      {
        heading: "Lo que encarece una cesta vegetariana",
        paragraphs: [
          "No es la verdura: son los sustitutos. Las hamburguesas vegetales, los embutidos veganos y las bebidas vegetales de marca pueden duplicar el ticket, y en su mayoría son ultraprocesados con buena etiqueta.",
        ],
        bullets: [
          "Legumbre seca en vez de bote cuando haya tiempo de remojo: el kilo cuesta una fracción.",
          "Hummus casero con garbanzos, tahini y limón, en vez de tarrina: sale por menos de la mitad.",
          "Tofu natural en vez de preparados marinados, que se pagan al triple por el adobo.",
          "Frutos secos a granel, que es donde más se nota la diferencia por kilo.",
        ],
      },
      {
        heading: "Lo que conviene vigilar de verdad",
        paragraphs: [
          "Dos cosas, y ninguna es la proteína. El hierro de origen vegetal se absorbe peor, y ayuda acompañar la legumbre y las espinacas con algo de vitamina C —el limón exprimido por encima o una naranja de postre bastan—. Por eso los limones y las naranjas están en la lista y no son decorativos.",
          "La vitamina B12 es el otro punto: en una dieta ovolactovegetariana los huevos y los lácteos suelen cubrirla, pero si tiendes al veganismo conviene suplementarla. Eso ya no es una cuestión de lista de la compra, sino de hablarlo con tu médico.",
        ],
      },
      {
        heading: "Cómo se reparte la semana",
        paragraphs: [
          "Salen unas doce comidas: lentejas dos días, garbanzos al curry y en ensalada, tofu salteado con verduras, pasta con champiñones, tortillas y revueltos, cuscús con verdura asada y alubias con tomate.",
          "La verdura asada del domingo —pimiento, berenjena, calabacín, cebolla— es la que más rinde: sirve de guarnición, de relleno, en el cuscús y en bocadillo.",
        ],
      },
    ],
    faq: [
      {
        question: "¿Es más cara una compra vegetariana?",
        answer:
          "Al contrario, si se basa en legumbre, huevo y verdura de temporada: la legumbre es de lo más barato que hay por gramo de proteína. Se encarece cuando entran sustitutos procesados y bebidas vegetales de marca.",
      },
      {
        question: "¿Se cubre la proteína sin carne ni pescado?",
        answer:
          "Con esta cesta sí, holgadamente: legumbre casi a diario, dieciocho huevos, lácteos, tofu y frutos secos. No hace falta calcular nada ni combinar alimentos en el mismo plato.",
      },
      {
        question: "¿Sirve para una dieta vegana?",
        answer:
          "Quitando huevos, yogur, queso y leche, y subiendo legumbre, tofu y frutos secos. En ese caso la vitamina B12 hay que suplementarla, y eso conviene consultarlo con un profesional.",
      },
      {
        question: "¿Qué hago si el resto de la casa come carne?",
        answer:
          "Compartir la lista y que cada uno añada lo suyo funciona mejor que llevar dos listas: la base de verdura, legumbre y despensa es común, y sólo cambia la proteína principal.",
      },
    ],
    relatedTemplates: ["healthy", "weekly", "budget"],
    relatedGuides: ["how-to-make"],
  },
  {
    key: "batch-cooking",
    slug: "lista-compra-batch-cooking",
    locale: "es",
    title: "Lista de la compra para batch cooking",
    metaTitle: "Lista de la compra para batch cooking (una tarde, cinco cenas)",
    metaDescription:
      "Plantilla de la compra para cocinar una vez y comer toda la semana: ingredientes que aguantan cocinados, cantidades por tandas y orden por pasillos.",
    excerpt:
      "La compra de quien cocina una tarde y come de ella cinco días. No es la lista semanal de siempre: aquí manda lo que aguanta bien cocinado.",
    serves: "2-3 personas · 5 comidas cocinadas",
    budget: "40-50 € por semana",
    updatedAt: "2026-08-11",
    sections: [
      {
        categoryId: "produce",
        items: [
          { name: "Cebollas", qty: 1, unit: "kg", note: "La base de casi todo lo que vas a hacer" },
          { name: "Zanahorias", qty: 1, unit: "kg" },
          { name: "Pimiento rojo", qty: 3 },
          { name: "Calabaza", qty: 1, note: "Asada aguanta cinco días sin ponerse triste" },
          { name: "Patatas", qty: 2, unit: "kg" },
          { name: "Brócoli", qty: 2, note: "Escáldalo, no lo cuezas del todo" },
          { name: "Ajos", qty: 1, unit: "cabeza" },
          { name: "Limones", qty: 3 },
        ],
      },
      {
        categoryId: "meat",
        items: [
          {
            name: "Muslos de pollo deshuesados",
            qty: 1,
            unit: "kg",
            note: "Aguantan mejor que la pechuga",
          },
          { name: "Carne picada de ternera", qty: 700, unit: "g" },
        ],
      },
      {
        categoryId: "pantry",
        items: [
          { name: "Lentejas", qty: 500, unit: "g" },
          { name: "Garbanzos cocidos", qty: 3, unit: "botes" },
          { name: "Arroz integral", qty: 1, unit: "kg" },
          { name: "Tomate triturado", qty: 3, unit: "botes" },
          { name: "Caldo de verduras", qty: 2, unit: "briks" },
          { name: "Aceite de oliva virgen extra", qty: 1 },
          {
            name: "Pimentón, comino y curry",
            qty: 1,
            note: "Lo que cambia una base en cinco platos",
          },
        ],
      },
      {
        categoryId: "dairy",
        items: [
          { name: "Huevos", qty: 12 },
          { name: "Yogur natural griego", qty: 4, note: "Para salsas rápidas con limón y ajo" },
          { name: "Queso feta", qty: 1 },
        ],
      },
      {
        categoryId: "frozen",
        items: [
          { name: "Guisantes", qty: 500, unit: "g" },
          { name: "Espinacas", qty: 500, unit: "g" },
        ],
      },
      {
        categoryId: "other",
        items: [
          {
            name: "Táperes de cristal",
            qty: 6,
            note: "Sólo la primera vez, pero sin ellos esto no funciona",
          },
        ],
      },
    ],
    body: [
      {
        heading: "Por qué esta lista no es la semanal de siempre",
        paragraphs: [
          "El batch cooking no cambia cuánto comes, cambia cuándo cocinas. Y eso cambia qué conviene comprar: lo que se sirve recién hecho no es lo que aguanta cuatro días en la nevera.",
          "Por eso aquí hay muslo de pollo en vez de pechuga, arroz integral en vez de blanco y calabaza en vez de lechuga. No es capricho: la pechuga se seca al recalentarla, el arroz blanco se apelmaza y la hoja verde no sobrevive al táper. Cada elección de esta lista está tomada pensando en el jueves, no en el domingo.",
        ],
      },
      {
        heading: "Cómo se convierte esto en cinco comidas",
        paragraphs: [
          "La idea es cocinar tres bases y combinarlas, no cinco platos distintos. Con lo de esta lista salen: un sofrito grande de cebolla, zanahoria y tomate; una tanda de pollo asado con limón; y una olla de lentejas.",
        ],
        bullets: [
          "Sofrito + carne picada + patata = boloñesa y relleno de empanada.",
          "Sofrito + garbanzos + espinacas = potaje, y frío con feta es ensalada.",
          "Pollo + arroz integral + brócoli escaldado = el táper de siempre, pero bueno.",
          "Calabaza asada + caldo = crema, que se congela mejor que ninguna otra cosa.",
          "Huevos: la red de seguridad del viernes, cuando ya no queda nada.",
        ],
      },
      {
        heading: "Qué comprar de más y qué no",
        paragraphs: [
          "Duplica sin miedo el sofrito, la legumbre y la crema: aguantan, se congelan y no pierden nada. Es donde el batch cooking gana de verdad.",
          "No dupliques el pescado, la ensalada ni las patatas fritas de nadie. Y si sólo vas a cocinar una tarde al mes, esta lista no es la tuya: mira la mensual, que está pensada para despensa y congelador.",
        ],
      },
    ],
    faq: [
      {
        question: "¿Cuánto aguanta la comida del batch cooking en la nevera?",
        answer:
          "Entre tres y cuatro días en la parte más fría, guardada en cuanto se enfríe y en recipientes cerrados. Lo que vayas a comer el quinto día conviene congelarlo el mismo día que lo cocinas, no cuando ya lleva tres en la nevera.",
      },
      {
        question: "¿Cuánto se tarda en cocinar todo esto?",
        answer:
          "Entre dos horas y media y tres, con el horno trabajando mientras tú estás en los fuegos. La mayor parte es tiempo de cocción, no de estar delante.",
      },
      {
        question: "¿Sirve para una persona?",
        answer:
          "Sí, y es donde más se nota, porque cocinar para uno cada día es lo que más tiempo desperdicia. Baja la carne a la mitad y congela media tanda de cada base en raciones individuales.",
      },
      {
        question: "¿Puedo hacer batch cooking sin táperes de cristal?",
        answer:
          "Puedes, pero el plástico coge olor y no va al horno ni al microondas con la misma alegría. Es la única compra de esta lista que no repetirás.",
      },
    ],
    relatedTemplates: ["weekly", "healthy", "monthly"],
    relatedGuides: ["how-to-make", "save-money"],
  },
  {
    key: "student-flat",
    slug: "lista-compra-piso-estudiantes",
    locale: "es",
    title: "Lista de la compra para un piso de estudiantes",
    metaTitle: "Lista de la compra para estudiantes: la primera y la de cada semana",
    metaDescription:
      "Qué comprar al mudarte a un piso de estudiantes: la compra inicial de despensa y limpieza, y la lista semanal barata que la sigue. Compártela con tus compañeros.",
    excerpt:
      "Dos listas en una: lo que hay que comprar el primer día en un piso vacío, y lo que se repone cada semana entre varios.",
    serves: "3-4 compañeros · primera compra + semana",
    budget: "70-90 € la primera vez, 35-45 € por semana",
    updatedAt: "2026-08-11",
    sections: [
      {
        categoryId: "pantry",
        items: [
          { name: "Aceite de oliva", qty: 1 },
          { name: "Sal y pimienta", qty: 1 },
          { name: "Pasta", qty: 2, unit: "kg" },
          { name: "Arroz", qty: 1, unit: "kg" },
          { name: "Tomate frito", qty: 4, unit: "botes" },
          { name: "Atún en lata", qty: 6 },
          { name: "Legumbres cocidas", qty: 4, unit: "botes" },
          { name: "Azúcar", qty: 1 },
          { name: "Harina", qty: 1 },
        ],
      },
      {
        categoryId: "produce",
        items: [
          { name: "Cebollas", qty: 1, unit: "kg" },
          { name: "Patatas", qty: 2, unit: "kg" },
          { name: "Ajos", qty: 1, unit: "cabeza" },
          { name: "Tomates", qty: 1, unit: "kg" },
          { name: "Plátanos", qty: 6, note: "Lo más barato que se come sin cocinar" },
        ],
      },
      {
        categoryId: "dairy",
        items: [
          { name: "Leche", qty: 6, unit: "briks" },
          { name: "Huevos", qty: 12, note: "Docena grande: es la cena de emergencia de todos" },
          { name: "Queso rallado", qty: 1 },
        ],
      },
      {
        categoryId: "meat",
        items: [
          {
            name: "Pollo entero troceado",
            qty: 1,
            note: "Más barato por kilo que la bandeja de filetes",
          },
          { name: "Carne picada", qty: 500, unit: "g" },
        ],
      },
      {
        categoryId: "frozen",
        items: [
          { name: "Verdura congelada", qty: 1, unit: "kg" },
          { name: "Pescado congelado", qty: 500, unit: "g" },
        ],
      },
      {
        categoryId: "bakery",
        items: [{ name: "Pan de molde", qty: 2, note: "Uno al congelador nada más llegar" }],
      },
      {
        categoryId: "cleaning",
        items: [
          { name: "Detergente de lavadora", qty: 1 },
          { name: "Lavavajillas a mano", qty: 1 },
          { name: "Bayetas y estropajos", qty: 1 },
          { name: "Papel higiénico", qty: 12, unit: "rollos" },
          { name: "Bolsas de basura", qty: 1 },
          { name: "Papel de cocina", qty: 2 },
        ],
      },
      {
        categoryId: "personal",
        items: [
          { name: "Jabón de manos", qty: 1 },
          { name: "Papel de aluminio y film", qty: 1 },
        ],
      },
    ],
    body: [
      {
        heading: "La primera compra no es una compra semanal",
        paragraphs: [
          "Cuando llegas a un piso vacío, la mitad de lo que gastas no es comida: es aceite, sal, papel higiénico y detergente. Cosas que compras una vez y duran meses, y que hacen que la primera factura parezca disparatada comparada con las siguientes.",
          "Esta plantilla mezcla las dos cosas a propósito, marcando lo que es de arranque. La segunda semana quitas la limpieza y la despensa seca y la compra se queda en la mitad.",
        ],
      },
      {
        heading: "El problema real de un piso compartido no es qué comprar",
        paragraphs: [
          "Es quién compra, quién paga y qué es de quién. La comida compartida funciona bien con lo básico —aceite, sal, papel, productos de limpieza— y mal con todo lo demás, porque nadie come lo mismo ni a la misma hora.",
        ],
        bullets: [
          "Compartid la despensa y la limpieza: es lo que todos usáis sin darse cuenta.",
          "Cada uno lo suyo en fresco: así nadie vigila la nevera.",
          "Una lista compartida en el móvil evita el clásico «pensaba que lo comprabas tú»: quien ve que se acaba algo, lo apunta en el momento.",
          "Un solo bote de cada cosa. Tres botes de pimentón abiertos es dinero tirado y espacio robado.",
        ],
      },
      {
        heading: "Dónde se va el dinero en un piso de estudiantes",
        paragraphs: [
          "En comida preparada y en pedir a domicilio los días que nadie tiene ganas. Ninguna lista arregla eso del todo, pero tener pasta, huevos y tomate frito en casa sí quita la excusa más habitual.",
          "El pollo entero troceado y la verdura congelada son las dos líneas que más bajan el coste por ración sin cocinar mejor ni tener más tiempo.",
        ],
      },
    ],
    faq: [
      {
        question: "¿Cuánto cuesta la primera compra de un piso de estudiantes?",
        answer:
          "Entre 70 y 90 € para tres o cuatro personas, con la limpieza y la despensa incluidas. A partir de la segunda semana baja a 35-45 €, porque lo que dura meses ya está comprado.",
      },
      {
        question: "¿Es mejor comprar juntos o cada uno lo suyo?",
        answer:
          "Lo básico y la limpieza, juntos: sale más barato y se usa igual. El fresco, cada uno el suyo, porque los horarios y las dietas no coinciden y es donde empiezan los roces.",
      },
      {
        question: "¿Cómo repartimos lo que gasta cada uno?",
        answer:
          "Con precios apuntados en la propia lista compartida y una foto del ticket. Aquí puedes poner el precio de cada producto y ver el total, que es el número que hace falta para dividir sin discutir.",
      },
      {
        question: "¿Qué se puede comprar de marca blanca sin notarlo?",
        answer:
          "Legumbre de bote, tomate frito, pasta, arroz, leche y productos de limpieza. Es donde está la mayor parte del ahorro y donde menos se nota la diferencia.",
      },
    ],
    relatedTemplates: ["budget", "single", "pantry"],
    relatedGuides: ["save-money", "share-with-family"],
  },
  {
    key: "gluten-free",
    slug: "lista-compra-sin-gluten",
    locale: "es",
    title: "Lista de la compra sin gluten",
    metaTitle: "Lista de la compra sin gluten para celíacos (semana completa)",
    metaDescription:
      "Plantilla de la compra sin gluten para una semana: qué es naturalmente apto, dónde se esconde el gluten y qué hay que comprar certificado.",
    excerpt:
      "Una semana completa sin gluten, separando lo que ya es apto de forma natural de lo que hay que comprar certificado.",
    serves: "2 personas · 7 días",
    budget: "70-90 € por semana",
    updatedAt: "2026-08-11",
    sections: [
      {
        categoryId: "produce",
        items: [
          { name: "Patatas", qty: 2, unit: "kg" },
          { name: "Tomates", qty: 1, unit: "kg" },
          { name: "Cebollas", qty: 1, unit: "kg" },
          { name: "Calabacín", qty: 2 },
          { name: "Espinacas frescas", qty: 1, unit: "bolsa" },
          { name: "Manzanas", qty: 6 },
          { name: "Plátanos", qty: 6 },
          { name: "Aguacates", qty: 2 },
        ],
      },
      {
        categoryId: "meat",
        items: [
          { name: "Pechuga de pollo", qty: 700, unit: "g" },
          {
            name: "Carne picada",
            qty: 500,
            unit: "g",
            note: "Sin preparar: la hamburguesa formada suele llevar pan rallado",
          },
          { name: "Lomo de cerdo", qty: 400, unit: "g" },
        ],
      },
      {
        categoryId: "fish",
        items: [
          { name: "Salmón fresco", qty: 2, unit: "lomos" },
          { name: "Gambas peladas congeladas", qty: 300, unit: "g" },
        ],
      },
      {
        categoryId: "dairy",
        items: [
          { name: "Leche", qty: 4, unit: "briks" },
          { name: "Huevos", qty: 12 },
          {
            name: "Yogur natural",
            qty: 8,
            note: "Natural sin azucarar: los de sabores llevan más aditivos",
          },
          { name: "Queso curado en cuña", qty: 1, note: "Mejor en cuña que rallado" },
        ],
      },
      {
        categoryId: "bakery",
        items: [
          { name: "Pan sin gluten certificado", qty: 2, note: "Congela uno: se seca en un día" },
          { name: "Tortitas de maíz", qty: 1 },
        ],
      },
      {
        categoryId: "pantry",
        items: [
          { name: "Arroz", qty: 1, unit: "kg" },
          { name: "Pasta sin gluten certificada", qty: 500, unit: "g" },
          { name: "Legumbres cocidas", qty: 3, unit: "botes" },
          { name: "Tomate triturado", qty: 2, unit: "botes" },
          { name: "Harina de arroz o maíz", qty: 1 },
          { name: "Aceite de oliva virgen extra", qty: 1 },
          { name: "Caldo sin gluten certificado", qty: 2, unit: "briks" },
        ],
      },
      {
        categoryId: "breakfast",
        items: [
          {
            name: "Copos de avena certificados",
            qty: 1,
            note: "La avena normal se contamina en el molino",
          },
          { name: "Café", qty: 1 },
        ],
      },
    ],
    body: [
      {
        heading: "Lo que ya es apto y no hace falta buscar",
        paragraphs: [
          "La mayor parte de una compra normal es naturalmente sin gluten: fruta, verdura, carne y pescado frescos, huevos, legumbre seca, arroz, aceite y leche. Empezar por ahí es lo que hace que la lista no dé vértigo ni cueste el doble.",
          "El coste extra no está en la comida, está en los sustitutos: pan, pasta y bollería sin gluten valen entre dos y cuatro veces más. Cuanto más gire la semana en torno a arroz, patata y legumbre, menos se nota en el ticket.",
        ],
      },
      {
        heading: "Dónde se esconde el gluten cuando no lo esperas",
        paragraphs: [
          "Los sustos no vienen del pan, que es evidente. Vienen de productos que nadie asocia con el trigo y que se cuelan en cualquier compra.",
        ],
        bullets: [
          "Embutidos y patés: muchos llevan almidón de trigo como ligante.",
          "Caldos, sopas de sobre y cubitos concentrados.",
          "Salsa de soja: es de trigo, salvo la que se etiqueta tamari.",
          "Carne picada preparada, albóndigas y hamburguesas ya formadas.",
          "Avena: naturalmente apta, pero se procesa donde el trigo. Sólo la certificada sirve.",
          "Quesos rallados y algunos yogures de sabores, por los antiaglomerantes y espesantes.",
        ],
      },
      {
        heading: "Certificado o etiqueta: cuándo hace falta cada cosa",
        paragraphs: [
          "Para un producto de un solo ingrediente —arroz, patata, pollo— la etiqueta basta. Para todo lo procesado, la espiga barrada certifica que se ha controlado también la contaminación cruzada en fábrica, que es lo que una lista de ingredientes no puede garantizar.",
          "Si en casa convivís con gluten, la contaminación cruzada en la cocina importa tanto como la compra: tostadora aparte, tabla aparte y untar con cubierto limpio evitan la mayoría de los accidentes.",
        ],
      },
    ],
    faq: [
      {
        question: "¿Cuánto más cara es la compra sin gluten?",
        answer:
          "Entre un 20 % y un 40 % más si se sustituye pan y pasta por sus versiones certificadas. Si la semana se apoya en arroz, patata y legumbre, la diferencia baja mucho.",
      },
      {
        question: "¿La avena es sin gluten?",
        answer:
          "La avena en sí no lleva gluten, pero se cultiva y se muele donde el trigo, así que sólo es segura la certificada. Es uno de los descuidos más frecuentes.",
      },
      {
        question: "¿Sirve esta lista para una intolerancia no celíaca?",
        answer:
          "Sí, y con más margen: sin celiaquía la contaminación cruzada preocupa menos, así que puedes usar productos que declaran «puede contener trazas» y ahorrar bastante.",
      },
      {
        question: "¿Cómo aviso a quien compra por mí de qué puede coger?",
        answer:
          "Comparte la lista y usa la nota de cada producto para escribir «certificado» donde haga falta. Quien la abra ve la nota junto al producto, sin tener que preguntar en mitad del pasillo.",
      },
    ],
    relatedTemplates: ["healthy", "weekly", "pantry"],
    relatedGuides: ["how-to-make", "share-with-family"],
  },
  {
    key: "holiday-rental",
    slug: "lista-compra-apartamento-vacaciones",
    locale: "es",
    title: "Lista de la compra para un apartamento de vacaciones",
    metaTitle: "Lista de la compra para apartamento de vacaciones (una semana)",
    metaDescription:
      "Qué comprar al llegar a un apartamento de vacaciones: la compra del primer día para una cocina vacía, sin traerte medio armario de casa ni gastar de más.",
    excerpt:
      "La compra del primer día en una cocina que no es la tuya: lo justo para una semana, sin comprar un bote de especias que dejarás allí.",
    serves: "4 personas · 7 días",
    budget: "90-120 € la compra de llegada",
    updatedAt: "2026-08-11",
    sections: [
      {
        categoryId: "pantry",
        items: [
          { name: "Aceite de oliva", qty: 1, note: "Botella pequeña: la grande se queda allí" },
          { name: "Sal", qty: 1 },
          { name: "Pasta", qty: 1, unit: "kg" },
          { name: "Arroz", qty: 500, unit: "g" },
          { name: "Tomate frito", qty: 2, unit: "botes" },
          { name: "Atún en lata", qty: 4 },
          { name: "Aceitunas", qty: 1 },
        ],
      },
      {
        categoryId: "produce",
        items: [
          { name: "Tomates", qty: 1, unit: "kg" },
          { name: "Lechuga", qty: 1 },
          { name: "Cebollas", qty: 3 },
          { name: "Limones", qty: 3 },
          {
            name: "Fruta de temporada",
            qty: 2,
            unit: "kg",
            note: "Lo que mejor pinta tenga y no haya que cocinar",
          },
          { name: "Patatas", qty: 1, unit: "kg" },
        ],
      },
      {
        categoryId: "dairy",
        items: [
          { name: "Leche", qty: 4, unit: "briks" },
          { name: "Huevos", qty: 12 },
          { name: "Queso en lonchas", qty: 1 },
          { name: "Mantequilla", qty: 1 },
          { name: "Yogures", qty: 8 },
        ],
      },
      {
        categoryId: "deli",
        items: [
          { name: "Jamón serrano en lonchas", qty: 200, unit: "g" },
          { name: "Pavo o jamón cocido", qty: 300, unit: "g" },
        ],
      },
      {
        categoryId: "meat",
        items: [
          { name: "Pollo para plancha", qty: 800, unit: "g" },
          {
            name: "Salchichas o hamburguesas",
            qty: 8,
            note: "La cena fácil del día que llegáis tarde de la playa",
          },
        ],
      },
      {
        categoryId: "bakery",
        items: [
          { name: "Pan", qty: 2 },
          { name: "Pan de molde", qty: 1 },
          { name: "Galletas o bizcocho", qty: 1 },
        ],
      },
      {
        categoryId: "drinks",
        items: [
          { name: "Agua", qty: 12, unit: "botellas" },
          { name: "Refrescos", qty: 6 },
          { name: "Cerveza o vino", qty: 6 },
          { name: "Café soluble", qty: 1, note: "Salvo que sepas seguro qué cafetera hay" },
        ],
      },
      {
        categoryId: "cleaning",
        items: [
          { name: "Papel higiénico", qty: 4, unit: "rollos" },
          { name: "Bolsas de basura", qty: 1 },
          { name: "Lavavajillas a mano", qty: 1 },
          { name: "Papel de cocina", qty: 1 },
        ],
      },
      {
        categoryId: "personal",
        items: [
          { name: "Crema solar", qty: 1 },
          { name: "Aftersun", qty: 1 },
        ],
      },
    ],
    body: [
      {
        heading: "La regla de la cocina prestada",
        paragraphs: [
          "En un apartamento de alquiler nunca sabes qué hay hasta que abres los armarios: a veces hay aceite y sal, y a veces ni una sartén decente. La tentación es comprar como si estuvieras en casa, y así es como se acaba dejando allí medio armario de despensa al marcharse.",
          "La regla que funciona es sencilla: formatos pequeños de todo lo que no vas a terminar, y ninguna especia más allá de la sal. Comer de vacaciones es más simple que en casa, y la lista debería reflejarlo.",
        ],
      },
      {
        heading: "Qué comprar antes de llegar y qué al llegar",
        paragraphs: [
          "Llegar con el coche cargado desde casa sólo compensa para lo que no ocupa y sí cuesta: café si sois exigentes, un aceite decente, alguna especia en bolsita.",
        ],
        bullets: [
          "Antes de salir: agua para el viaje, algo de picar y el desayuno del primer día.",
          "Al llegar, ese mismo día: desayuno, algo de cena rápida y papel higiénico. Nada más.",
          "Al día siguiente, con la cocina ya vista: el resto de la lista, ajustando a lo que haya.",
          "Última compra el penúltimo día, no el último: lo que sobre lo tiraréis.",
        ],
      },
      {
        heading: "Las tres cosas que se olvidan siempre",
        paragraphs: [
          "Bolsas de basura, papel de cocina y algo para fregar. No están en ninguna lista mental porque en casa se reponen solos, y en un apartamento se echan de menos la primera noche.",
          "La cuarta, si vais con niños: un desayuno que les guste. Un apartamento sin nada conocido a las ocho de la mañana es un mal comienzo del día de playa.",
        ],
      },
    ],
    faq: [
      {
        question: "¿Cuánto cuesta la compra de llegada a un apartamento?",
        answer:
          "Entre 90 y 120 € para cuatro personas y una semana, contando bebida y limpieza. Es más cara de lo que parece porque incluye básicos que en casa ya tienes.",
      },
      {
        question: "¿Qué me llevo de casa y qué compro allí?",
        answer:
          "De casa, lo pequeño y caro: café, especias, un buen aceite en botella pequeña. Allí, todo lo voluminoso y el fresco, que no aguanta el viaje.",
      },
      {
        question: "¿Merece la pena hacer una compra grande el primer día?",
        answer:
          "No. Compra sólo el desayuno y la primera cena, mira la cocina con calma y haz el resto al día siguiente. Comprar antes de saber si hay horno o sólo dos fuegos es como sobran cosas.",
      },
      {
        question: "¿Cómo nos organizamos entre los que vamos?",
        answer:
          "Comparte la lista por WhatsApp antes de salir. Cada uno añade lo suyo desde su móvil y el que llegue primero al supermercado la tiene entera, sin llamadas desde el pasillo.",
      },
    ],
    relatedTemplates: ["weekly", "family-of-4", "pantry"],
    relatedGuides: ["share-with-family", "save-money"],
  },
];

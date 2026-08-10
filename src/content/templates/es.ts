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
    relatedTemplates: ["family-of-4", "pantry", "healthy"],
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
    relatedTemplates: ["weekly", "pantry", "healthy"],
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
    relatedTemplates: ["weekly", "family-of-4", "healthy"],
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
    relatedTemplates: ["weekly", "family-of-4", "pantry"],
    relatedGuides: ["how-to-make"],
  },
];

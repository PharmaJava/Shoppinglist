import type { Post } from "../types";

/**
 * Posts en español. Como el resto del contenido, no son traducción de los
 * ingleses: misma clave y tema equivalente (lo exige hreflang), pero texto
 * nativo con los ejemplos y precios de cada mercado.
 */
export const postsEs: Post[] = [
  {
    key: "overspending-mistakes",
    slug: "errores-al-hacer-la-compra-que-te-hacen-gastar-mas",
    locale: "es",
    title: "7 errores al hacer la compra que te hacen gastar de más",
    metaTitle: "7 errores al hacer la compra que te hacen gastar de más",
    metaDescription:
      "Los errores más comunes al hacer la compra —ir sin lista, ir con hambre, pagar la conveniencia— y cuánto cuesta cada uno. Con soluciones concretas.",
    excerpt:
      "Ninguno de estos errores parece caro por separado. Sumados, son la diferencia entre el ticket que esperabas y el que te llevas a casa.",
    publishedAt: "2026-08-10",
    updatedAt: "2026-08-10",
    body: [
      {
        heading: "1. Ir sin lista (o con la lista en la cabeza)",
        paragraphs: [
          "Es el error raíz del que salen casi todos los demás. Sin lista, cada pasillo es una decisión nueva, y las decisiones tomadas delante del lineal las gana casi siempre el supermercado: para eso están el final de pasillo, la altura de los ojos y la zona de cajas.",
          "La lista en la cabeza no cuenta como lista. En cuanto entras, la memoria de trabajo se llena de estímulos y lo que era «seguro que me acuerdo» se convierte en una segunda visita el martes — con su segundo ticket de cosas no previstas.",
        ],
      },
      {
        heading: "2. Comprar con hambre",
        paragraphs: [
          "El clásico entre los clásicos, y sigue funcionando contra ti. Con hambre no compras comida: compras antojos con fecha de caducidad corta. La solución no requiere disciplina, requiere calendario — la compra después de comer, no antes de cenar.",
        ],
      },
      {
        heading: "3. Pagar la conveniencia sin darte cuenta",
        paragraphs: [
          "La fruta cortada, el queso rallado, la verdura lavada en bolsa: pagas dos y hasta tres veces el precio por kilo del mismo producto entero. A veces la conveniencia compensa — si la alternativa es no comer verdura, la bolsa lavada es una ganga. El error no es pagarla: es pagarla sin haberlo decidido.",
          "El truco es tenerla en la lista con nombre y apellido. «Espinacas en bolsa» es una decisión; coger la bolsa porque estaba a mano no lo es.",
        ],
      },
      {
        heading: "4. Ignorar el precio por kilo",
        paragraphs: [
          "El precio grande de la etiqueta es el del envase; el que importa es el pequeño de abajo, por kilo o por litro. Los formatos «ahorro» no siempre ahorran, y las marcas juegan con tamaños de envase raros justamente para que comparar de cabeza sea difícil. Diez segundos de mirar el precio por kilo valen más que cualquier cupón.",
        ],
      },
      {
        heading: "5. No mirar arriba ni abajo",
        paragraphs: [
          "La altura de los ojos es el escaparate más caro del supermercado, y las marcas pagan por estar ahí. Lo equivalente y más barato suele estar en la balda de abajo o en la de arriba. Es literalmente agacharse una vez por pasillo.",
        ],
      },
      {
        heading: "6. Comprar cada día en vez de planificar la semana",
        paragraphs: [
          "Cada visita al súper es una exposición nueva a todo lo anterior. Quien entra cinco veces por semana paga cinco veces el «peaje de la puerta»: el antojo, la oferta, el ya-que-estoy. Una compra semanal grande más una reposición de fresco a mitad de semana reduce las visitas — y con ellas, las compras que no estaban en el plan.",
        ],
      },
      {
        heading: "7. Que cada uno compre por su cuenta",
        paragraphs: [
          "En una casa donde compran dos personas sin lista común, los duplicados no son mala suerte: son el resultado esperable. Dos botes de tomate, dos lechugas, y la mitad acaba en la basura.",
          "La solución es compartir una única lista que ambos actualicen — y marcar en tiempo real lo que ya está cogido. Es exactamente lo que hace esta app, gratis y sin que nadie se registre: creas la lista, mandas el enlace por WhatsApp y se acabaron los duplicados.",
        ],
      },
    ],
    faq: [
      {
        question: "¿Cuánto se ahorra comprando con lista?",
        answer:
          "Depende del punto de partida, pero el mecanismo es simple: la lista elimina las decisiones improvisadas, que son donde se concentra el gasto no planificado. El ahorro está menos en los cupones y más en las cosas que no entran en el carro.",
      },
      {
        question: "¿Es mejor comprar una vez a la semana?",
        answer:
          "Para el bolsillo, casi siempre: menos visitas significan menos compras impulsivas. Para el desperdicio, conviene añadir una reposición corta de fresco a mitad de semana en lugar de sobrecomprar fruta y verdura el sábado.",
      },
      {
        question: "¿Las marcas blancas son siempre más baratas?",
        answer:
          "Por kilo, casi siempre; en calidad, depende de la categoría. La forma de decidir sin fe ciega es el precio por kilo y probar: en básicos como legumbre, arroz, leche o congelados, la diferencia de precio rara vez viene con una diferencia de calidad proporcional.",
      },
    ],
    relatedTemplates: ["weekly", "pantry"],
    relatedGuides: ["how-to-make"],
    relatedPosts: ["forget-items"],
  },
  {
    key: "forget-items",
    slug: "por-que-siempre-se-te-olvida-algo-en-el-super",
    locale: "es",
    title: "Por qué siempre se te olvida algo en el súper (y cómo evitarlo)",
    metaTitle: "Por qué siempre se te olvida algo en el súper (y cómo evitarlo)",
    metaDescription:
      "El olvido en el supermercado no es despiste: es cómo funciona la memoria. Tres cambios concretos para volver a casa con todo, sin segunda visita.",
    excerpt:
      "Volver del súper sin lo único que de verdad hacía falta no es un fallo tuyo: es un fallo del sistema que usas para recordar.",
    publishedAt: "2026-08-10",
    updatedAt: "2026-08-10",
    body: [
      {
        heading: "El olvido no ocurre en el súper: ocurre en casa",
        paragraphs: [
          "El momento en el que pierdes el champú no es cuando pasas de largo por el pasillo de higiene. Es tres días antes, cuando se acabó el bote y pensaste «ya me acordaré». La memoria prospectiva —acordarse de acordarse— es de lo menos fiable que tenemos, y va peor cuanto más ocupada está la cabeza.",
          "Por eso el único sistema que funciona es capturar en el momento: el bote se acaba, el producto entra en la lista. No después, no al hacer la lista del sábado. En el momento.",
        ],
      },
      {
        heading: "La lista de papel se olvida con todo lo demás",
        paragraphs: [
          "La ironía de la lista en papel es que también hay que acordarse de ella: de escribirla, de completarla y de llevarla encima. El móvil resuelve la mitad del problema solo — siempre va contigo. La otra mitad la resuelve que la lista sea compartida: cualquiera de la casa puede añadir el champú en el momento en que se acaba, esté donde esté.",
        ],
      },
      {
        heading: "En la tienda, el orden lo es todo",
        paragraphs: [
          "El segundo tipo de olvido pasa dentro: llevas la lista, y aun así te saltas cosas. Casi siempre es un problema de orden. Una lista desordenada te obliga a releerla entera en cada pasillo, y releer con el carro en marcha es como corregir un examen andando.",
          "Con la lista agrupada por pasillos —fruta, lácteos, carnicería, despensa— cada zona del súper tiene su bloque, lo marcas y pasas al siguiente. Esta app lo hace sola al añadir cada producto, y en modo supermercado la pantalla no se apaga y los elementos son grandes, para marcarlos con una mano en el carro.",
        ],
      },
      {
        heading: "Tres cambios que eliminan la segunda visita",
        paragraphs: ["No hace falta un sistema complejo. Hacen falta tres hábitos pequeños."],
        bullets: [
          "Captura inmediata: lo que se acaba entra en la lista en ese momento, no «luego».",
          "Lista única y compartida: una sola fuente de verdad que toda la casa puede tocar.",
          "Orden por pasillos: en la tienda se marca por zonas, no se relee de arriba abajo.",
        ],
      },
    ],
    faq: [
      {
        question: "¿Por qué olvido justo lo que más falta hace?",
        answer:
          "Porque lo urgente se apunta mentalmente en el peor momento —cuando estás ocupado con otra cosa— y la memoria prospectiva pierde esos recordatorios con facilidad. La solución no es esforzarse más en recordar: es capturar en el momento en una lista que siempre llevas encima.",
      },
      {
        question: "¿Sirve ordenar la lista si mi súper es distinto?",
        answer:
          "Sí. El orden exacto de pasillos varía entre cadenas, pero la agrupación —fresco junto, despensa junto, limpieza junto— funciona en cualquiera: reduce las relecturas, que es donde se producen los saltos.",
      },
      {
        question: "¿Qué pasa si me quedo sin cobertura dentro de la tienda?",
        answer:
          "Con esta app, nada: la lista funciona sin conexión y sincroniza sola al recuperar la red. Lo que marques dentro no se pierde.",
      },
    ],
    relatedTemplates: ["weekly", "pantry"],
    relatedGuides: ["how-to-make", "share-with-family"],
    relatedPosts: ["overspending-mistakes"],
  },
];

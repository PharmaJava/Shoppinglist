# De una receta a la lista (F3-6)

Pegas la receta y sales con la compra hecha. Va detrás del interruptor de la Fase 3
(`NEXT_PUBLIC_FEATURE_PREMIUM`), o sea que en producción **hoy no existe**: la ruta da 404.

---

## 1. Heurística, no IA

El plan lo dice así (`docs/04-BACKLOG.md`, F3-6): «heurística primero, LLM después». Y el orden
importa.

Una receta pegada de internet tiene una estructura muy reconocible: un título, a veces «Para 4
personas», un encabezado «Ingredientes», una línea por ingrediente, y luego prosa. Resolver eso con
un modelo sería **pagar por cada receta para hacer peor lo que hacen bien tres expresiones
regulares** — y encima con una espera de segundos donde ahora no hay ninguna.

Lo que la heurística **no** hace es entender la receta: no sabe que el sofrito lleva cebolla si no
está escrita, ni que «harina de fuerza» y «harina» son lo mismo. Por eso lo leído **se enseña antes
de crear la lista**, con todo marcado y pudiendo desmarcar. Ahí es donde se cae la sal, el aceite y
lo que ya está en casa, que es la mitad de una receta.

## 2. Qué reconoce

| Lo que trae la receta | Lo que sale |
|---|---|
| `- 200 g de harina` | Harina, 200 g |
| `2 cucharadas de aceite` | Aceite, 2 cucharadas |
| `1 ½ tazas de azúcar` | Azúcar, 1.5 tazas |
| `1.5 kg de patatas` | Patatas, 1.5 kg |
| `2-3 tomates maduros` | Tomates maduros, 2 |
| `1 cebolla, picada muy fina` | Cebolla, 1 |
| `250 g de mantequilla (a temperatura ambiente)` | Mantequilla, 250 g |
| `Sal al gusto` | Sal, sin cantidad |
| `Para la masa:` | *(nada: es un subtítulo)* |
| `1. Pela las patatas y córtalas en láminas.` | *(nada: es un paso)* |

Y en inglés lo mismo con `cups`, `tablespoons`, `cloves`, `to taste`…

**Cómo distingue un ingrediente de un paso.** Un ingrediente es una línea corta; un paso es una
frase. Se corta por el encabezado («Ingredientes» → «Preparación»), y si la receta no los trae, por
longitud: más de diez palabras, o una frase acabada en punto, es prosa.

No hay forma de acertar siempre, así que **falla hacia el lado que se puede arreglar de un toque**:
colar un paso se ve en la pantalla de repaso y se quita; perder un ingrediente no se nota hasta el
súper.

**Un decimal no es una numeración.** «1.5 kg de patatas» empieza igual que «1. harina», así que la
viñeta numerada exige un espacio detrás. Sin eso, litro y medio de patatas se quedaba en cinco
kilos.

**Reescalar.** Si la receta dice para cuántos es, se puede cambiar y las cantidades se multiplican.
Lo que no lleva cantidad se queda como está: media pizca de sal no significa nada.

## 3. Por qué el parser vive en el servidor

Es texto y expresiones regulares: podría correr en el navegador. Está en una Server Action por dos
motivos.

**El plan se comprueba donde no se puede falsear.** `require_premium()` (migración 0010) lanza si
quien llama no paga, y eso no depende de ningún interruptor del cliente.

**Es la forma que tendrá cuando haya modelo.** Cuando llegue el LLM —para las recetas que la
heurística no sabe leer— cada llamada costará dinero y tendrá que pasar por aquí igualmente, con su
límite de uso. Montarlo ya con esta forma evita rehacer la pantalla entonces.

Lo que **no** se pretende es que el algoritmo sea un secreto: está en el repositorio y se puede
leer. Lo que se protege es el servicio, no la receta de cómo está hecho.

La acción además comprueba el interruptor: una Server Action se puede invocar por su identificador
aunque no haya pantalla que la llame, y con la Fase 3 apagada no debe hacer nada.

## 4. Qué pasa después

La lista se crea por el mismo camino que una plantilla del catálogo (`createListFromTemplate`), así
que hereda todo lo demás sin escribir nada nuevo: la categoría se deduce del nombre y la lista sale
ordenada por pasillos, entra en el historial de productos, y se sincroniza por el outbox como
cualquier otra. Una lista nacida de una receta no se comporta distinto de una escrita a mano, que
es justo lo que hay que conseguir.

## 5. Lo que protege qué

| | Lo pone | Se comprueba en |
|---|---|---|
| Que la ruta no exista | `NEXT_PUBLIC_FEATURE_PREMIUM` | `notFound()` en la página |
| Que la acción no responda con la fase apagada | El mismo interruptor | Server Action |
| Que sólo un premium la use | `require_premium()` | Base de datos |
| Que no entre un libro entero | Tope de 20.000 caracteres | Server Action |

## 6. Lo que falta

- **El LLM para lo que la heurística no sabe leer**: recetas en un párrafo corrido, o en vídeo. Con
  límite de uso por persona y coste vigilado, que es lo que dice el plan.
- **Leer una receta desde una URL.** Traerse la página de un blog y limpiarla es otro problema
  (paywalls, JavaScript, `robots.txt`) y merece su propia PR.
- **Descontar lo que ya hay en la despensa** (F3-5): saber que quedan cuatro huevos y no ponerlos.
  Es el siguiente paso natural cuando las dos funciones estén encendidas.

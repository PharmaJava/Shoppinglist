# Códigos de barras (F3-7)

Apuntas al código con la cámara y el producto entra en la lista con su nombre. Va detrás del
interruptor de la Fase 3 (`NEXT_PUBLIC_FEATURE_PREMIUM`), o sea que en producción **hoy no
existe**: el botón no se pinta y la ruta de consulta responde 404.

---

## 1. Dónde vive

No tiene página propia. Es un botón en la barra de añadir de una lista, al lado del micrófono: se
escanea **estando en la lista**, que es donde se quiere el producto.

Ese botón no usa `<PremiumGate>` como el resto de la fase, y es a propósito: la pared de pago es
una tarjeta con título, explicación y enlace a precios, y eso no cabe en una fila de botones
redondos. En una barra, lo que corresponde es no estar —igual que el micrófono no aparece en los
navegadores que no entienden de voz—. Quien no paga se entera en `/precios`.

## 2. De un número a un producto

Escanear no dice qué es: dice un número. Se traduce en dos pasos y **en este orden**:

1. **Tu memoria** (`user_barcodes`). Lo que has enseñado una vez manda sobre lo que diga nadie.
2. **Open Food Facts**, base de datos abierta y colaborativa de productos de alimentación (ODbL).

El orden es la mitad de la función: para la marca blanca del súper de al lado, una base de datos
de fuera suele no saber nada, o saberlo con un nombre que no es el que usa esta persona. Cuando el
código no se conoce, se pide el nombre **y se aprende**: la segunda vez que se escanee ese envase
la respuesta es instantánea.

Se recuerda siempre, no sólo cuando el nombre se escribe de cero. Corregir «Leche entera
pasteurizada Hacendado» por «leche» es exactamente lo que hay que guardar.

**Por qué la memoria es de cada uno y no una tabla compartida**: si cualquiera pudiera escribir el
nombre de un código para todos, bastaría una tarde para llenarla de tonterías, y moderar eso es un
trabajo que aquí no hay quien haga.

## 3. La cámara

`BarcodeDetector`, que va incluida en el navegador. No se descarga ninguna librería: meter medio
megabyte de wasm en un móvil con datos justos para leer un número sería el mayor coste de toda la
aplicación.

**Safari no la implementa**, ni en iOS ni en Mac. Eso no es un caso raro: es la mitad de los
móviles. Por eso el campo para teclear el número **siempre está**, no aparece sólo cuando algo
falla — y el número está impreso debajo de las rayas, así que a veces es hasta más rápido.

Detalles que no se ven pero se notan:

- **Sólo formatos de producto** (EAN-13, EAN-8, UPC-A, UPC-E). Aceptar todos los que soporta el
  navegador haría que apuntar a un cartel del súper devolviera una URL en vez de un producto.
- **La cámara de atrás** (`facingMode: environment`): nadie escanea un envase con la selfie.
- **La cámara se apaga** al cerrar la hoja y al desmontar. Dejar la luz encendida es la forma más
  rápida de que alguien desinstale la aplicación.
- **Diez fotogramas por segundo**, que va sobrado y no calienta el móvil.
- **Un resultado a la vez**: mientras se mira lo encontrado, la cámara sigue viendo el mismo
  envase; sin esa guarda, la pantalla se reiniciaría cada décima de segundo.

## 4. El dígito de control

Un GTIN (EAN-8, UPC-A, EAN-13, GTIN-14) lleva al final un dígito que se calcula a partir de los
demás. Se comprueba **siempre**, y es lo que separa una lectura buena de una mala: una cámara con
poca luz devuelve dígitos de más o de menos.

Sin esa comprobación pasarían dos cosas, las dos malas: se preguntaría a Open Food Facts por
productos que no existen —maltratando un servicio gratuito de voluntarios—, y la pantalla
parpadearía entre «no lo conozco» y el producto bueno mientras se apunta.

Un UPC-A de 12 dígitos se guarda como el EAN-13 que empieza por cero: es el mismo producto, y sin
unificarlos el mismo bote acabaría dos veces en la memoria según con qué lector se leyera.

## 5. Por qué la consulta pasa por el servidor

`/api/barcode/[code]` es un intermediario hacia Open Food Facts. Podría llamarla el navegador
directamente; se hace aquí por tres motivos:

1. **Open Food Facts pide identificarse** con un `User-Agent` propio, y un navegador no puede
   ponerlo.
2. **Privacidad**: así lo que escanea cada persona no queda asociado a su IP en un tercero. Open
   Food Facts sólo ve las peticiones de este servidor.
3. **Se puede cerrar la puerta**: la consulta es de pago, y aquí se comprueba con
   `require_premium()`. Sin eso, esto sería una pasarela gratuita para cualquiera.

Y dos decisiones dentro de la ruta:

- **Cinco segundos y se abandona.** Esto se usa de pie en un pasillo: si la fuente va lenta, es
  mejor decir «no lo conozco, escribe el nombre» que dejar la cámara pensando.
- **`Cache-Control: private`.** La respuesta depende de quién pregunta —hay que ser premium—, así
  que no puede acabar en una caché compartida. Un día de caché en el navegador: un código de barras
  no cambia de producto.

No confundir esto con integrar el catálogo de un supermercado, que se descartó por buenas razones
en `docs/06-PRECIOS.md`. Open Food Facts no es de nadie: es abierta, cualquiera puede consultarla y
cualquiera puede corregirla.

## 6. Lo que protege qué

| | Lo pone | Se comprueba en |
|---|---|---|
| Que el botón no exista | `NEXT_PUBLIC_FEATURE_PREMIUM` | `usePlan()` en el botón |
| Que la ruta no responda | El mismo interruptor | Route handler |
| Que sólo un premium consulte | `require_premium()` | Base de datos |
| Que sólo un premium enseñe códigos | RLS `barcodes_insert_own` + `is_premium()` | Base de datos |
| Que nadie vea los códigos de otro | RLS `barcodes_select_own` | Base de datos |
| Que no se pregunte por basura | Dígito de control, antes de salir a la red | Cliente y servidor |

## 7. Comprobado en local

Contra un PostgreSQL 16 con las trece migraciones y el stub de Supabase: un usuario gratuito no
puede enseñar un código, escanear dos veces el mismo corrige el nombre en vez de duplicar la fila,
un código no numérico no entra, nadie ve los de otro, y quien deja de pagar sigue viendo los suyos
y puede borrarlos.

Los códigos de las pruebas son reales y su dígito de control se puede comprobar a mano:
`5449000000996` (Coca-Cola 33 cl), `96385074` (el EAN-8 de ejemplo de la especificación) y
`036000291452` (UPC-A).

## 8. Lo que falta

- **Escanear para tachar**: apuntar a lo que se va metiendo en el carro y que se marque solo.
- **Escanear a la despensa** (F3-5), con la fecha de caducidad del envase.
- **Precio por código**: el historial ya guarda precios medios por producto; enlazarlos con el
  código daría el precio de *ese* formato exacto.

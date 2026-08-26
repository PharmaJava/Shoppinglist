# Precios: por qué no integramos el catálogo de un supermercado

Decisión tomada el 11 de agosto de 2026, tras estudiar la API de Mercadona.
Se documenta aquí porque la pregunta va a volver, y la respuesta corta —«no»—
sin el razonamiento detrás invita a reabrirla cada seis meses.

## Lo que hay

Mercadona **no publica una API para desarrolladores**. Lo que existe es la API
interna de su tienda online, en `tienda.mercadona.es/api/`, que la propia web
usa desde el navegador y responde sin autenticación:

- `GET /api/categories/` y `/api/categories/<id>/`
- `GET /api/products/<id>/`, con `/similars/` y `/xselling/`
- `GET /api/home/`, `/new-arrivals/`, `/price-drops/`
- `PUT /api/postal-codes/actions/change-pc/` para fijar el código postal

Hay una decena de proyectos que la envuelven (`mercapy`, `mercaapi`,
`merca-api`, `MCP-Mercadona`, un scraper en Apify…). **Todos los que se
describen a sí mismos usan la palabra «unofficial»**, y ninguno documenta
límites de uso porque no hay ninguno publicado.

## Por qué no la usamos

**No es pública, es interna.** Que responda sin clave no la convierte en una
API abierta: no hay documentación, ni versionado, ni términos que digan qué se
puede hacer con los datos. Puede cambiar o cerrarse cualquier martes, sin
aviso, y llevándose por delante una funcionalidad que habríamos vendido como
propia.

**`robots.txt` desautoriza `/api`.** Es la señal explícita de «no automatices
esto» que da el propio sitio. Ignorarla teniendo un producto público, con
dominio y empresa detrás, es una posición mala de defender.

**Los precios no son un dato nuestro.** Republicarlos dentro de nuestra
aplicación es explotar una base de datos ajena, con lo que eso implica en
derecho *sui generis* de bases de datos y en las condiciones de uso de su
tienda. El riesgo no es proporcional a la mejora.

**Técnicamente tampoco sale gratis.** El navegador no puede llamarla —CORS—,
así que haría falta un proxy en nuestro servidor: todo el tráfico saldría de
las IP de Vercel, identificable y bloqueable de una vez. Y el precio depende
del almacén (`wh`), que se deriva del código postal, así que sin pedirle la
dirección a cada usuario enseñaríamos precios de otra provincia.

**Y ataría el producto a una cadena.** ListaSupermercado no es la app de
Mercadona. Integrar su catálogo —y sólo el suyo— cambia lo que el producto
promete a quien compra en Lidl, Consum, Alcampo o el mercado del barrio, que
son la mayoría del mercado sumados.

## Qué hacemos en su lugar

Aprender de cada usuario. Cuando alguien pone precio a un producto se guarda
en su historial (`user_product_history.avg_price_cents`) y la siguiente vez se
le ofrece: «la última vez lo pagaste a 1,45 €. Usar».

Tiene tres ventajas sobre cualquier tarifa nacional:

1. **Es el precio de su tienda**, no el de una cadena en la que quizá no
   compra. Nadie paga el precio medio de España.
2. **Mejora sola con el uso** y no depende de que nadie mantenga un catálogo.
3. **Es un dato del usuario**, con su RLS, exportable y borrable con la cuenta.

La media es exacta y ponderada por número de muestras, no exponencial: lo que
interesa es «cuánto suele costarme», no el precio de hoy, que oscila con cada
oferta.

## Qué haría cambiar la decisión

- Que algún supermercado publique una API con términos de uso explícitos.
- Un acuerdo de afiliación, donde los datos vendrían con permiso —y de paso
  con modelo de negocio (ver `00-PLAN.md`, Fase 4).
- Una fuente agregada y con licencia clara para varias cadenas a la vez.

Mientras tanto, el precio lo pone quien compra, que además es quien sabe lo
que le ha costado.

---

# Revisión del 26 de agosto de 2026

La pregunta volvió a los quince días, como estaba previsto, esta vez con dos
proyectos concretos encima de la mesa: `datania/mercadona-catalog` y
`ivorpad/mercadona-cli`. Se reabre la decisión con lo que aportan.

**La decisión no cambia.** Pero dos cosas sí, y una de ellas abre una puerta
que en agosto no existía.

## 1. La fuente se ha endurecido, no abierto

En agosto esto se describía como una API JSON abierta que respondía sin clave.
Lo que documenta `mercadona-cli` en agosto es otra cosa:

> «Unofficial. Mercadona has no public API. Bring your own credentials; use at
> a sane request rate.»

Y por dentro: la **búsqueda ya no va por `/api/`, va por Algolia**, con un
`app-id` que el propio CLI descubre leyendo el *bundle* de JavaScript de la
web; las lecturas de catálogo van **detrás de Akamai**. `datania` confirma que
`robots.txt` sigue bloqueando `/api`, y se etiqueta a sí mismo «Documento no
oficial».

Sacar una clave de un *bundle* para consultar el índice de búsqueda de otro no
es lo mismo que leer un JSON que está ahí puesto. Ni técnicamente —eso se cae
el día que rueden las claves— ni en cómo se lee desde fuera.

La primera condición de la lista de arriba —«una API con términos de uso
explícitos»— **sigue sin cumplirse**, y hoy está más lejos que en agosto.

## 2. El precedente que se cita a favor es el más flojo de los dos

Se repite mucho que en España el *scraping* ya está resuelto por
**Ryanair contra Atrápalo** (STS 572/2012, 9 de octubre). Es verdad que Ryanair
perdió. Pero conviene leer *por qué*: el Supremo apreció que Ryanair **no había
probado inversión sustancial** en la obtención, verificación y presentación de
los contenidos, sino sólo en crear el dato. Es decir, no ganó Atrápalo por
hacer *scraping*: perdió Ryanair por no acreditar su derecho.

Y hay una segunda sentencia que casi nadie cita, un año posterior y del
tribunal que manda en esto: **TJUE C-202/12, *Innoweb contra Wegener***
(19 de diciembre de 2013). Resolvió que un **metabuscador dedicado** —un
servicio que consulta la base de otro y presenta a su usuario los resultados
que le interesan— **sí reutiliza** esa base a efectos del artículo 7.1 de la
Directiva 96/9. En ese caso, anuncios de coches.

Un comparador de la compra es exactamente eso: un metabuscador dedicado.

Los dos casos apuntan en direcciones distintas, y cuál se aplica depende de si
la cadena logra acreditar inversión sustancial en **obtener y verificar** su
catálogo, no en generarlo. Hay argumento en contra —el precio lo *crea* el
supermercado, y la doctrina del TJUE en *British Horseracing Board* excluye de
la protección la mera creación del dato—, y por eso esto no es una respuesta
cerrada. Pero seis cifras de referencias con precio revisado a diario coloca a
una cadena de supermercados en mucha mejor posición probatoria que a una
aerolínea con sus propias tarifas.

*Esto es una lectura de dos sentencias, no un dictamen. Si algún día se decide
avanzar por aquí, se consulta antes con quien firme.*

## 3. Ya existe, y lleva una década

**Soysuper** compara nueve cadenas —Mercadona, Carrefour, Eroski, Alcampo, El
Corte Inglés, Hipercor, DIA, Caprabo y Condis—, con más de 150.000 referencias
actualizadas a diario, y la OCU remite a él en sus guías.

Esto no lo invalida todo, pero sí desmonta la frase «esto transformaría el
producto». Entrar ahí es llegar segundo a un sitio ocupado, compitiendo en el
eje donde somos débiles —la cantidad y frescura del dato— y soltando aquel en
el que somos fuertes: que la lista funcione **dentro del súper, sin cobertura,
compartida con quien vive contigo**. Soysuper no hace eso.

## 4. Lo que sí ha aparecido: Open Prices

Y aquí está lo interesante, porque encaja con la tercera condición de la lista
—«una fuente agregada y con licencia clara»— y con lo que esta aplicación ya
hace.

**Open Prices** (`prices.openfoodfacts.org`) es el proyecto de precios de Open
Food Facts, la misma base abierta que ya usamos para traducir códigos de barras
(ver `15-CODIGOS.md`). Es una base **colaborativa y con licencia ODbL**, con
API REST, con **histórico** de precios, y consultable por código de barras,
tienda, localidad y país. Para aportar un precio se exige **prueba**: foto de la
etiqueta o del tique.

Por qué encaja aquí y no encajaba nada de lo anterior:

1. **Tiene licencia.** No hay que discutir si se puede: pone cómo, y a cambio
   de atribución.
2. **Es multicadena por diseño.** No ata el producto a Mercadona, que era la
   quinta objeción de la decisión original.
3. **Es lo que ya hacemos, pero compartido.** Esta aplicación ya escanea el EAN
   y ya pregunta el precio (`record_product_price`, migración 0004). La
   diferencia entre lo de hoy y Open Prices es si ese dato se queda en el
   historial de una persona o se aporta —con su permiso— a una base común de la
   que además se lee.
4. **No cambia la filosofía, la escala.** Sigue siendo «el precio lo pone quien
   compra». Sólo que ahora quien compra no tiene que ser tú.

### Lo que hay que medir antes de escribir una línea

**La cobertura en España.** Todo lo demás da igual si en Open Prices hay cuatro
precios españoles: un «precio orientativo» que casi nunca aparece es peor que
no prometerlo.

No he podido medirlo: desde este entorno el proxy de salida bloquea
`prices.openfoodfacts.org` y `huggingface.co`, así que **no he ejecutado ni una
consulta real** contra ninguna de las fuentes de este documento. Todo lo de
arriba sale de la documentación de los proyectos y de las sentencias, no de
haberlo probado.

La consulta que decide, cuando se pueda hacer desde una máquina con salida:

```bash
curl 'https://prices.openfoodfacts.org/api/v1/prices?location_country=Spain&size=1'
# interesa el campo `total`
```

Y luego, para los veinte productos más añadidos de la aplicación, qué
porcentaje tiene al menos un precio español del último mes. Con eso se decide,
no con una impresión.

### Y si la cobertura sale bien

No un comparador. **Un precio orientativo con su procedencia**, en el producto
que la persona ya ha escaneado:

> Leche entera 1 L · **0,89 €**
> Visto en Mercadona (Valencia) hace 6 días · Open Prices (ODbL)
> Tú la pagaste a 0,94 €

Con el `€/kg` y el `€/L` normalizados, que es lo único que hace honesta
cualquier comparación entre formatos y entre marca blanca —donde el EAN no
sirve para emparejar nada, porque cada cadena pone el suyo—.

Y aportando de vuelta: quien ya está tecleando el precio puede regalarlo a la
base común con un botón, no con un formulario.

## Resumen de la revisión

| | |
|---|---|
| Raspar la API de Mercadona | **No.** Menos que en agosto |
| Comparador de cesta multicadena | **No.** Ocupado, y es la parte legalmente más expuesta |
| Consumir el volcado de `datania` | **No.** Una cadena, sin histórico, con la licencia sin decir |
| Precio orientativo vía Open Prices | **A estudiar**, y decide un solo número: la cobertura en España |
| Precio propio del usuario (hoy) | **Se queda.** Es lo que de verdad usa quien compra |

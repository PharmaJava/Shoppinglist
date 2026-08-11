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

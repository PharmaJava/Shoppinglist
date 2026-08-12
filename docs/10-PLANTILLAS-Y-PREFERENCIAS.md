# Plantillas propias, idioma y moneda

Cierra la Fase 2: **F2-4** (plantillas propias) y **F2-8** (perfil y RGPD).

---

## 1. Dos cosas que se llaman «plantilla»

Conviene no mezclarlas, porque se parecen y no tienen nada que ver:

| | Plantillas de contenido | Plantillas propias |
|---|---|---|
| Dónde viven | `src/content` (TypeScript) | Tablas `list_templates` y `template_items` |
| Quién las ve | Todo el mundo | Sólo quien las creó |
| URL | `/plantillas/[slug]`, en el sitemap | `/mis-plantillas`, `noindex` |
| Para qué | SEO: es el canal de adquisición | Repetir la compra sin volver a escribirla |

Las tablas existían desde el esquema base con sus políticas RLS, pero no las usaba nadie. Esta
migración las pone en servicio.

**El `slug` deja de ser obligatorio.** Era único por idioma, lo cual vale para una plantilla
pública —que tiene URL— pero rompía las privadas: dos personas guardando su «Compra semanal»
chocarían, y la segunda vería un error de clave duplicada sin entender por qué. Ahora es opcional,
y único sólo donde significa algo (índice parcial `where is_public`).

## 2. Guardar y usar

**Guardar** está en la hoja de compartir, junto a «copiar como texto» e «imprimir». No en la
cabecera: a 390 px ya va justa con el título, el modo supermercado y «Compartir», y guardar una
plantilla es lo mismo que copiar o imprimir —llevarse la lista a otro sitio—, no una acción del
día a día.

Lo hace la función `save_list_as_template(lista, título)`, que es **SECURITY INVOKER**: quien la
llama tiene que poder leer la lista por sus propias políticas. Además comprueba `is_list_member`
explícitamente, lo cual sobra a efectos de seguridad pero convierte «te sale una plantilla vacía»
en un error que dice qué ha pasado. Hay un tope de 100 plantillas por persona y 300 productos por
plantilla: sin él, un bucle mal escrito en el cliente llena la tabla y el problema aparece semanas
después.

**La plantilla es una foto, no una referencia.** Se copian los productos tal como están; cambiar
la lista después no cambia la plantilla, ni al revés. No se guardan precios ni lo que estuviera
marcado: son de esa compra concreta, no de la plantilla.

**Usar** una plantilla pasa por `createListFromTemplate`, el mismo camino que las de contenido.
Así una lista nacida de una plantilla propia y otra nacida del catálogo se comportan igual
—categorías, historial, orden— sin dos implementaciones que se separen con el tiempo.

## 3. Idioma y moneda

Están en `/cuenta`, y se ofrecen **también a los invitados**: alguien que compra en pesos lo hace
tenga cuenta o no, y un invitado tiene perfil desde su primera lista. Sin sesión no hay perfil que
guardar, así que ahí no aparecen.

**El idioma** cambia la interfaz y además se guarda, porque las notificaciones push las compone el
servidor y no tiene otra forma de saber en qué idioma escribir (ver `07-PUSH.md`).

**La moneda** ya existía en `profiles.currency` y no la leía nadie: las listas nacían siempre en
euros. Una preferencia que no cambia nada es peor que no tenerla. Ahora la aplica un disparador en
la base de datos, no el cliente, porque una lista se crea desde cuatro sitios distintos (landing,
plantilla de contenido, plantilla propia, duplicar) y bastaría olvidarse en uno para que la
preferencia pareciera rota.

Se aplica **a las listas nuevas**. Las que ya existen se quedan con la suya, y la interfaz lo dice:
cambiar la moneda de una lista con precios ya escritos convertiría 12 € en 12 $ sin que nadie haya
tocado ningún precio. Que la app lo avise es la diferencia entre una decisión y un fallo.

La lista de monedas es corta y explícita (diez), no las ~180 de ISO 4217: un desplegable de ciento
ochenta entradas en un móvil es peor que no poder elegir. Añadir una es una línea en
`src/features/account/preferences.ts`.

## 4. Exportar los datos

Ya existía desde la PR de cuentas y **no se ha reescrito**: la arma el cliente leyendo sus propias
tablas (`src/features/auth/export-data.ts`). Se pensó en hacerla en SQL de una sola pasada, y se
descartó — habría dos implementaciones del mismo formato y se separarían al primer cambio. Además
el cliente es quien sabe qué email tiene la sesión: `auth.users.email` no lo puede leer
`authenticated`.

Lo que sí cambia: **ahora incluye las plantillas y la moneda**, y el número de formato sube a `2`.
Una exportación que no incluyera las plantillas dejaría de ser «todo lo que guardamos de ti» en
cuanto alguien guardara la primera.

## 5. Al desplegar

Aplicar `supabase/migrations/0008_templates_and_gdpr.sql` en el editor SQL de Supabase.
`pnpm db:check` imprime una consulta que dice qué migraciones faltan.

No hay variables de entorno nuevas.

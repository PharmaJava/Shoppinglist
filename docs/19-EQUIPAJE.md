# Listas de equipaje

La mochila de los niños, la maleta de un viaje. Mismo funcionamiento que la
lista de la compra —se comparte, va sin conexión, se marca, se dicta— con dos
diferencias que justifican un tipo propio en vez de un truco sobre la compra.

## 1. Qué cambia respecto a la compra

| | Compra | Equipaje |
|---|---|---|
| Se agrupa por | Pasillos fijos del súper (`categories`) | **Secciones que pone quien la usa** |
| Lo marcado | Se va abajo, a «Ya en el carro» | **Se queda en su sección**, tachado |
| Al acabar | «Finalizar»: borrar, archivar, vaciar… | **«Empezar de nuevo»**: desmarca todo |
| Invitado | Caduca a las 24 h (0015) | **No caduca** |
| Precio, presupuesto | Sí | No |
| Escanear códigos | Sí (Fase 3) | No |
| Guardar como plantilla | Sí | No (ver §4) |
| Pantalla encendida | Sí | No |

Lo marcado se queda en su sección porque al hacer una maleta lo que importa es
ver que «Mochila niños» está completa, no una lista aparte de lo ya hecho.

## 2. Cómo se usa

1. «Mis listas» → **🧳 Equipaje** → nombre → Crear.
2. Abajo, **+ Sección**: el mismo campo sirve para el nombre («Mochila niños»).
   La sección nueva queda elegida.
3. Se escribe lo que va dentro: `botella de agua, cuaderno, rotus` entra como
   tres cosas, igual que en la compra. Va a la sección elegida en la fila de
   arriba del campo; el **+** de cada cabecera también la elige.
4. Al terminar, **Empezar de nuevo** desmarca todo, con confirmación.

El nombre de una sección se cambia escribiendo en su cabecera. Borrarla pide
confirmación y **se lleva lo que tiene dentro**: dejar el cargador y la
cartera sueltos sin que nadie lo pidiera sería peor.

**Duplicar** («Mis listas») copia secciones y contenido con ids nuevos: la
maleta de Dani sirve de punto de partida para la de Ana.

## 3. Datos (migración 0018)

- `lists.kind`: `'shopping' | 'packing'`. **No se puede cambiar** una vez
  creada: lo garantiza `lists_protect_columns`, como el dueño y la caducidad
  (0017). Si se pudiera, una compra de invitado se haría «de equipaje» con una
  línea en la consola y se saltaría las 24 horas.
- `list_sections`: id del cliente (se crea sin red), nombre de 1 a 80
  caracteres, `sort_key`, borrado lógico. RLS igual que los productos: la ven
  los miembros, la tocan quienes pueden editar.
- `list_items.section_id`, con clave ajena **compuesta** a
  `(list_sections.id, list_id)`: un producto no puede apuntar a la sección de
  otra lista. `on delete set null (section_id)` deja el producto en su lista,
  sin sección, si la sección desaparece de verdad.
- `lists_set_auto_finish` sólo pone caducidad a las listas de **compra** de
  invitado.

Comprobado contra PostgreSQL 16 con las dieciocho migraciones: caducidad según
el tipo, tipo inventado rechazado, tipo inmutable, sección de otra lista
rechazada, nombre vacío rechazado, extraño sin acceso, editor puede, lector no,
borrado en cascada.

La exportación de datos («Descargar mis datos», RGPD) lleva el tipo de cada
lista y la sección de cada cosa; su `format` pasa de 2 a 3.

**Contrapartida aceptada.** Un invitado puede tener listas de equipaje para
siempre. La regla de las 24 horas existía para que la base no crezca con
compras abandonadas; una maleta está hecha para repetirse, y borrarla al día
siguiente sería quitar justo lo que se vino a buscar.

## 4. Lo que no hace, todavía

- **Plantillas.** Las plantillas no guardan secciones, así que en las listas
  de equipaje no se ofrece guardar como plantilla. Para repetir una maleta
  está la propia lista (se reinicia) o duplicarla.
- **Aprender por sección.** Las sugerencias al escribir salen del historial
  de siempre, que mezcla compra y equipaje. Lo siguiente sería, al crear una
  sección con un nombre ya usado («Mochila niños»), ofrecer lo que llevaba la
  última vez.
- **Reordenar secciones** a mano: van en el orden en que se crean.

## 5. Un arreglo que salió de aquí

La cola de cambios sin conexión (`src/lib/sync/outbox.ts`) ordenaba por el
milisegundo en que se encolaba cada cambio. Dos cambios en el mismo
milisegundo se desempataban por su clave, y `list_items:…` va antes que
`list_sections:…`: un producto podía salir antes que la sección en la que va,
el servidor lo rechazaba y se perdía. Ahora la marca de orden es
estrictamente creciente dentro de la pestaña. Lo destapó una prueba de
duplicar.

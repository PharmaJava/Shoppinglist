# La despensa (F3-5)

Qué hay en casa y cuándo caduca. Es de pago y va **apagada** hasta que se encienda la Fase 3
(`docs/11-FASE3.md`).

---

## 1. Dónde vive y cómo se llega

`/despensa` · `/pantry`. Con `NEXT_PUBLIC_FEATURE_PREMIUM` sin poner, la ruta responde **404**, no
una página vacía: una página que carga y no enseña nada invita a preguntar qué pasa, y un 404 dice
que ahí no hay nada — que es la verdad mientras la fase no esté terminada. No se enlaza desde
ninguna parte y no entra en el sitemap.

Encendida, quien no sea premium ve la pared de pago; quien lo sea, la despensa.

## 2. Leer sí, escribir no

La decisión que más condiciona las políticas: **leer la despensa no exige ser premium; escribirla
sí**. Si alguien deja de pagar sigue viendo lo que guardó, y puede borrarlo — lo que no puede es
añadir más. Bloquearle la lectura sería secuestrarle sus propios datos por dejar de pagar, y eso no
se hace. Dejarle sin borrar sería peor todavía: datos suyos que no puede quitar.

| | Gratuito | Premium |
|---|---|---|
| Ver lo suyo | ✅ | ✅ |
| Añadir y editar | ❌ | ✅ |
| Borrar | ✅ | ✅ |

Comprobado contra PostgreSQL 16 en los dos sentidos: sin premium no entra una fila, y al pasar a
gratuito lo guardado sigue ahí.

## 3. Un producto, una línea

`(user_id, normalized)` es **único**. Toda la lógica de «si ya está, suma la cantidad» se apoya en
que no puede haber dos filas del mismo producto; sin esa restricción bastaba un `insert` desde el
cliente para dejar la despensa con dos «leche», y a partir de ahí el `update` de sumar cantidades
las tocaba las dos.

## 4. Meter la compra de una vez

Al **finalizar una compra** aparece «Guardar lo comprado en la despensa». Es el único momento en
que se sabe exactamente qué ha entrado en casa; pedirlo después en otra pantalla es pedir que nadie
lo use.

Lo resuelve `stock_up_from_list(lista)` en la base de datos, no el cliente: son N filas en un viaje,
y ahí se puede sumar lo que ya estaba sin traerse la despensa entera al navegador para compararla.

Dos detalles que costaron una prueba fallida:

- **Se agrupa sólo por el nombre normalizado.** La primera versión agrupaba por nombre *y* por
  normalizado, lo cual anula el normalizado: «Leche» y «  leche » eran grupos distintos y entraban
  como dos líneas. El test lo cazó a la primera.
- **La unidad y la categoría sólo se rellenan si faltaban.** Lo que se haya corregido a mano en la
  despensa manda sobre lo que traiga la compra.

## 5. Caducidades

Se guardan como `date`, sin hora. Un `timestamptz` convertiría «caduca el 3» en «caducó ayer» para
quien viaje de zona horaria.

Los días se cuentan **por día natural**, no restando milisegundos: en el cambio de hora un día dura
23 o 25 horas y una división entre 86 400 000 convierte «caduca mañana» en «caduca hoy». Dos veces
al año y pareciendo un fallo aleatorio.

Se avisa de lo que caduca en **7 días o menos**, que es lo que dura una compra: es lo que hay que
mirar antes de volver al súper.

## 6. Lo que **no** hace todavía

**No manda avisos push cuando algo va a caducar.** Haría falta una tarea programada que repase las
despensas cada día. Esa tarea **ya existe** desde las listas automáticas (F3-3): corre cada
madrugada, tiene la clave de servicio y sabe firmar VAPID — ver `docs/13-RECURRENTES.md` §4. Lo que
queda es una función que devuelva a quién avisar y de qué, y colgarla de la misma pasada. Mientras
tanto el aviso está en la pantalla, no en el bolsillo.

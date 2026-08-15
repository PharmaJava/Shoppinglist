# El plazo de las listas hechas sin cuenta

Una lista de la compra tiene un final natural: se compra y se acaba. Quien tiene cuenta la archiva
cuando quiere, o la deja abierta si le sirve de lista fija. Un invitado sin cuenta, en cambio, la
deja abierta para siempre: cierra la pestaña, no vuelve, y esa lista se queda ahí como si la compra
siguiera en marcha.

Son **dos plazos**, y hacen dos cosas distintas:

| Cuándo | Qué pasa |
|---|---|
| **24 h** desde que se creó | Se da por terminada: se archiva. No se borra nada |
| **7 días** sin que nadie la toque | Se borra, con sus productos |

---

## 1. Por qué dos plazos y no uno

**El primero es de producto.** Una compra no sigue abierta tres semanas después; darla por hecha es
decir la verdad. Archivar no pierde nada: la lista sigue entera en la sección de archivadas de
`/mis-listas` y se vuelve a abrir de un toque.

**El segundo es de coste.** Archivar no libera un byte. La lista de un invitado que no volvió
seguiría ahí para siempre, y esta base de datos se paga. Una semana sin que nadie la abra ni le
añada nada es señal suficiente de que esa compra ya pasó.

Los dos plazos se cuentan distinto y a propósito: el primero desde que se creó —una compra se hace
el mismo día— y el segundo desde la última actividad, **contando la de los productos**. Sin eso se
borraría una lista que se estuvo usando ayer, porque `lists.updated_at` no se mueve al marcar un
tomate.

## 2. Dos excepciones que no son un capricho

**Si el invitado se registra, sus listas dejan de caducar.** Es exactamente lo que se le ofrece a
cambio de crear la cuenta, así que pasa solo y en el momento (disparador sobre `auth.users`), sin
esperar a ninguna pasada.

**Si alguien con cuenta entra en la lista compartida, tampoco caduca.** La lista de la casa donde
uno de los dos está registrado ya no es «la lista de un invitado», y cerrarla por debajo sería
quitársela a quien sí tiene cuenta. Se limpia al entrar el miembro (disparador sobre
`list_members`).

## 3. Quién pone y quién quita la fecha

La columna es `lists.auto_finish_at`, y **la escribe sólo la base de datos**:

| | |
|---|---|
| Al crear la lista | Un disparador la pone a `now() + 24 h` **si el propietario es un invitado** |
| Al registrarse el invitado | Se pone a nula |
| Al entrar un miembro con cuenta | Se pone a nula |
| Al volver a abrir la lista | `reopen_list()` da otras 24 horas |

Desde el navegador **no se puede tocar**: la política de actualización exige que el valor no cambie,
igual que se hizo con `profiles.plan` en la migración 0010. Sin eso, cualquiera se saltaba la regla
entera con una línea en la consola. Por eso reabrir va por una función y no por un `update`.

Quién es un invitado lo dice `auth.users.is_anonymous`, que sólo se puede leer desde una función
`SECURITY DEFINER` —ni la clave de servicio puede leer `auth.users`, la misma lección de la
migración 0009—.

## 4. Cuándo se cierra y cuándo se borra de verdad

Por dos caminos, y hacen falta los dos:

**Al abrir la lista.** Si ya ha pasado la hora, la propia pantalla la archiva ahí mismo. Quien está
mirando la lista tiene que ver la verdad, no una lista que dice estar abierta y que el servidor
cerrará esta madrugada.

**En la pasada diaria** (`/api/cron/recurring`, la misma que crea las listas automáticas). Esa se
encarga de las que nadie abre, que son la mayoría — precisamente el caso que motiva todo esto—, y
es también la que borra las que ya llevan la semana. Las dos limpiezas van aparte de las listas
recurrentes: que falle una no puede dejar la otra sin hacer.

Borrar arrastra productos, miembros e invitaciones por las claves ajenas del esquema base, así que
no quedan huérfanos.

## 5. Se avisa antes, siempre

Sin aviso, esto sería una pérdida por sorpresa: entras al día siguiente y tu lista está cerrada sin
que nadie te dijera nada. Hay tres sitios donde se dice:

- **En la lista, en las últimas 6 horas**: «Esta lista se dará por terminada en 3 horas», con un
  enlace a crear la cuenta, que es lo que quita la caducidad.
- **En la lista, ya terminada**: se explica por qué, se avisa de que se borrará en una semana si
  nadie la toca, y hay un botón de volver a abrirla.
- **En `/mis-listas`**: la tarjeta lleva la cuenta atrás, que es donde se ve de un vistazo cuál se
  cierra hoy.
- Y en la portada, la pregunta «¿de verdad no hace falta registrarse?» lo cuenta antes de empezar.

## 6. Comprobado en local

Contra un PostgreSQL 16 con todas las migraciones:

- Una lista de invitado nace con fecha a 24 horas; la de quien tiene cuenta nace sin fecha.
- El invitado **no puede** quitarse la fecha ni estirarla diez años desde el cliente, y sí puede
  seguir renombrando la lista.
- Entra un miembro con cuenta → la fecha desaparece.
- Una lista vencida se archiva en la pasada; a la segunda pasada ya no hay nada que hacer.
- La lista con miembro registrado **no** se archiva aunque el invitado siga siendo invitado.
- Reabrir devuelve otras 24 horas y desarchiva; reabrir la lista de otro, no.
- Al registrarse el invitado, sus listas dejan de caducar.
- Una sesión normal no puede llamar a ninguna de las dos pasadas.
- El borrado se lleva la lista **y sus productos**, y deja en paz: la que tiene productos tocados
  ayer aunque la lista lleve un mes quieta, la compartida con alguien registrado, la de esta
  semana y la de quien tiene cuenta.
- El relleno de la migración pone fecha a las listas de invitado que ya existían, y sólo a ésas.

## 7. Las que ya existían

La migración les pone la misma fecha que a una recién creada, contando desde que se aplica. Sin eso
la regla sólo valdría para las nuevas y las de antes se quedarían ocupando sitio para siempre, que
es justo lo que se quiere evitar — y con el día de margen nadie pierde nada sin haber visto el
aviso en pantalla.

## 8. Lo que falta

- **Avisar por push** unas horas antes a quien tenga los avisos puestos. Hoy el aviso sólo se ve si
  se abre la aplicación.
- Poder elegir el plazo desde la cuenta (24 h, 3 días, nunca) para quien se registre. Hoy quien
  tiene cuenta no caduca y punto.

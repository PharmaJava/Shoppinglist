# Las listas de invitado se dan por terminadas a las 24 horas

Una lista de la compra tiene un final natural: se compra y se acaba. Quien tiene cuenta la archiva
cuando quiere, o la deja abierta si le sirve de lista fija. Un invitado sin cuenta, en cambio, la
deja abierta para siempre: cierra la pestaña, no vuelve, y esa lista se queda ahí como si la compra
siguiera en marcha.

**A las 24 horas de crearla se da por hecha.** Es tiempo de sobra para haber ido al súper.

---

## 1. «Terminada» es archivada, no borrada

Esto es lo primero que conviene tener claro: **no se borra nada**. La lista sigue entera, con sus
productos y su historial, en la sección de archivadas de `/mis-listas`, y se vuelve a abrir de un
toque. Lo que se pierde es la ficción de que la compra sigue abierta.

La alternativa —borrarlas— se descartó: alguien que vuelve a los tres días a mirar qué compró la
semana pasada tiene derecho a encontrarlo, tenga cuenta o no.

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

## 4. Cuándo se cierra de verdad

Por dos caminos, y hacen falta los dos:

**Al abrir la lista.** Si ya ha pasado la hora, la propia pantalla la archiva ahí mismo. Quien está
mirando la lista tiene que ver la verdad, no una lista que dice estar abierta y que el servidor
cerrará esta madrugada.

**En la pasada diaria** (`/api/cron/recurring`, la misma que crea las listas automáticas). Esa se
encarga de las que nadie abre, que son la mayoría — precisamente el caso que motiva todo esto.

## 5. Se avisa antes, siempre

Sin aviso, esto sería una pérdida por sorpresa: entras al día siguiente y tu lista está cerrada sin
que nadie te dijera nada. Hay tres sitios donde se dice:

- **En la lista, en las últimas 6 horas**: «Esta lista se dará por terminada en 3 horas», con un
  enlace a crear la cuenta, que es lo que quita la caducidad.
- **En la lista, ya terminada**: se explica por qué y hay un botón de volver a abrirla.
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
- Una sesión normal no puede llamar a la pasada.

## 7. Lo que falta

- **Avisar por push** unas horas antes a quien tenga los avisos puestos. Hoy el aviso sólo se ve si
  se abre la aplicación.
- Poder elegir el plazo desde la cuenta (24 h, 3 días, nunca) para quien se registre. Hoy quien
  tiene cuenta no caduca y punto.

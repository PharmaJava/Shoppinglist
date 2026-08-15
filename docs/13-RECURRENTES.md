# Listas automáticas (F3-3)

La compra de siempre, hecha sola el día que toca. Va detrás del interruptor de la Fase 3
(`NEXT_PUBLIC_FEATURE_PREMIUM`), o sea que en producción **hoy no existe**: la ruta da 404.

---

## 1. Qué es una lista automática

Una plantilla propia + una periodicidad. Cada madrugada se miran las que vencen y se crea la lista,
con los productos de la plantilla y en su orden.

Tres decisiones que explican casi todo lo demás:

**Cuelga de una plantilla, no de una lista.** Una lista se tacha, se vacía y se archiva; una
plantilla es una foto estable de qué se compra. Repetir una lista viva daría copias de lo que quedó
a medias — con la mitad tachado y el pan que se olvidó.

**Un día perdido no se recupera.** Si la tarea no corre en tres días, al volver se crea **una**
lista, no tres. Tres listas iguales no son un servicio, son una limpieza pendiente. La fecha
siguiente se calcula desde hoy, no desde la que se perdió.

**Leer siempre, escribir sólo premium.** Igual que la despensa: quien deja de pagar sigue viendo lo
que tiene programado, puede pausarlo y puede borrarlo; lo que no puede es programar más. Dejar
listas creándose sin poder pararlas sería peor que no tener la función.

## 2. Periodicidades

| Cadencia | Campo que usa | Ejemplo |
|---|---|---|
| `weekly` | `weekday` (ISO: 1 lunes … 7 domingo) | Cada semana, los viernes |
| `biweekly` | `weekday` | Cada dos semanas, los viernes |
| `monthly` | `day_of_month` (1–28) | Cada mes, el día 15 |

Una restricción de la tabla (`recurring_lists_cadence_fields`) impide guardar una mensual con día de
la semana, o una semanal sin él: si cupiera, habría que interpretar qué quiso decir quien la creó.

**El día del mes se topa en 28 a propósito.** El 31 no existe en febrero, y cualquier regla para
resolverlo («el último día», «el 1 del siguiente») convierte «te la creo el día 31» en una promesa
que se incumple cuatro veces al año.

**La primera vez siempre cae en el futuro.** Quien programa la compra de los viernes un viernes por
la tarde quiere la del viernes que viene, no una lista que le aparece en el mismo minuto. Para eso
está el botón de crearla ahora, que **no** mueve el calendario.

## 3. Quién calcula las fechas

El servidor, siempre. `next_run_on` la pone un disparador (`recurring_lists_schedule`) al crear la
programación y cada vez que cambia la periodicidad; el cliente no la manda nunca. Si la mandara,
bastaría escribir una fecha de ayer para que la tarea diaria fuera creando listas en cada pasada.

En el navegador sólo hay formato (`src/features/recurring/schedule.ts`): nombres de días, fechas
largas y «dentro de N días». Dos calendarios, uno en cada lado, se separarían al primer cambio de
horario.

## 4. La tarea programada

```
Cron de Vercel (vercel.json, 05:00 UTC)
  → GET /api/cron/recurring  con Authorization: Bearer $CRON_SECRET
    → run_due_recurring_lists()  (clave de servicio)
      → por cada vencida: run_recurring_list() y adelantar la fecha
    → aviso push al dueño de cada lista creada
```

**Por qué un cron de Vercel y no `pg_cron`.** El trabajo de base de datos lo podría hacer `pg_cron`
igual de bien, pero el aviso push no: hace falta firmar VAPID, y eso vive en el servidor de la
aplicación. Con esto hay un solo sitio donde mirar cuando algo no salga.

**Por qué toda la creación va en SQL y no aquí.** Cada lista se crea en una transacción: o entra con
sus productos o no entra. Hacerlo desde el route handler serían N viajes por lista, y una lista sin
productos —porque la red se cortó a mitad— es justo lo que no puede pasar en algo que corre sin
nadie mirando.

**Una programación rota no puede dejar sin lista a las demás.** Si una falla (plantilla vacía, dueño
que ya no paga), se salta, se le adelanta la fecha igual y se sigue con el resto.

**Las claves de orden.** Los productos se insertan desde SQL, así que sus `sort_key` los genera
`sort_key_at`, que imita el formato de `fractional-indexing` (una cabecera y tres dígitos en base
62: `c001`, `c002`…). No vale cualquier texto: la librería valida la clave anterior antes de generar
la siguiente, y una inventada haría reventar el primer producto que alguien añadiera a mano. Hay una
prueba que lo fija (`src/features/recurring/schedule.test.ts`).

### Configuración

| Variable | Dónde | Para qué |
|---|---|---|
| `CRON_SECRET` | Vercel (Settings → Environment Variables) | Vercel la manda sola en la cabecera; sin ella la ruta responde 404 |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel | Crear listas a nombre de otras personas |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Vercel | El aviso. Sin ellas la lista se crea igual, sin avisar |

El plan gratuito de Vercel permite un cron diario, que es exactamente lo que hace falta. La hora
—05:00 UTC— deja la lista hecha antes de que nadie se levante (07:00 en península en verano).

## 5. Lo que protege qué

| | Lo pone | Se comprueba en |
|---|---|---|
| Que la ruta no exista | `NEXT_PUBLIC_FEATURE_PREMIUM` | `notFound()` en la página |
| Que sólo un premium programe | RLS `recurring_insert_own` + `is_premium()` | Base de datos |
| Que la plantilla sea tuya | RLS, en el mismo `WITH CHECK` | Base de datos |
| Que nadie dispare la de otro | `run_recurring_list`, comprobación explícita | Base de datos |
| Que nadie corra la pasada diaria | `run_due_recurring_lists` exige rol `service_role` | Base de datos |
| Que nadie la dispare por HTTP | `CRON_SECRET` | Route handler |

Los `revoke` de la migración nombran a `anon` y `authenticated` uno a uno, y no basta con
`from public`: Supabase concede EXECUTE a esos roles sobre todo lo que se cree en `public` mediante
`ALTER DEFAULT PRIVILEGES`, y esas concesiones no se van con un `revoke ... from public`. De paso se
cierra lo mismo en `push_targets_for_list` (migración 0006), que se había revocado de `public` y de
`authenticated` pero no de `anon`.

## 6. Comprobado en local

Contra un PostgreSQL 16 con las doce migraciones aplicadas y el stub de Supabase (roles `anon`,
`authenticated`, `service_role` con las concesiones por defecto de Supabase):

- Las fechas: para los 365 días del año y las 42 combinaciones de periodicidad, la siguiente fecha
  nunca cae en el pasado ni a más de 31 días vista. El mismo día de la semana da +7, no hoy.
- Un usuario gratuito no puede programar. Uno premium tampoco puede hacerlo con una plantilla
  pública ni con la de otra persona, ni a nombre de otro.
- `next_run_on` mandada desde el cliente con fecha de ayer: el disparador la sustituye.
- La lista creada sale con la moneda del perfil de su dueño, con el propietario ya como miembro y
  con los productos en el orden de la plantilla.
- Crear una a mano no mueve el calendario.
- Vencida hace 10 días: se crea **una** lista y la siguiente fecha queda en el futuro, en su día de
  la semana. Segunda pasada el mismo día: cero listas.
- Una plantilla vacía y una programación de alguien que ya no paga se saltan sin impedir las demás.
- Una sesión normal no puede llamar ni a `run_due_recurring_lists` ni a `push_targets_for_user`.

## 7. Lo que falta

- **Avisos de caducidad de la despensa** (docs/12-DESPENSA.md §6): ya hay tarea diaria donde
  colgarlos, que era lo que faltaba.
- Poder editar la periodicidad de una programación sin borrarla y volver a crearla.
- Saltarse una semana concreta («este viernes no, que me voy»).

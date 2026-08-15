# Fase 3 (premium): cómo se construye a oscuras

La Fase 3 se hace entera antes de enseñarla. Este documento explica dónde está el interruptor, qué
protege de verdad y qué falta.

---

## 1. El interruptor

```bash
NEXT_PUBLIC_FEATURE_PREMIUM=      # vacío = apagado. Es el estado de producción hoy
NEXT_PUBLIC_FEATURE_PREMIUM=1     # encendido
```

Apagado no se pinta **nada**: ni la función, ni la pared de pago, ni la mención de que existe. Ni
siquiera se consulta el plan, para no dejar en el registro de red una petición que no sirve.

Es `NEXT_PUBLIC_` a propósito, aunque eso signifique que viaja al navegador. Lo que se oculta no es
un secreto —son pantallas de producto sin terminar— y el interruptor tiene que valer igual en el
servidor (para no renderizar la ruta) y en el cliente (para no pintar el enlace). Uno que sólo
existiera en el servidor habría que ir pasándolo por props hasta el último botón.

## 2. Lo que protege el interruptor, y lo que no

**El interruptor decide qué se enseña. La base de datos decide qué se puede hacer.** Son cosas
distintas y conviene no confundirlas: quien fuerce el flag en su navegador verá pantallas, y no
conseguirá ni un dato.

Lo que lo sostiene, en la migración `0010_premium_gating.sql`:

- **`profiles.plan` deja de ser escribible desde el cliente.** La política de actualización del
  perfil permitía cambiar cualquier columna del propio perfil, `plan` incluida: cualquiera podía
  ponerse premium con una línea en la consola. Ahora el `WITH CHECK` exige que el plan que queda
  sea el que ya había. El nombre, el idioma y la moneda se siguen cambiando igual.
- **`is_premium()`** para las políticas RLS de las tablas de pago. `SECURITY DEFINER` porque si
  consultara `profiles` desde una política volvería a pasar por RLS y entraría en recursión — el
  mismo patrón que `is_list_member` en el esquema base.
- **`require_premium()`** para las funciones. Lanza un error con mensaje propio en vez de dejar que
  RLS devuelva cero filas y parezca que la función está rota.

Quien sí escribe el plan es el webhook de Stripe, con la clave de servicio, que se salta RLS.

Comprobado contra un PostgreSQL 16 local: un usuario no puede subirse a premium **ni bajarse**, sí
puede cambiar su nombre y su moneda, `require_premium()` rechaza en gratuito y pasa en premium, y
la clave de servicio sí puede conceder el plan.

## 3. Cómo probarlo mientras no hay Stripe

Todavía no hay forma de pagar, así que el plan se pone a mano en el editor SQL de Supabase:

```sql
update public.profiles set plan = 'premium' where id = '<tu-user-id>';
```

Con `NEXT_PUBLIC_FEATURE_PREMIUM=1` en `.env.local`, esa cuenta ve las funciones y el resto ve la
pared.

## 4. Qué hay hecho y qué falta

| | Estado |
|---|---|
| **F3-2 · Feature gating** | Hecho. Interruptor, `is_premium()`, `require_premium()`, `<PremiumGate>` |
| **F3-1 · Stripe** | Falta. Necesita cuenta de Stripe y sus claves |
| **F3-3 · Listas recurrentes** | Falta |
| **F3-4 · Presupuesto y precios** | Ya estaba, y **se queda gratis**: es parte de la lista |
| **F3-5 · Despensa** | Falta |
| **F3-6 · Receta → lista** | Falta |
| **F3-7 · Códigos de barras** | Falta |
| **F3-8 · Exportación e impresión** | Ya estaba, y se queda gratis |

Dos de las ocho ya estaban hechas y **no** pasan a ser de pago. Meter detrás de una pared algo que
la gente ya usa gratis es la forma más rápida de que se vayan.

## 5. Antes de encender

- Que haya forma de pagar (F3-1), o la pared lleva a una página que no vende nada.
- Que `/precios` diga un precio. Hoy dice «Sin precio todavía», que es la verdad.
- Avisar antes de cobrar: lo promete la FAQ de la landing y la página de precios.

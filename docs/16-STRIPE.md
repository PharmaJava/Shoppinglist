# Cobrar con Stripe (F3-1)

La última pieza de la Fase 3. Está **entera en el repositorio y apagada en producción**: sin las
claves de Stripe, las tres rutas responden 404, el botón de pagar no se pinta y la página de
precios sigue diciendo «sin precio todavía», que es la verdad.

> **Esto no se ha probado contra Stripe de verdad.** Está escrito siguiendo su documentación y
> probado con dobles, pero hasta que exista la cuenta no ha pasado un pago real. La sección 6 es la
> lista de lo que hay que hacer, y en modo de prueba, antes de tocar dinero.

---

## 1. Quién da premium

**El webhook, y sólo el webhook.**

Ni el botón de pagar ni la vuelta de Checkout tocan el plan. Quien vuelve de pagar puede haber
cerrado la pestaña antes de que Stripe cobrara, y la URL de vuelta se la sabe cualquiera: dar
premium ahí sería regalarlo. Lo que hay es esto:

```
/api/stripe/checkout  →  abre Checkout          (no toca el plan)
Stripe cobra
/api/stripe/webhook   →  apply_subscription()   (aquí, y sólo aquí, cambia el plan)
/api/stripe/portal    →  cambiar tarjeta o darse de baja
```

Y el plan lo escribe una función de base de datos, no la ruta: `profiles.plan` no lo puede tocar
ninguna sesión (política `profiles_update_own`, migración 0010), así que `apply_subscription` es
`SECURITY DEFINER` y sólo la puede llamar la clave de servicio.

## 2. Las tres cosas que sostienen el webhook

**La firma.** Es una URL pública. Sin `stripe-signature` válida no se lee ni el cuerpo — si no,
cualquiera se regalaría el plan mandando un JSON. Y la firma se calcula sobre los **bytes tal
cual**, así que se lee con `request.text()` y no con `request.json()`: parsear antes de verificar
rompe la comprobación.

**La idempotencia.** Stripe reintenta los avisos que no reciben un 200 —un despliegue a medias, un
pico de latencia— y manda el mismo evento otra vez. Cada evento se apunta en `stripe_events` con su
identificador como clave primaria: el segundo choca y la función devuelve `false` sin tocar nada.
El webhook responde 200 igual, porque para Stripe un repetido bien ignorado es un éxito.

**Una transacción.** La suscripción y el plan se escriben juntos o no se escriben. Si se guardara la
suscripción y fallara el `update` del perfil, alguien estaría pagando sin tener premium.

### El endpoint tiene su propia versión de la API

Y no tiene por qué ser la del SDK. La versión de un endpoint se fija el día que se crea, y los avisos
llegan **serializados con ésa**. El de producción está en `2026-03-25.dahlia` y el SDK usa
`2026-07-29.dahlia`.

Donde se nota es en `current_period_end`, que en algún momento se movió de la suscripción a sus
líneas. `finDePeriodo` mira primero la línea y luego la raíz, así que da igual con qué versión
llegue. Sin ese respaldo se guardaría `null`: nadie se queda sin premium por eso —el plan lo decide
el estado— pero la cuenta no podría decir hasta cuándo está pagada, y eso es de las cosas que quien
paga mira.

## 3. De quién es este aviso

Un evento de Stripe no siempre dice quién es la persona. Se busca por tres caminos, en orden:

1. **`client_reference_id`**, que lo ponemos nosotros al abrir Checkout.
2. **Los metadatos de la suscripción**, que también ponemos nosotros.
3. **El cliente**, buscándolo en nuestra tabla (`user_for_stripe_customer`).

El tercero no sobra: una baja hecha a mano desde el panel de Stripe llega sin metadatos, y sin ese
camino esa persona se quedaría con premium para siempre.

## 4. Qué estado da premium

| Estado en Stripe | Plan |
|---|---|
| `active`, `trialing` | premium |
| `past_due` | **premium** |
| `canceled`, `unpaid`, `incomplete`… | free |

`past_due` es una decisión, no un descuido: significa que un cobro ha fallado y Stripe va a
reintentarlo durante días, avisando por correo. Cortar el acceso al primer reintento castiga a quien
se le ha caducado la tarjeta y aún no se ha enterado. Cuando se agotan los reintentos el estado pasa
a `unpaid` o `canceled`, y ahí sí.

## 5. El precio no está en el código

`/precios` se lo pregunta a Stripe (`prices.retrieve`), que es donde de verdad manda. Sin claves
devuelve `null` y la página enseña lo de siempre.

Esa página es **estática**, así que la consulta ocurre al construirla: cambiar el precio en Stripe
exige un redespliegue para que se vea en la web. Es lo correcto para una página de marketing —cero
llamadas por visita— pero conviene saberlo antes de preguntarse por qué no cambia.

## 5 bis. Si la cuenta de Stripe ya existe y se usa para otra web

Se puede, y no hace falta nada especial en el código. Lo que sí hay que tener claro es **qué es de
cada web y qué comparten**:

| | |
|---|---|
| Producto y precio (`price_...`) | **Propio.** Se crea uno nuevo para ListaSupermercado |
| Endpoint de webhook y su `whsec_...` | **Propio.** Uno por URL; no se reutiliza el de la otra web |
| Clave secreta (`sk_...`) | Compartida: es de la cuenta |
| Marca (logo, colores), nombre en los recibos, portal de cliente, cuenta bancaria, informes e IVA | **Compartidos.** Son ajustes de cuenta, no de producto |

**Un endpoint de webhook recibe todos los eventos de la cuenta**, no sólo los de su web. Es decir:
una suscripción de la otra web hará que Stripe llame *también* a `/api/stripe/webhook` de aquí. No
pasa nada — `leerCambio` busca al usuario por `client_reference_id`, por los metadatos y por
`user_for_stripe_customer`, y un cliente que no es nuestro no aparece por ninguno de los tres, así
que se responde 200 con `{"ignorado": …, "motivo": "sin_usuario"}` y no se toca ningún plan. Lo que
conviene comprobar es **el camino contrario**: que el webhook de la otra web también ignore
tranquilamente a un cliente que no conoce, porque va a empezar a recibir los eventos de ésta.

Si lo compartido molesta —que los recibos y el Checkout lleven la marca de la otra web es lo más
visible—, la salida no es una cuenta nueva con otro correo: Stripe permite **varias cuentas bajo el
mismo inicio de sesión**, con su marca, su banco y sus informes aparte. Es la opción limpia si las
dos webs son negocios distintos de cara al cliente.

## 6. Qué hay que hacer para encenderlo

1. **Crear la cuenta de Stripe** —o reutilizar una que ya se tenga, ver §5 bis— y, dentro, un
   **producto** («ListaSupermercado Premium») con un **precio recurrente mensual**. Anota el
   identificador del precio (`price_...`).
2. **Variables de entorno en Vercel** (y en `.env.local` para probar):
   - `STRIPE_SECRET_KEY` — la clave secreta. Empieza por `sk_test_` mientras se prueba.
   - `STRIPE_PRICE_ID` — el `price_...` de arriba.
   - `STRIPE_WEBHOOK_SECRET` — sale del paso siguiente.
3. **Registrar el webhook** en Stripe → Developers → Webhooks → *Add endpoint*:
   - URL: `https://listasupermercado.com/api/stripe/webhook`
   - Eventos: `checkout.session.completed`, `customer.subscription.created`,
     `customer.subscription.updated`, `customer.subscription.deleted`.
   - Copia el *signing secret* a `STRIPE_WEBHOOK_SECRET`.
4. **Aplicar la migración 0014** (`pnpm db:check` dice si falta).
5. **Probar en modo prueba, de principio a fin**, con la tarjeta `4242 4242 4242 4242`:
   pagar → comprobar que el plan pasa a premium; darse de baja desde el portal → comprobar que
   vuelve a gratuito. Stripe tiene un reenviador local (`stripe listen --forward-to
   localhost:3000/api/stripe/webhook`) que ahorra desplegar para cada intento.
6. **Sólo entonces**, encender `NEXT_PUBLIC_FEATURE_PREMIUM=1` y pasar las claves a `sk_live_`.

Y lo que promete la propia web antes de cobrar: **avisar**. Lo dice la FAQ de la portada y lo dice
la página de precios, así que hay que hacerlo.

## 7. Lo que protege qué

| | Lo pone | Se comprueba en |
|---|---|---|
| Que no se pueda pagar todavía | `NEXT_PUBLIC_FEATURE_PREMIUM` y la ausencia de claves | Las tres rutas |
| Que nadie se regale el plan | Firma de Stripe | Webhook |
| Que un aviso repetido no haga nada | `stripe_events` (clave primaria) | Base de datos |
| Que el plan no lo escriba el cliente | `profiles_update_own` (migración 0010) | Base de datos |
| Que nadie llame a `apply_subscription` | Guarda de rol + `revoke` | Base de datos |
| Que nadie vea los eventos de pago | RLS activada y **cero políticas** | Base de datos |

## 8. Comprobado en local

Contra un PostgreSQL 16 con las catorce migraciones: una sesión normal no puede llamar a
`apply_subscription`; el primer aviso aplica y el mismo repetido devuelve `false` sin tocar nada; un
`past_due` mantiene el premium y **no borra** el cliente ni la fecha de fin de periodo; un
`canceled` devuelve a gratuito; y una sesión no puede ni leer `stripe_events` ni resolver de quién
es un cliente de Stripe.

Y con dobles de Stripe: sin firma no se lee el cuerpo, con firma inválida no se aplica nada, un
evento que no nos toca se acusa con 200, un fallo de base de datos devuelve 500 para que Stripe
reintente, y Checkout reutiliza el cliente que ya existía en vez de crear uno nuevo.

## 9. Lo que falta

- **Un pago de verdad.** Ver el aviso de arriba: nada de esto ha visto Stripe todavía.
- **Facturas con los datos fiscales** para quien las necesite: el portal de Stripe las genera, pero
  hay que configurar los datos de la empresa y los impuestos.
- **Precio anual**, si algún día interesa. El código ya distingue el intervalo.

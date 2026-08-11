# Notificaciones push

Avisan de que alguien ha añadido algo a una lista compartida. Es la pieza que
cierra el caso de uso real: uno está en el supermercado y el otro se acuerda
del pan desde casa.

**Sin configurar no existen.** El interruptor no aparece y el endpoint de
envío responde 404. Se puede desplegar la aplicación sin tocar nada de esto.

## Qué hace falta

### 1. Generar el par de claves VAPID

```bash
pnpm exec web-push generate-vapid-keys
```

Devuelve una pública y una privada. Se ponen en Vercel:

| Variable | Dónde | Valor |
|---|---|---|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Cliente y servidor | La pública |
| `VAPID_PRIVATE_KEY` | Sólo servidor | La privada |
| `PUSH_WEBHOOK_SECRET` | Sólo servidor | Una cadena larga al azar, la que quieras |
| `SUPABASE_SERVICE_ROLE_KEY` | Sólo servidor | *Project Settings → API → service_role* |

> La clave de servicio se salta RLS. No debe aparecer nunca en el navegador:
> por eso no lleva el prefijo `NEXT_PUBLIC_`.

### 2. Aplicar la migración

`supabase/migrations/0006_push_subscriptions.sql`, que crea la tabla de
suscripciones y `push_targets_for_list`.

### 3. Crear el Database Webhook

En Supabase, *Database → Webhooks → Create a new hook*:

- **Table**: `list_items`
- **Events**: `Insert`
- **Type**: HTTP Request → `POST`
- **URL**: `https://listasupermercado.com/api/push/notify`
- **HTTP Headers**: `x-webhook-secret` con el valor de `PUSH_WEBHOOK_SECRET`

## Cómo funciona

```
alguien añade un producto
        │
        ▼
INSERT en list_items ──► Database Webhook ──► POST /api/push/notify
                                                     │
                                    push_targets_for_list(lista, autor)
                                                     │
                                          web-push a cada endpoint
                                                     │
                                            service worker → aviso
```

Cuatro decisiones que se notan al usarlo:

**A quien lo escribe no se le avisa.** El webhook manda `created_by` y la
función lo excluye. Nadie necesita que le notifiquen lo que acaba de teclear.

**Un aviso por lista, no uno por producto.** La notificación lleva
`tag: list-<id>`, así que añadir cinco cosas seguidas actualiza el mismo aviso
en vez de apilar cinco.

**Las suscripciones muertas se borran solas.** Si el servicio de push responde
404 o 410 —desinstaló la aplicación, limpió el navegador—, la fila se elimina
en ese mismo envío.

**El idioma se guarda con la suscripción.** El texto se compone en el
servidor, que no tiene otra forma de saber en qué idioma escribir.

## Lo que no cubre

- **iOS sólo con la aplicación instalada** en la pantalla de inicio. Es una
  restricción de Safari, no nuestra: en un Safari normal `PushManager` no
  existe y el interruptor no llega a aparecer.
- **Sólo altas de productos.** Marcar, borrar o renombrar no avisan: sería
  ruido, y quien está comprando ya lo ve en tiempo real.
- **Sin preferencias por lista.** El interruptor es del dispositivo, no de la
  lista. Cuando alguien tenga veinte listas compartidas hará falta afinarlo.

## Probarlo

El endpoint se puede llamar a mano, con la aplicación desplegada y al menos
una suscripción guardada:

```bash
curl -X POST https://listasupermercado.com/api/push/notify \
  -H "content-type: application/json" \
  -H "x-webhook-secret: $PUSH_WEBHOOK_SECRET" \
  -d '{"type":"INSERT","table":"list_items","record":{"list_id":"<uuid>","name":"Pan","created_by":null}}'
```

Responde `{"sent":N,"failed":M}`. Con `created_by: null` no se excluye a
nadie, así que sirve para avisarse a uno mismo.

# Plan maestro — ShoppingList

## 1. Visión y posicionamiento

**Producto**: una lista de la compra colaborativa en tiempo real que se comparte con un enlace,
sin obligar a nadie a registrarse.

**El problema real**: las apps de lista de la compra existentes fallan en tres puntos concretos.

1. Obligan a que *todos* los miembros de la familia se instalen una app y creen una cuenta. La
   abuela no lo va a hacer. Es el punto donde muere la adopción.
2. Dentro del supermercado hay mala cobertura. Las apps que dependen del servidor para cada
   toque se sienten rotas justo en el momento de uso.
3. La lista no está ordenada como está el supermercado, así que se dan tres vueltas al pasillo.

**Nuestra apuesta**, en ese mismo orden:

1. **Cero fricción**: crear lista y compartirla sin cuenta. El enlace abre la lista y ya se puede editar.
2. **Offline-first de verdad**: marcar productos funciona sin red y se sincroniza sola.
3. **Orden por pasillo**: los productos se agrupan por categoría/pasillo automáticamente.

**Frase de posicionamiento (ES)**: «La lista de la compra que compartes por WhatsApp y todos
podéis editar. Sin registro.»
**(EN)**: «The shopping list you share on WhatsApp and everyone can edit. No sign-up.»

### Métricas de éxito

| Métrica | Definición | Objetivo Fase 1 |
|---|---|---|
| Activación | % de visitantes que crean una lista con ≥3 productos | > 25 % |
| Viralidad (K) | Invitados que abren el enlace / creador de lista | > 1,2 |
| Retención D7 | Usuarios que vuelven a abrir una lista a los 7 días | > 20 % |
| Colaboración | % de listas con ≥2 participantes | > 35 % |
| LCP móvil (p75) | Core Web Vitals en landing | < 1,8 s |

Instrumentar estas cinco desde el primer despliegue. Sin activación y sin K no hay negocio, por
mucho SEO que hagamos.

---

## 2. Decisiones de producto que condicionan todo lo demás

Estas cuatro decisiones se toman ahora porque cambiarlas después es caro.

### 2.1 El modo invitado necesita backend desde el día 1

«Modo invitado» no significa «sin servidor». Compartir una lista entre el móvil de una persona y
el de otra exige persistencia en servidor, sí o sí. `localStorage` no se comparte.

Por tanto **Supabase entra en la Fase 1**, no en la Fase 2. Lo que llega en la Fase 2 es el
*login* (email, Google, Apple), no la base de datos.

### 2.2 Identidad de invitado: *anonymous sign-in* de Supabase

Alternativas consideradas:

| Opción | Veredicto |
|---|---|
| Token de dispositivo propio en cookie | Hay que reimplementar autorización a mano; RLS queda inutilizable. Descartada. |
| Listas públicas por ID no adivinable, sin identidad | No se puede saber quién marcó qué ni migrar a cuenta. Descartada. |
| **Anonymous sign-in de Supabase** | **Elegida.** |

El invitado recibe un JWT real con un `auth.uid()`. Consecuencias, todas buenas:

- **Las políticas RLS son las mismas** para invitado y registrado. Un solo modelo de seguridad.
- **La conversión a cuenta conserva el `user_id`**: `supabase.auth.updateUser({ email })` o
  `linkIdentity()` convierten el usuario anónimo en permanente **manteniendo el mismo UUID**. Sus
  listas le siguen sin ninguna migración de datos. Este es el motivo principal de la elección.
- Realtime y Presence funcionan con la identidad del invitado.

Coste a asumir, con su mitigación (no es gratis, conviene saberlo antes):

- Cada invitado crea una fila real en `auth.users` → **cron de limpieza** de usuarios anónimos sin
  listas y con más de 30 días (ver `01-DATA-MODEL.md`).
- Alta anónima = endpoint abusable → **CAPTCHA (Cloudflare Turnstile)** en el alta anónima, activable
  desde el panel de Supabase, más rate limiting en el borde.

### 2.3 Offline-first, no «offline degradado»

Dentro del supermercado la app debe funcionar **igual** sin red. Implica:

- IDs generados en el cliente (UUID v4) → las operaciones son idempotentes y no dependen del servidor.
- Cola de salida (*outbox*) persistida en IndexedDB, con reintentos y *backoff*.
- Resolución de conflictos **last-write-wins por fila** usando `updated_at`, y borrado lógico
  (`deleted_at`) para que un borrado no «reviva» al sincronizar.

Es suficiente. Un CRDT completo es sobreingeniería para este dominio: los conflictos reales
(dos personas marcan el mismo producto a la vez) convergen igual con LWW.

### 2.4 La app no es la superficie SEO

Las listas son privadas y llevan `noindex`. Lo que posiciona es un catálogo de **plantillas y
guías** que resuelven la búsqueda del usuario y convierten a lista real en un clic. Detalle
completo en `02-SEO.md`.

---

## 3. Stack tecnológico

### 3.1 Elección

| Capa | Elección | Por qué |
|---|---|---|
| Framework | **Next.js (App Router), última estable** | Único framework que resuelve bien las dos mitades del producto a la vez: SSG/ISR para el SEO y cliente interactivo para la app. Middleware para i18n, `generateMetadata` para hreflang, `ImageResponse` para OG dinámicos. |
| Lenguaje | **TypeScript** en `strict` | Los tipos de la BD se generan desde Supabase; el esquema queda verificado en compilación. |
| UI | **Tailwind CSS v4 + shadcn/ui (Radix)** | Radix aporta accesibilidad real (foco, ARIA, teclado) que no vamos a reimplementar. shadcn deja el código en nuestro repo: se puede modificar sin pelearse con la librería. |
| Estado servidor | **TanStack Query** + persistencia en IndexedDB | Caché, optimistic updates y rehidratación offline resueltos. |
| Estado local | **Zustand** | Sólo para UI y la cola *outbox*. Deliberadamente pequeño. |
| Backend | **Supabase**: Postgres + RLS + Realtime + Auth + Edge Functions | Requisito del proyecto y buena elección: Postgres real con RLS evita escribir una capa de autorización propia. |
| i18n | **next-intl** | Integración nativa con App Router y rutas estáticas por idioma. |
| Validación | **Zod** | Esquemas compartidos entre formularios, Server Actions y RPC. |
| Hosting | **Vercel** | Edge middleware, ISR e imágenes sin configurar nada. Región primaria en la UE. |
| Analítica | **PostHog (EU Cloud)** + Vercel Speed Insights | Embudos y RGPD sin transferencia internacional. |
| Errores | **Sentry** | Con *source maps* y *session replay* con enmascarado. |
| Calidad | **Biome** (lint + format), **Vitest**, **Playwright** | Biome sustituye ESLint + Prettier con una sola herramienta y es mucho más rápido en CI. |
| Pagos (F3) | **Stripe Checkout + Customer Portal** | No construimos pantallas de facturación. |

### 3.2 Alternativas descartadas, y por qué

- **Astro (marketing) + SPA (app)**: Astro gana en la landing, pero serían dos bases de código,
  dos *design systems* y dos despliegues para un equipo pequeño. El coste de coordinación supera
  a la ganancia de unos KB.
- **SPA pura con Vite**: renuncia al SEO, que es nuestro canal de adquisición principal. Descartada.
- **SvelteKit / Nuxt**: técnicamente válidos; el ecosistema de React (Radix, TanStack, shadcn,
  contratación) es el que reduce riesgo de ejecución.
- **Firebase**: el usuario ya ha elegido Supabase, y para este modelo relacional (listas,
  miembros, productos, plantillas) Postgres con RLS es claramente mejor que Firestore.
- **CRDT (Yjs / Automerge)**: potente, pero complica el modelo, el tamaño del bundle y la
  depuración a cambio de resolver conflictos que LWW ya resuelve aquí.

### 3.3 Estructura del repositorio

```
/
├── src/
│   ├── app/
│   │   ├── [locale]/               # Rutas indexables (landing, plantillas, guías, precios, legal)
│   │   │   ├── (marketing)/
│   │   │   └── (app)/              # Dashboard del usuario registrado — noindex
│   │   ├── l/[listId]/             # Lista compartida — URL corta, noindex
│   │   ├── i/[token]/              # Aceptar invitación — noindex
│   │   ├── api/
│   │   ├── sitemap.ts
│   │   └── robots.ts
│   ├── components/
│   │   ├── ui/                     # shadcn
│   │   ├── list/                   # Ítems, quick-add, modo supermercado
│   │   └── marketing/
│   ├── features/                   # Lógica por dominio (list, sync, catalog, auth, billing)
│   ├── lib/
│   │   ├── supabase/               # Clientes browser/server/middleware + tipos generados
│   │   ├── sync/                   # Outbox, motor de merge, detección de conectividad
│   │   └── seo/                    # Helpers de metadata, JSON-LD, hreflang
│   ├── i18n/                       # Configuración y mensajes (es.json, en.json)
│   └── content/                    # Plantillas y guías en MDX
├── supabase/
│   ├── migrations/                 # SQL versionado
│   └── functions/                  # Edge Functions
├── e2e/                            # Playwright
└── docs/
```

---

## 4. Arquitectura

### 4.1 Flujo de datos

```
┌──────────────┐   optimistic    ┌───────────────┐
│  UI (React)  │ ──────────────► │ TanStack Query│
└──────┬───────┘                 └───────┬───────┘
       │ mutación                        │
       ▼                                 ▼
┌──────────────┐   online     ┌──────────────────────┐
│ Outbox       │ ───────────► │ supabase-js (REST)   │
│ (IndexedDB)  │ ◄─── retry ──│                      │
└──────────────┘              └──────────┬───────────┘
                                         ▼
                              ┌──────────────────────┐
                              │ Postgres + RLS       │
                              └──────────┬───────────┘
                                         │ WAL
                                         ▼
                              ┌──────────────────────┐
                              │ Realtime (broadcast) │──► otros dispositivos
                              └──────────────────────┘
```

Toda mutación es: (1) escritura optimista en caché local, (2) encolado en el *outbox*,
(3) envío cuando hay red, (4) confirmación por Realtime al resto de dispositivos.

La UI **nunca espera al servidor** para marcar un producto. Ese es el requisito de sensación de
producto del que cuelga el resto del diseño.

### 4.2 Renderizado

| Ruta | Estrategia | Motivo |
|---|---|---|
| Landing, precios, legal | SSG | Contenido fijo; LCP mínimo. |
| Plantillas, guías | SSG + ISR (revalidación diaria) | Cientos de páginas indexables generadas en build. |
| `/l/[listId]` | CSR sobre *shell* estático | Datos privados; el HTML no debe contenerlos. |
| Dashboard | SSR con sesión | Personalizado, `noindex`. |
| OG images | `ImageResponse` en el borde | Miniatura por plantilla sin diseñar 300 imágenes. |

### 4.3 Tiempo real

- **Postgres Changes** sobre `list_items`, `lists` y `list_members`, filtrado por `list_id` y
  autorizado por RLS (canales privados: un miembro sólo recibe eventos de sus listas).
- **Presence** para mostrar quién está viendo la lista ahora («Ana está en el súper»). Es barato
  de implementar y tiene un efecto notable sobre la percepción de que la app «está viva».
- **Broadcast** para señales efímeras que no merecen fila en BD (indicador de escritura).

### 4.4 Seguridad del enlace compartido

El enlace es la credencial, así que se diseña con cuidado:

- Token de invitación de 128 bits (nanoid, 22 caracteres), **distinto del `list_id`**. Rotar el
  token revoca el acceso sin romper la lista.
- La tabla de invitaciones **no tiene política `SELECT`**: sólo se canjea por una función
  `SECURITY DEFINER`. Nadie puede enumerar tokens.
- Soporta caducidad, número máximo de usos, revocación y rol (`editor` / `viewer`).
- `Referrer-Policy: no-referrer` en las rutas de invitación para que el token no se filtre por
  cabecera a terceros.
- El propietario ve la lista de miembros y puede expulsar a cualquiera.

---

## 5. Internacionalización

- Idiomas de lanzamiento: **es** (por defecto) y **en**. Estructura preparada para pt, fr, it, de.
- **Prefijo de idioma siempre presente**: `/es/...` y `/en/...`. Evita el contenido duplicado que
  aparece cuando el idioma por defecto vive también en la raíz.
- `/` responde con redirección 307 según `Accept-Language` + cookie de preferencia. `x-default`
  apunta a `/en`.
- **Se traduce el producto, no sólo los textos**: moneda (EUR/USD/GBP), unidades (kg/lb, l/fl oz),
  formatos de fecha, primer día de la semana, y **catálogos de productos y categorías propios de
  cada mercado** (en España «embutido» es una categoría; en EE. UU. no).
- Las claves de traducción viven en `src/i18n/messages/{es,en}.json`, con tipado estricto: una
  clave que falte rompe la compilación, no llega a producción.
- Contenido de marketing **escrito nativo por idioma**, no traducido literalmente. Detalle en `02-SEO.md`.

---

## 6. Monetización

Freemium. Nada de anuncios: destruirían la experiencia justo en el momento de uso (dentro del súper).

**Gratis** — todo lo que hace que el producto sea viral, sin recortes:
lista ilimitada de productos, compartir sin límite de personas, tiempo real, offline,
3 listas activas, historial de 30 días.

**Premium** (~2,99 €/mes o 24,99 €/año; precio local por mercado):

- Listas y plantillas ilimitadas + listas recurrentes automáticas (la compra semanal se
  autogenera los jueves).
- Historial completo y «volver a comprar» a partir de compras anteriores.
- Presupuesto y seguimiento de gasto con estimación de precios.
- Despensa/inventario con avisos de caducidad.
- Pegar una receta o una foto → lista generada (IA).
- Familia hasta 6 personas con roles y asignación de productos.
- Exportación (PDF/CSV) e impresión con diseño.

**Segunda vía de ingresos**: afiliación con supermercados online (Amazon Fresh, Carrefour,
Instacart) — botón «pedir esta lista online». Encaja de forma natural y no molesta a quien no lo usa.

Regla de diseño del *paywall*: **jamás limitar el compartir ni el número de colaboradores**. Ahí
está el crecimiento. Se monetiza la conveniencia personal, no la colaboración.

---

## 7. Mejoras y funcionalidades diferenciales

Ordenadas por relación valor/esfuerzo. Las cinco primeras son, en mi opinión, las que convierten
esto en un producto y no en una demo.

1. **Orden automático por pasillo** — los productos se agrupan por categoría y el orden de
   categorías se puede ajustar al recorrido habitual del supermercado. Ahorro real de tiempo, y
   nadie lo hace bien.
2. **Añadir por voz** (Web Speech API) — «leche, dos yogures, pan». Con las manos ocupadas y el
   carro delante, escribir no es viable. Se parsea cantidad + unidad + producto.
3. **Autocompletado inteligente** — catálogo normalizado + historial personal. Al tercer uso, la
   compra semanal se escribe en 20 segundos.
4. **Modo supermercado** — pantalla siempre encendida (Wake Lock API), tipografía grande, objetivos
   táctiles de 56 px, vibración al marcar, marcados abajo y separados.
5. **Compartir nativo** — Web Share API con texto preparado para WhatsApp, que es como se comparte
   de verdad en España y Latinoamérica.
6. **Pegar texto o receta → lista** — heurística primero (una línea = un producto, regex de
   cantidades), IA después para recetas en prosa.
7. **Notificaciones push** — «Papá ha añadido cerveza», con agrupación para no ser pesados.
8. **Escaneo de código de barras** (`BarcodeDetector`) — se acabó el producto, se escanea el envase.
9. **Presupuesto y total estimado** — precio medio por producto, aprendido del historial del usuario.
10. **PWA con `share_target`** — compartir una receta desde el navegador *hacia* nuestra app.
11. **Presencia en vivo** — «Ana está comprando ahora». Evita duplicar la compra.
12. **Asignar productos a personas** — útil cuando dos se separan por pasillos.
13. **Despensa con caducidades** — reduce desperdicio; gancho natural de Premium.
14. **Deshacer** en cualquier acción destructiva, con *toast* de 5 segundos.
15. **Widgets y atajos** — Android *shortcuts*, iOS Shortcuts vía enlace profundo.

---

## 8. Privacidad, cumplimiento y accesibilidad

- **RGPD desde el diseño**: datos en la UE (Supabase región `eu-west`, PostHog EU Cloud), banner
  de consentimiento real (no *dark patterns*), analítica sin cookies de terceros.
- **Minimización**: al invitado no se le pide absolutamente ningún dato personal. Es una ventaja
  competitiva y también una postura de cumplimiento.
- Página de privacidad y términos en ambos idiomas antes del lanzamiento público.
- Exportación y borrado de cuenta autoservicio (arts. 15 y 17 RGPD).
- **Accesibilidad WCAG 2.2 AA** como criterio de aceptación, no como fase posterior: contraste
  ≥ 4,5:1, navegación completa por teclado, foco visible, roles ARIA correctos (los aporta Radix),
  `prefers-reduced-motion`. Auditoría con axe en CI.

---

## 9. Roadmap

### Fase 0 — Fundaciones (semana 1)
Repositorio, CI (Biome + tsc + Vitest + Playwright + axe + Lighthouse CI), design tokens,
scaffolding de next-intl, proyecto Supabase, esquema base y migraciones, capa SEO
(metadata, hreflang, sitemap, robots), despliegue en Vercel con *preview*.
**Entregable**: `/es` y `/en` en producción con Lighthouse ≥ 95.

### Fase 1 — MVP invitado (semanas 2-5) — *el núcleo del producto*
Alta anónima, crear lista, añadir/editar/marcar/borrar productos, orden por categoría,
compartir por enlace + Web Share, tiempo real multidispositivo, offline con outbox, PWA
instalable, modo supermercado, añadir por voz, landing ES/EN, 20 plantillas indexables.
**Entregable**: producto usable de principio a fin, medido con las 5 métricas de la sección 1.

### Fase 2 — Cuentas (semanas 6-8)
Supabase Auth (OTP por email + Google + Apple), **conversión anónimo → registrado conservando
UUID y listas**, dashboard multi-lista, plantillas propias, historial y «volver a comprar»,
gestión de miembros y roles, push, ajustes de perfil.
**Entregable**: retención D7 medible sobre usuarios registrados.

### Fase 3 — Premium e inteligencia (semanas 9-13)
Stripe (Checkout + portal + webhooks), *feature gating*, listas recurrentes, presupuesto y
precios, despensa con caducidades, pegar receta → lista con IA, escaneo de códigos de barras,
exportación PDF/CSV.
**Entregable**: primer euro y conversión free→premium instrumentada.

### Fase 4 — Escala (continuo)
SEO programático a escala (cientos de plantillas y guías por idioma), blog con calendario
editorial, nuevos idiomas (pt, fr, it), enlaces de afiliación, empaquetado para tiendas (TWA en
Android, Capacitor en iOS), integraciones (Alexa, Siri Shortcuts, Google Home).

---

## 10. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| **`shoppinglist.com` no está disponible** (comprobado: registrado, no comprable) | Alto — condiciona marca, SEO y correo | Decidir la marca **antes de la Fase 0**: negociar la compra al titular, o elegir alternativa con intención de búsqueda (`getshoppinglist.com` sí está libre, ~11 $/año). Toda referencia al dominio en el código debe salir de una variable de entorno, nunca escrita a mano. |
| Nombre genérico → marca difícil de posicionar | Medio | La keyword exacta ayuda al SEO pero no defiende la marca. Compensar con producto reconocible y contenido de marca. |
| Abuso del alta anónima | Medio | Turnstile en el alta, rate limiting en el borde, cron de purga de anónimos huérfanos. |
| Crecimiento de `auth.users` por invitados | Medio | Purga a 30 días sin listas; monitorizar tamaño semanalmente. |
| Enlace filtrado (reenvío de WhatsApp) | Medio | Tokens revocables y rotables, caducidad opcional, panel de miembros, roles de sólo lectura. |
| Coste de Realtime al escalar | Medio | Filtrar canales por `list_id`, desconectar en segundo plano, *broadcast* para lo efímero. |
| Competencia consolidada (AnyList, Bring!) | Medio | No competir de frente: nuestra cuña es «sin registro + enlace compartible + offline real». |
| El SEO tarda 4-6 meses | Alto en tiempo | Combinar con canales rápidos: Product Hunt, Reddit, TikTok, viralidad intrínseca del enlace. |
| Deriva de alcance en Fase 1 | Alto | La sección 7 está priorizada a propósito: nada por debajo del punto 5 entra en el MVP. |

---

## 11. Cómo se construirá

La implementación se hará con Sonnet siguiendo `docs/04-BACKLOG.md`, que descompone las fases en
tareas del tamaño de una PR con criterios de aceptación verificables. Reglas de trabajo:

- Una PR por tarea, con su *preview* de Vercel y capturas en móvil.
- CI bloqueante: tipos, lint, tests unitarios, e2e del camino crítico, axe y presupuesto de
  Lighthouse. Si el presupuesto de rendimiento se rompe, la PR no entra.
- Migraciones de BD siempre versionadas en `supabase/migrations/`, nunca cambios desde el panel.
- Cada funcionalidad nace con sus dos idiomas. No se acepta texto escrito directamente en JSX.

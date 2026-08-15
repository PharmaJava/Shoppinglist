# ListaSupermercado

[listasupermercado.com](https://listasupermercado.com) — lista de la compra colaborativa, en
tiempo real, **sin registro obligatorio**. Crea una lista, comparte el enlace, y toda la familia
va marcando productos mientras compra.

## Documentación

| Documento | Contenido |
|---|---|
| [`docs/00-PLAN.md`](docs/00-PLAN.md) | Plan maestro: visión, stack, arquitectura, fases, monetización, riesgos |
| [`docs/01-DATA-MODEL.md`](docs/01-DATA-MODEL.md) | Esquema SQL, RLS, Realtime, sincronización offline |
| [`docs/02-SEO.md`](docs/02-SEO.md) | Estrategia SEO e i18n (ES/EN), arquitectura de URLs, SEO programático |
| [`docs/03-UX.md`](docs/03-UX.md) | Diseño mobile-first, design system, pantallas clave, accesibilidad |
| [`docs/04-BACKLOG.md`](docs/04-BACKLOG.md) | Desglose en tareas del tamaño de una PR, con criterios de aceptación |
| [`docs/05-AUTH.md`](docs/05-AUTH.md) | Login por email, conversión de invitado a cuenta y configuración de Supabase |
| [`docs/06-PRECIOS.md`](docs/06-PRECIOS.md) | Por qué no integramos el catálogo de un supermercado y qué hacemos en su lugar |
| [`docs/07-PUSH.md`](docs/07-PUSH.md) | Notificaciones push: claves VAPID, webhook de Supabase y qué no cubren |
| [`docs/08-PWA.md`](docs/08-PWA.md) | Instalación en iOS y Android: manifest, iconos, pantallas de arranque, enlaces |
| [`docs/09-ADMIN.md`](docs/09-ADMIN.md) | Panel `/vegeta`: acceso, KPIs y por qué la contraseña no vive en el frontend |
| [`docs/10-PLANTILLAS-Y-PREFERENCIAS.md`](docs/10-PLANTILLAS-Y-PREFERENCIAS.md) | Plantillas propias, idioma y moneda del perfil |
| [`docs/11-FASE3.md`](docs/11-FASE3.md) | Cómo se construye la fase de pago a oscuras: el interruptor y qué protege |
| [`docs/12-DESPENSA.md`](docs/12-DESPENSA.md) | La despensa (premium): qué hay en casa y cuándo caduca |
| [`docs/13-RECURRENTES.md`](docs/13-RECURRENTES.md) | Listas automáticas (premium) y la tarea programada diaria |
| [`docs/14-RECETAS.md`](docs/14-RECETAS.md) | De una receta pegada a la lista (premium): qué reconoce y por qué no lleva IA |
| [`e2e/README.md`](e2e/README.md) | Qué cubren los tests end-to-end y qué falta |
| [`supabase/README.md`](supabase/README.md) | Cómo aplicar migraciones y cómo saber cuáles faltan (`pnpm db:check`) |

## Resumen en 30 segundos

- **Stack**: Next.js (App Router) + TypeScript + Tailwind + shadcn/ui, Supabase (Postgres, RLS, Realtime, Auth), Vercel.
- **Modo invitado desde el día 1** mediante *anonymous sign-in* de Supabase: el invitado tiene
  identidad real y RLS, y al registrarse **conserva el mismo `user_id` y todas sus listas**.
- **Tiempo real y offline-first**: el súper tiene mala cobertura; la app funciona sin red y
  sincroniza al recuperarla.
- **Mobile-first + PWA** instalable, con modo supermercado (pantalla activa, objetivos táctiles grandes).
- **Bilingüe ES/EN** con rutas `/es` y `/en`, `hreflang` y contenido nativo en ambos idiomas.
- **SEO como motor de crecimiento**: la app no se indexa, pero sí un catálogo de plantillas y
  guías que convierten a lista real en un clic.

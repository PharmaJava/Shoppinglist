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

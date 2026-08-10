# Backlog de implementación

Cada tarea es una PR. Formato: objetivo, alcance, criterios de aceptación verificables.
Las dependencias están indicadas; lo que no depende entre sí puede ir en paralelo.

**Definición de «hecho»** para toda tarea:
tipos en verde · Biome sin avisos · tests de la tarea · textos en ES y EN · probado a 375 px ·
sin regresión en el presupuesto de Lighthouse · axe sin violaciones críticas.

---

## Fase 0 — Fundaciones

### F0-1 · Scaffolding del proyecto
Next.js (App Router) + TypeScript `strict` + Tailwind v4 + Biome + Vitest + Playwright.
Estructura de carpetas de `00-PLAN.md §3.3`. `CLAUDE.md` con las convenciones del repositorio.
**Aceptación**: `pnpm dev`, `pnpm build`, `pnpm test`, `pnpm lint` funcionan en limpio.

### F0-2 · CI/CD
GitHub Actions: tipos, lint, unit, e2e, axe, Lighthouse CI con presupuesto. Vercel con previews.
**Aceptación**: una PR con un error de tipos o con LCP fuera de presupuesto queda bloqueada.

### F0-3 · i18n (next-intl) · dep: F0-1
Rutas `[locale]`, middleware de negociación, mensajes `es.json`/`en.json` tipados, slugs traducidos.
**Aceptación**: `/es` y `/en` renderizan; `/` redirige 307 según `Accept-Language`; una clave que
falte rompe la compilación.

### F0-4 · Design system · dep: F0-1
Tokens de `03-UX.md`, modo claro/oscuro, componentes shadcn base, `next/font` self-hosted.
**Aceptación**: página `/dev/tokens` con todos los componentes; contraste AA verificado.

### F0-5 · Proyecto Supabase y esquema base · dep: F0-1
Migraciones con el esquema de `01-DATA-MODEL.md` §2 y §3, semilla de `categories`, generación de
tipos TS, clientes browser/server/middleware.
**Aceptación**: `supabase db reset` reproduce el esquema desde cero; tipos generados en el repo;
**test de RLS que demuestra que un usuario ajeno no lee ni escribe una lista que no es suya**.

### F0-6 · Capa SEO · dep: F0-3
Helpers de metadata, hreflang, JSON-LD, `sitemap.ts`, `robots.ts`, `/api/og` con `ImageResponse`.
**Aceptación**: hreflang bidireccional verificado por test automático sobre el sitemap; JSON-LD
validado; previews con `noindex` y producción sin él.

---

## Fase 1 — MVP invitado

### F1-1 · Sesión anónima · dep: F0-5
Alta anónima automática y perezosa (al primer acto de creación, no al cargar la landing), refresco
de sesión, Turnstile en el alta.
**Aceptación**: un visitante nuevo crea una lista sin ver ninguna pantalla de registro; la sesión
sobrevive a recargar y cerrar el navegador.

### F1-2 · CRUD de listas y productos · dep: F1-1
Crear lista, renombrar, añadir/editar/marcar/borrar productos con actualización optimista y
deshacer de 5 s. IDs generados en el cliente. `sort_key` con índice fraccionario.
**Aceptación**: e2e que añade 10 productos, marca 5, borra 1, deshace y recarga con el estado exacto.

### F1-3 · Categorización automática · dep: F1-2
Catálogo semilla (≈500 productos por idioma) con normalización sin acentos, coincidencia difusa,
agrupación por pasillo con cabeceras colapsables y reordenación manual de categorías.
**Aceptación**: «tomates», «Tomate» y «tomatess» caen en `produce`; lo no reconocido va a «Otros»
y es reasignable a mano.

### F1-4 · Compartir e invitaciones · dep: F1-2
Generación de token, hoja de compartir (nativo, copiar, WhatsApp, QR), ruta `/i/[token]` con RPC
de canje, panel de miembros, revocación y rotación.
**Aceptación**: el enlace abierto en otro navegador da acceso de edición; tras revocar, el mismo
enlace falla con el mensaje genérico; **la tabla de invitaciones no es legible por un tercero**.

### F1-5 · Tiempo real · dep: F1-4
Canal privado por lista, aplicación de cambios remotos sin parpadeo, Presence, resincronización
por delta al volver del segundo plano.
**Aceptación**: e2e con dos contextos de navegador; un cambio aparece en el otro en < 1 s; tras 30 s
en segundo plano y un cambio remoto, al volver el estado es correcto.

### F1-6 · Offline y outbox · dep: F1-2
IndexedDB, cola con compactación, reintentos con backoff, `deleted_at`, LWW por `updated_at` con la
excepción de marcado, indicador de estado y de cambios pendientes.
**Aceptación**: e2e que corta la red, hace 5 cambios, recarga la página, restaura la red y verifica
que los 5 llegan sin duplicados. Test de merge concurrente entre dos clientes.

### F1-7 · PWA · dep: F1-6
Manifest, service worker (Serwist), atajos, `share_target`, prompt de instalación en la 2.ª visita.
**Aceptación**: instalable en Android y iOS; abre offline con la última lista.

### F1-8 · Modo supermercado y voz · dep: F1-3
Wake Lock, tipografía grande, sólo pendientes, háptica. Entrada por voz con parseo de
cantidad + unidad + producto y *fallback* si no hay soporte.
**Aceptación**: «dos litros de leche y pan» genera dos productos correctos; sin soporte de voz la
interfaz no muestra el micrófono.

### F1-9 · Landing ES/EN · dep: F0-6, F1-2
Landing con campo de creación directa, cómo funciona, FAQ, plantillas destacadas, JSON-LD.
**Aceptación**: Lighthouse ≥ 95 en las cuatro categorías, móvil; LCP < 1,8 s en 4G simulado.

### F1-10 · 20 plantillas + 5 guías por idioma · dep: F1-9
Contenido MDX, hub, página de plantilla con lista real interactiva, «Usar esta plantilla»,
descarga en PDF, enlazado interno.
**Aceptación**: 50 páginas indexables en el sitemap; «Usar esta plantilla» crea la lista en < 1 s;
cada plantilla tiene contenido propio (revisión editorial, no generación en serie).

### F1-11 · Analítica y errores · dep: F1-2
PostHog EU con las 5 métricas de `00-PLAN.md §1`, Sentry, consentimiento de cookies sin CLS.
**Aceptación**: embudo de activación visible en el panel; el banner no desplaza contenido.

---

## Fase 2 — Cuentas

- **F2-1 · Auth**: OTP por email, Google y Apple. Aceptación: alta y acceso en los tres métodos.
- **F2-2 · Conversión anónimo → registrado** *(la tarea crítica de la fase)*: `updateUser` /
  `linkIdentity`. Aceptación: **el `user_id` no cambia y las listas del invitado siguen accesibles**;
  test e2e explícito de este caso, y del conflicto «el email ya existe» (fusionar o avisar, nunca
  perder listas).
- **F2-3 · Dashboard multi-lista**: listas activas, archivadas, duplicar, buscar.
- **F2-4 · Plantillas propias**: guardar una lista como plantilla y reutilizarla.
- **F2-5 · Historial y «volver a comprar»**: alimenta `user_product_history`.
- **F2-6 · Roles y miembros**: editor/lector, expulsar, transferir propiedad.
- **F2-7 · Push**: Web Push con agrupación y preferencias por lista.
- **F2-8 · Perfil y RGPD**: idioma, moneda, exportar datos, borrar cuenta.

## Fase 3 — Premium

- **F3-1 · Stripe**: Checkout, portal, webhooks idempotentes, tabla `subscriptions`.
- **F3-2 · Feature gating**: comprobación en servidor **y** en cliente. Aceptación: manipular el
  cliente no desbloquea nada (test de RLS/RPC).
- **F3-3 · Listas recurrentes**: generación programada configurable.
- **F3-4 · Presupuesto y precios**: precio por producto, total estimado, aviso de exceso.
- **F3-5 · Despensa**: inventario con caducidades y avisos.
- **F3-6 · Receta → lista con IA**: heurística primero, LLM después, con límite de uso y coste
  monitorizado.
- **F3-7 · Códigos de barras**: `BarcodeDetector` con fallback.
- **F3-8 · Exportación**: PDF e impresión.

## Fase 4 — Escala

SEO programático a 100+ páginas por idioma · blog con calendario editorial · pt/fr/it ·
enlaces de afiliación · TWA en Android y Capacitor en iOS · integraciones de voz.

---

## Orden recomendado de ejecución

```
F0-1 → F0-2 ┐
F0-3 ───────┼→ F0-6 ┐
F0-4 ───────┤       │
F0-5 ───────┘       │
                    ▼
F1-1 → F1-2 → F1-3 → F1-8
         ├──→ F1-4 → F1-5
         ├──→ F1-6 → F1-7
         └──→ F1-11
F0-6 + F1-2 → F1-9 → F1-10
```

**Camino crítico hasta un producto demostrable**: F0-1, F0-5, F1-1, F1-2, F1-4, F1-5.
Con esas seis tareas ya hay una lista compartible y en tiempo real que se puede enseñar.

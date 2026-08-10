/**
 * Service worker mínimo, escrito a mano (sin Workbox/Serwist) para evitar
 * fricción con el build de Turbopack de Next.js 16.
 *
 * Alcance deliberado: sólo cachea el shell estático (assets de /_next/static
 * e iconos) y ofrece una página de fallback offline para navegaciones. NUNCA
 * intercepta peticiones a Supabase — los datos y su comportamiento offline
 * los gestiona el outbox de la app (ver src/lib/sync), no el service worker.
 *
 * Subir VERSION invalida todas las cachés antiguas en el próximo `activate`.
 */
const VERSION = "v1";
const SHELL_CACHE = `listasupermercado-shell-${VERSION}`;
const RUNTIME_CACHE = `listasupermercado-runtime-${VERSION}`;
const OFFLINE_URL = "/offline.html";

const PRECACHE_URLS = [
  OFFLINE_URL,
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== SHELL_CACHE && key !== RUNTIME_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // deja pasar Supabase y demás orígenes

  // Navegaciones: red primero (contenido dinámico/personalizado), con
  // fallback a caché y, si tampoco hay, a la página offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => (await caches.match(request)) ?? caches.match(OFFLINE_URL)),
    );
    return;
  }

  // Assets estáticos con hash de contenido: caché primero, son inmutables.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((response) => {
            const copy = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
            return response;
          }),
      ),
    );
  }
});

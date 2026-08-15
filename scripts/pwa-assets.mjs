/**
 * Genera los recursos binarios de la PWA: iconos, pantallas de arranque de iOS
 * y las capturas que Chrome enseña en el diálogo de instalación de Android.
 *
 * Se ejecuta a mano cuando cambia la marca o la landing, no en cada build: el
 * resultado se commitea. No hay `sharp` ni ImageMagick en el proyecto; dibuja
 * el propio Chromium, que ya está instalado para las pruebas.
 *
 *   node scripts/pwa-assets.mjs iconos
 *   node scripts/pwa-assets.mjs splash
 *   node scripts/pwa-assets.mjs capturas          # necesita `pnpm start` levantado
 *
 * Variables: BASE_URL (por defecto http://localhost:3111),
 * PLAYWRIGHT_CHROMIUM_PATH si el Chromium no es el que instala Playwright.
 */
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BASE_URL = process.env.BASE_URL ?? "http://localhost:3111";

/**
 * El verde de los iconos y de la pantalla de arranque.
 *
 * Es `--color-brand-400`, un paso más claro que el `theme_color` (#1fa971).
 * A tamaño de icono en la pantalla de inicio, el verde de la marca se leía
 * como casi negro; este respira. El `theme_color` no cambia: ese pinta la
 * barra de estado, donde el más oscuro va mejor.
 */
const VERDE_FONDO = "#50bb6d";
/** El de la marca dentro de la bolsa, para que no desaparezca sobre blanco. */
const VERDE_MARCA = "#3a9d55";

/**
 * `ancla` deja la sección indicada arriba del todo en vez de fiarse de un
 * número de píxeles: si mañana el hero crece dos líneas, la captura seguiría
 * empezando donde toca y no a mitad de una tarjeta.
 */
const CAPTURAS = [
  { archivo: "movil-1.png", ruta: "/es", ancho: 390, alto: 844, escala: 2 },
  {
    archivo: "movil-2.png",
    ruta: "/es",
    ancho: 390,
    alto: 844,
    escala: 2,
    ancla: { selector: "h2", indice: 1 }, // «Así se usa»
  },
  { archivo: "escritorio-1.png", ruta: "/es", ancho: 1280, alto: 800, escala: 2 },
];

async function abrirNavegador() {
  return chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined });
}

/**
 * El logotipo de la marca, en blanco sobre el verde. Es el mismo trazo que
 * `public/logo.svg` y el que se ve en la cabecera de la web.
 */
function logoSvg() {
  return `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <path d="M16 17v-3.5a8 8 0 0 1 16 0V17" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" fill="none"/>
  <path d="M6.5 17h35l-3.1 20.8A6 6 0 0 1 32.5 43h-17a6 6 0 0 1-5.9-5.2L6.5 17Z" fill="#ffffff"/>
  <path d="m17.5 28.5 4.5 4.5 9-9" stroke="${VERDE_MARCA}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>`;
}

/**
 * Iconos de la app.
 *
 * Antes eran el emoji 🛒 sobre verde: un carrito **gris**, con la rejilla
 * calada, sobre un fondo verde oscuro. Ni se leía ni era el logotipo de la
 * marca. Ahora es la bolsa blanca de siempre sobre un verde más claro.
 *
 * `proporcion` no es capricho. Android recorta el icono *maskable* a la forma
 * que use el fabricante —círculo, cuadrado redondeado, gota— y sólo garantiza
 * el 80 % central: por eso ahí el logotipo ocupa la mitad y el verde sangra
 * hasta el borde. En los iconos normales cabe más grande porque no se recorta.
 */
const ICONOS = [
  { archivo: "public/icons/icon-192.png", lado: 192, proporcion: 0.64 },
  { archivo: "public/icons/icon-512.png", lado: 512, proporcion: 0.64 },
  { archivo: "public/icons/icon-maskable-192.png", lado: 192, proporcion: 0.5 },
  { archivo: "public/icons/icon-maskable-512.png", lado: 512, proporcion: 0.5 },
  // El de Apple no se recorta, sólo se le redondean las esquinas.
  { archivo: "src/app/apple-icon.png", lado: 180, proporcion: 0.64 },
];

async function iconos(navegador) {
  for (const icono of ICONOS) {
    const contexto = await navegador.newContext({
      viewport: { width: icono.lado, height: icono.lado },
    });
    const pagina = await contexto.newPage();
    await pagina.setContent(`<style>
      html, body { margin: 0; height: 100%; }
      body { background: ${VERDE_FONDO}; display: flex; align-items: center; justify-content: center; }
      svg { width: ${icono.proporcion * 100}%; height: ${icono.proporcion * 100}%; }
    </style>${logoSvg()}`);
    await pagina.screenshot({ path: resolve(raiz, icono.archivo) });
    await contexto.close();
    console.log(icono.archivo);
  }
}

/**
 * Pantallas de arranque de iOS: fondo de marca y logotipo centrado.
 *
 * Verde y no blanco a propósito: la misma imagen sirve en claro y en oscuro,
 * así que no hay que duplicar los dieciocho archivos con una variante
 * `prefers-color-scheme: dark`.
 */
async function splash(navegador) {
  const { dispositivos } = JSON.parse(
    await readFile(resolve(raiz, "src/lib/pwa/ios-splash.json"), "utf8"),
  );

  for (const dispositivo of dispositivos) {
    const contexto = await navegador.newContext({
      viewport: { width: dispositivo.ancho, height: dispositivo.alto },
      deviceScaleFactor: dispositivo.dpr,
    });
    const pagina = await contexto.newPage();
    await pagina.setContent(HTML_SPLASH);
    await pagina.screenshot({
      path: resolve(raiz, "public/splash", `${dispositivo.ancho}x${dispositivo.alto}@${dispositivo.dpr}x.png`),
    });
    await contexto.close();
    console.log(`public/splash/${dispositivo.ancho}x${dispositivo.alto}@${dispositivo.dpr}x.png`);
  }
}

const HTML_SPLASH = `<!doctype html><meta charset="utf-8">
<style>
  html, body { margin: 0; height: 100%; }
  body {
    background: ${VERDE_FONDO};
    display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 6vh;
    font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
  }
  svg { width: 28vw; max-width: 220px; height: auto; }
  p { margin: 0; color: #fff; font-size: 4.2vw; font-weight: 700; letter-spacing: -0.01em; }
</style>
${logoSvg()}
<p>ListaSupermercado</p>`;

async function capturas(navegador) {
  for (const captura of CAPTURAS) {
    const contexto = await navegador.newContext({
      viewport: { width: captura.ancho, height: captura.alto },
      deviceScaleFactor: captura.escala,
      colorScheme: "light",
    });
    const pagina = await contexto.newPage();
    await pagina.goto(`${BASE_URL}${captura.ruta}`, { waitUntil: "load" });
    await pagina.waitForTimeout(500);
    if (captura.ancla) {
      const caja = await pagina.locator(captura.ancla.selector).nth(captura.ancla.indice).boundingBox();
      await pagina.evaluate((y) => window.scrollTo(0, y), caja.y - 24);
      await pagina.waitForTimeout(300);
    }
    await pagina.screenshot({ path: resolve(raiz, "public/screenshots", captura.archivo) });
    await contexto.close();
    console.log(`public/screenshots/${captura.archivo}`);
  }
}

const comando = process.argv[2] ?? "todo";
const navegador = await abrirNavegador();
try {
  if (comando === "iconos" || comando === "todo") await iconos(navegador);
  if (comando === "splash" || comando === "todo") await splash(navegador);
  if (comando === "capturas" || comando === "todo") await capturas(navegador);
} finally {
  await navegador.close();
}

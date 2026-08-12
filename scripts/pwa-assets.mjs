/**
 * Genera los recursos binarios del manifest: el icono maskable de 192 y las
 * capturas que Chrome enseña en el diálogo de instalación de Android.
 *
 * Se ejecuta a mano cuando cambia la marca o la landing, no en cada build: el
 * resultado se commitea. No hay `sharp` ni ImageMagick en el proyecto, así que
 * el reescalado lo hace el propio Chromium con un `<canvas>` — que para bajar
 * de 512 a 192 da exactamente lo mismo y no añade una dependencia nativa.
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

async function iconos(navegador) {
  const origen = await readFile(resolve(raiz, "public/icons/icon-maskable-512.png"));
  const pagina = await navegador.newPage();

  const base64 = await pagina.evaluate(async (fuente) => {
    const imagen = new Image();
    imagen.src = `data:image/png;base64,${fuente}`;
    await imagen.decode();

    const lienzo = document.createElement("canvas");
    lienzo.width = 192;
    lienzo.height = 192;
    const ctx = lienzo.getContext("2d");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(imagen, 0, 0, 192, 192);
    return lienzo.toDataURL("image/png").split(",")[1];
  }, origen.toString("base64"));

  await writeFile(resolve(raiz, "public/icons/icon-maskable-192.png"), Buffer.from(base64, "base64"));
  console.log("public/icons/icon-maskable-192.png");
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
    background: #1fa971;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 6vh;
    font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
  }
  svg { width: 28vw; max-width: 220px; height: auto; }
  p { margin: 0; color: #fff; font-size: 4.2vw; font-weight: 700; letter-spacing: -0.01em; }
</style>
<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <path d="M16 17v-3.5a8 8 0 0 1 16 0V17" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" fill="none"/>
  <path d="M6.5 17h35l-3.1 20.8A6 6 0 0 1 32.5 43h-17a6 6 0 0 1-5.9-5.2L6.5 17Z" fill="#ffffff"/>
  <path d="m17.5 28.5 4.5 4.5 9-9" stroke="#1fa971" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>
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

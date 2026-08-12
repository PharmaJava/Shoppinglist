import { expect, test } from "@playwright/test";

/**
 * Que la app sea instalable no se ve mirando la página: vive en el manifest,
 * en cuatro `meta` del `head` y en que los binarios que se referencian estén
 * servidos. Cualquiera de esas tres cosas se puede romper sin que nada falle
 * en pantalla, y sólo se nota al intentar instalarla en un móvil.
 */
interface Manifest {
  name: string;
  short_name: string;
  start_url: string;
  display: string;
  icons: Array<{ src: string; sizes: string; purpose?: string }>;
  screenshots: Array<{ src: string; sizes: string; form_factor?: string }>;
}

test.describe("PWA", () => {
  test("el manifest se sirve y tiene lo que Chrome exige para instalar", async ({ request }) => {
    const respuesta = await request.get("/manifest.webmanifest");
    expect(respuesta.status()).toBe(200);

    const manifest: Manifest = await respuesta.json();
    expect(manifest.name).toBeTruthy();
    expect(manifest.short_name).toBeTruthy();
    expect(manifest.start_url).toBe("/");
    expect(manifest.display).toBe("standalone");
    // Los dos criterios de instalabilidad que más se olvidan.
    expect(manifest.icons.some((icono) => icono.sizes === "512x512")).toBe(true);
    expect(manifest.icons.some((icono) => icono.purpose === "maskable")).toBe(true);
  });

  test("los iconos y las capturas del manifest existen de verdad", async ({ request }) => {
    const manifest: Manifest = await (await request.get("/manifest.webmanifest")).json();
    const rutas = [...manifest.icons, ...manifest.screenshots].map((entrada) => entrada.src);

    for (const ruta of rutas) {
      const respuesta = await request.get(ruta);
      expect(respuesta.status(), ruta).toBe(200);
      expect(respuesta.headers()["content-type"], ruta).toContain("image/png");
    }
  });

  test("el head trae lo que necesitan iOS y Android", async ({ page }) => {
    await page.goto("/es");

    await expect(page.locator('link[rel="manifest"]')).toHaveCount(1);
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);
    // Sin estos dos, en iPhone la app abierta desde la pantalla de inicio
    // sigue saliendo con la barra de Safari encima.
    await expect(page.locator('meta[name="mobile-web-app-capable"]')).toHaveAttribute(
      "content",
      "yes",
    );
    // El de Apple con prefijo, para los iPhone anteriores a iOS 15.4.
    await expect(page.locator('meta[name="apple-mobile-web-app-capable"]')).toHaveAttribute(
      "content",
      "yes",
    );
    await expect(page.locator('meta[name="theme-color"]').first()).toHaveAttribute(
      "content",
      "#1fa971",
    );
  });

  // Sin imagen de arranque, tocar el icono en el iPhone deja un rectángulo
  // blanco hasta que carga la app.
  test("hay pantalla de arranque para los iPhone de uso corriente", async ({ page, request }) => {
    await page.goto("/es");

    const imagenes = page.locator('link[rel="apple-touch-startup-image"]');
    expect(await imagenes.count()).toBeGreaterThan(10);

    // La del iPhone 12/13/14, que es la más repartida, con su media query
    // exacta: Safari descarta la imagen si no encaja al píxel.
    const iphone14 = page.locator(
      'link[rel="apple-touch-startup-image"][media*="device-width: 390px"][media*="device-height: 844px"]',
    );
    await expect(iphone14).toHaveCount(1);

    const respuesta = await request.get(String(await iphone14.getAttribute("href")));
    expect(respuesta.status()).toBe(200);
    expect(respuesta.headers()["content-type"]).toContain("image/png");
  });

  // `viewport-fit=cover` es lo que hace que `env(safe-area-inset-*)` valga
  // algo; sin él, en un iPhone con notch los paddings de seguridad son cero.
  test("el viewport llega hasta los bordes del iPhone", async ({ page }) => {
    await page.goto("/es");

    await expect(page.locator('meta[name="viewport"]')).toHaveAttribute(
      "content",
      /viewport-fit=cover/,
    );
  });

  test("el service worker se sirve desde la raíz, que es su alcance", async ({ request }) => {
    const respuesta = await request.get("/sw.js");

    expect(respuesta.status()).toBe(200);
    expect(respuesta.headers()["content-type"]).toContain("javascript");
    expect(await respuesta.text()).toContain("notificationclick");
  });

  test("hay una página offline propia que no depende de la red", async ({ request }) => {
    const respuesta = await request.get("/offline.html");

    expect(respuesta.status()).toBe(200);
    expect(await respuesta.text()).not.toContain("/_next/static/chunks");
  });
});

import { expect, test } from "@playwright/test";

/**
 * Convertir recetas es de la Fase 3 y va **apagada** a producción.
 *
 * El servidor de estas pruebas no lleva `NEXT_PUBLIC_FEATURE_PREMIUM` (ver
 * playwright.config.ts), o sea que está en el mismo estado que producción.
 */
test.describe("Recetas (Fase 3, apagada)", () => {
  test("con el interruptor apagado la ruta da 404, no una página vacía", async ({ page }) => {
    for (const ruta of ["/es/recetas", "/en/recipes"]) {
      const respuesta = await page.goto(ruta);
      expect(respuesta?.status(), ruta).toBe(404);
    }
  });

  test("no aparece en el sitemap", async ({ request }) => {
    const sitemap = await (await request.get("/sitemap.xml")).text();

    // Se compara la ruta entera: hay contenido del blog y guías que hablan de
    // recetas, y buscar la palabra suelta daría un falso positivo eterno.
    expect(sitemap).not.toMatch(/<loc>[^<]*\/(recetas|recipes)<\/loc>/);
  });

  /**
   * En `/mis-listas` hay una pared de pago que lleva aquí, y con la fase
   * apagada `PremiumGate` no la pinta. Se miran los `href`, no el texto.
   */
  test("no hay ningún enlace que lleve a ellas", async ({ page }) => {
    for (const ruta of ["/es", "/es/mis-listas", "/es/mis-plantillas", "/es/precios"]) {
      await page.goto(ruta);
      await expect(page.locator('a[href$="/recetas"], a[href$="/recipes"]'), ruta).toHaveCount(0);
    }
  });
});

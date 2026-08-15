import { expect, test } from "@playwright/test";

/**
 * La despensa es de la Fase 3 y va **apagada** a producción.
 *
 * El servidor de estas pruebas no lleva `NEXT_PUBLIC_FEATURE_PREMIUM` (ver
 * playwright.config.ts), o sea que está en el mismo estado que producción. Lo
 * que se comprueba aquí es justo eso: que estando apagada no hay forma de
 * llegar, y que no se le escapa a Google.
 */
test.describe("Despensa (Fase 3, apagada)", () => {
  test("con el interruptor apagado la ruta da 404, no una página vacía", async ({ page }) => {
    // Una página que carga y no enseña nada invita a preguntar qué pasa. Un
    // 404 dice que ahí no hay nada, que es la verdad mientras la fase no esté.
    for (const ruta of ["/es/despensa", "/en/pantry"]) {
      const respuesta = await page.goto(ruta);
      expect(respuesta?.status(), ruta).toBe(404);
    }
  });

  test("no aparece en el sitemap", async ({ request }) => {
    const sitemap = await (await request.get("/sitemap.xml")).text();

    // Se compara la ruta entera y no la palabra suelta: hay una plantilla del
    // catálogo que se llama `lista-compra-basica-despensa`, y buscar
    // «despensa» a secas la encontraría a ella.
    expect(sitemap).not.toMatch(/<loc>[^<]*\/(despensa|pantry)<\/loc>/);
  });

  /**
   * Con la fase apagada no puede haber ni un enlace que lleve a la despensa.
   * Se miran los `href`, no el texto: la palabra «despensa» aparece
   * legítimamente en el catálogo de plantillas, y buscarla daría un falso
   * positivo eterno.
   */
  test("no hay ningún enlace que lleve a ella", async ({ page }) => {
    for (const ruta of ["/es", "/es/mis-listas", "/es/precios"]) {
      await page.goto(ruta);
      await expect(page.locator('a[href$="/despensa"], a[href$="/pantry"]'), ruta).toHaveCount(0);
    }
  });
});

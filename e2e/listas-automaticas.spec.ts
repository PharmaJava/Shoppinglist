import { expect, test } from "@playwright/test";

/**
 * Las listas automáticas son de la Fase 3 y van **apagadas** a producción.
 *
 * El servidor de estas pruebas no lleva `NEXT_PUBLIC_FEATURE_PREMIUM` (ver
 * playwright.config.ts), o sea que está en el mismo estado que producción.
 */
test.describe("Listas automáticas (Fase 3, apagada)", () => {
  test("con el interruptor apagado la ruta da 404, no una página vacía", async ({ page }) => {
    for (const ruta of ["/es/listas-automaticas", "/en/recurring-lists"]) {
      const respuesta = await page.goto(ruta);
      expect(respuesta?.status(), ruta).toBe(404);
    }
  });

  test("no aparece en el sitemap", async ({ request }) => {
    const sitemap = await (await request.get("/sitemap.xml")).text();

    expect(sitemap).not.toMatch(/<loc>[^<]*\/(listas-automaticas|recurring-lists)<\/loc>/);
  });

  /**
   * Se miran los `href` y no el texto: en `/mis-plantillas` hay una pared de
   * pago que lleva aquí, y con la fase apagada `PremiumGate` no la pinta.
   */
  test("no hay ningún enlace que lleve a ellas", async ({ page }) => {
    for (const ruta of ["/es", "/es/mis-listas", "/es/mis-plantillas", "/es/precios"]) {
      await page.goto(ruta);
      await expect(
        page.locator('a[href$="/listas-automaticas"], a[href$="/recurring-lists"]'),
        ruta,
      ).toHaveCount(0);
    }
  });

  /**
   * La tarea programada crea listas a nombre de cualquiera, y su URL es
   * pública: la llama el cron de Vercel, que no tiene sesión. Sin el secreto
   * no puede pasar nada — aquí ni siquiera está configurada, y eso es un 404.
   */
  test("la tarea programada no se dispara desde fuera", async ({ request }) => {
    const sinNada = await request.get("/api/cron/recurring");
    expect(sinNada.status()).toBe(404);

    const conUnSecretoInventado = await request.get("/api/cron/recurring", {
      headers: { authorization: "Bearer lo-que-sea" },
    });
    expect(conUnSecretoInventado.status()).toBe(404);
  });
});

import { expect, test } from "@playwright/test";

/**
 * El cobro es de la Fase 3 y va **apagado** a producción, y además el
 * servidor de estas pruebas no tiene claves de Stripe. Las dos cosas por
 * separado tienen que bastar para que no pase nada.
 */
test.describe("Stripe (Fase 3, apagado)", () => {
  test("las rutas de pago no responden", async ({ request }) => {
    for (const ruta of ["/api/stripe/checkout", "/api/stripe/portal"]) {
      const respuesta = await request.post(ruta);
      expect(respuesta.status(), ruta).toBe(404);
    }
  });

  /**
   * La del webhook es la más delicada: su URL es pública y detrás está lo
   * único que da premium. Sin firma no puede pasar nada, ni siquiera cuando
   * un día haya claves.
   */
  test("el webhook no acepta un aviso inventado", async ({ request }) => {
    const respuesta = await request.post("/api/stripe/webhook", {
      data: { id: "evt_falso", type: "checkout.session.completed" },
    });

    // 404 sin configurar; 400 en cuanto haya claves, por la firma. Nunca 200.
    expect([400, 404]).toContain(respuesta.status());
  });

  test("la página de precios sigue diciendo la verdad", async ({ page }) => {
    await page.goto("/es/precios");

    await expect(page.getByText("Sin precio todavía")).toBeVisible();
    await expect(page.getByRole("button", { name: "Hacerse Premium" })).toHaveCount(0);
  });

  /**
   * Mientras no se pueda pagar, premium es una hoja de ruta y se dice así. La
   * lista de lo que premium **incluye** sólo aparece cuando hay precio, botón
   * e interruptor: prometer la despensa o las recetas a quien no las puede
   * tener sería vender humo, y hacerlo al revés —cobrar enseñando la hoja de
   * ruta— sería peor.
   */
  test("con el cobro apagado no promete funciones premium como si existieran", async ({ page }) => {
    await page.goto("/es/precios");

    await expect(page.getByText("Qué estamos preparando para premium")).toBeVisible();
    await expect(page.getByText("Qué incluye premium")).toHaveCount(0);
    await expect(page.getByText(/Despensa con caducidades/)).toHaveCount(0);
  });

  test("y sigue siendo indexable, que es de lo que vive", async ({ page }) => {
    const respuesta = await page.goto("/es/precios");

    expect(respuesta?.status()).toBe(200);
    await expect(page.locator('meta[name="robots"][content*="noindex"]')).toHaveCount(0);
  });
});

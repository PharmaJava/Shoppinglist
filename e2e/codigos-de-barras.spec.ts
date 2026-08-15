import { expect, test } from "@playwright/test";

/**
 * Escanear códigos es de la Fase 3 y va **apagada** a producción.
 *
 * A diferencia de la despensa o las recetas, esto no tiene página propia: es
 * un botón dentro de la lista y una ruta de API. Lo que se comprueba aquí es
 * que ninguna de las dos cosas responde con la fase apagada.
 */
test.describe("Códigos de barras (Fase 3, apagada)", () => {
  /**
   * La ruta pregunta a Open Food Facts, un servicio gratuito de voluntarios.
   * Con la fase apagada no puede salir de aquí ni una consulta, y el código de
   * la petición es válido a propósito: si respondiera 400 no se sabría si es
   * el interruptor o la validación lo que ha cortado.
   */
  test("la ruta de consulta no responde", async ({ request }) => {
    const respuesta = await request.get("/api/barcode/5449000000996");

    expect(respuesta.status()).toBe(404);
    expect(await respuesta.json()).toEqual({ error: "no_disponible" });
  });

  test("un código que no existe tampoco abre una puerta distinta", async ({ request }) => {
    // Mismo 404 que el anterior: con la fase apagada no hay nada que
    // distinguir, y las respuestas no cuentan lo que hay detrás.
    const respuesta = await request.get("/api/barcode/0000000000000");

    expect(respuesta.status()).toBe(404);
  });

  test("no aparece en el sitemap", async ({ request }) => {
    const sitemap = await (await request.get("/sitemap.xml")).text();

    expect(sitemap).not.toContain("/api/barcode");
  });
});

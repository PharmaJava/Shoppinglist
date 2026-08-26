import { expect, test } from "@playwright/test";

/**
 * El aviso de medición, sobre el build de verdad.
 *
 * Lo que se comprueba aquí y no se puede comprobar en un test de componente:
 * que aparece en la web real, que **no bloquea** el uso de la página, y que la
 * decisión sobrevive a una recarga — que es lo que separa un banner que
 * funciona de uno que vuelve a salir cada vez y acaba en «aceptar» por hartazgo.
 */
test.describe("Aviso de medición", () => {
  test("aparece en la primera visita, con las dos opciones a la vista", async ({ page }) => {
    await page.goto("/es");

    const aviso = page.getByRole("region", { name: "Medición de la web" });
    await expect(aviso).toBeVisible();
    await expect(aviso.getByRole("button", { name: "Aceptar" })).toBeVisible();
    await expect(aviso.getByRole("button", { name: "No, gracias" })).toBeVisible();
  });

  /**
   * No secuestra la página: se puede escribir la primera lista sin contestar.
   * Un banner que bloquea es un banner que se acepta sin leer.
   */
  test("no impide usar la web sin contestar", async ({ page }) => {
    await page.goto("/es");

    const campo = page.getByPlaceholder(/Ej\. leche/);
    await campo.click();
    await campo.fill("leche");

    await expect(campo).toHaveValue("leche");
  });

  test("contestado una vez, no vuelve a preguntar al recargar", async ({ page }) => {
    await page.goto("/es");
    await page.getByRole("button", { name: "No, gracias" }).click();

    await expect(page.getByRole("region", { name: "Medición de la web" })).toHaveCount(0);

    await page.reload();
    await expect(page.getByRole("region", { name: "Medición de la web" })).toHaveCount(0);
  });

  /** Y se puede cambiar de opinión desde cualquier página, para siempre. */
  test("el pie deja cambiar de opinión y dice en qué quedó", async ({ page }) => {
    await page.goto("/es");
    await page.getByRole("button", { name: "No, gracias" }).click();

    const enPie = page.getByRole("button", { name: "Medición: desactivada" });
    await expect(enPie).toBeVisible();

    await enPie.click();
    await expect(page.getByRole("button", { name: "Medición: activada" })).toBeVisible();
  });

  /**
   * Lo que hace que el «no» valga algo: sin permiso, el script de medición de
   * Vercel no se descarga. Si esto falla, el aviso es decorativo.
   */
  test("sin permiso no se carga el script de medición", async ({ page }) => {
    const medicion: string[] = [];
    page.on("request", (peticion) => {
      if (/_vercel\/(insights|speed-insights)/.test(peticion.url())) medicion.push(peticion.url());
    });

    await page.goto("/es");
    await page.getByRole("button", { name: "No, gracias" }).click();
    await page.waitForTimeout(500);

    expect(medicion).toEqual([]);
  });
});

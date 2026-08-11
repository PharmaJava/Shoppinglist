import { expect, test } from "@playwright/test";

/**
 * «Lista de la compra para imprimir» es de las búsquedas más repetidas del
 * sector, y la hoja impresa es lo único de la aplicación que nadie ve hasta
 * que ya está en papel. Por eso se prueba con `emulateMedia`.
 */
test.describe("Hoja de impresión", () => {
  test("en papel desaparece el cromo y queda la lista", async ({ page }) => {
    await page.goto("/es/plantillas/lista-compra-semanal");
    await page.emulateMedia({ media: "print" });

    await expect(page.locator("header").first()).toBeHidden();
    await expect(page.locator("footer")).toBeHidden();
    await expect(page.getByRole("button", { name: "Imprimir" })).toBeHidden();

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText("Leche", { exact: true })).toBeVisible();
  });

  test("cada producto lleva su casilla, que en pantalla no está", async ({ page }) => {
    await page.goto("/es/plantillas/lista-compra-semanal");

    const casilla = page.locator("li span[aria-hidden]").first();
    await expect(casilla).toBeHidden();

    await page.emulateMedia({ media: "print" });
    await expect(casilla).toBeVisible();
  });

  test("la hoja dice de dónde salió", async ({ page }) => {
    await page.goto("/es/plantillas/lista-compra-semanal");
    await page.emulateMedia({ media: "print" });

    await expect(page.getByText(/listasupermercado\.com/)).toBeVisible();
  });
});

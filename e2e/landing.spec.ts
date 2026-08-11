import { expect, test } from "@playwright/test";

test.describe("Landing", () => {
  test("la portada carga y ofrece crear una lista", async ({ page }) => {
    await page.goto("/es");

    await expect(page.getByRole("heading", { level: 1 })).toContainText("lista de la compra");
    await expect(page.getByPlaceholder(/Ej\. leche/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Crear mi lista" })).toBeVisible();
  });

  // El campo se aplastó a 21 px de alto en móvil por un `flex-1` en columna.
  // Es un fallo invisible en escritorio, así que se mide la altura real.
  test("el campo de la portada es tocable en móvil", async ({ page }) => {
    await page.goto("/es");

    const caja = await page.getByPlaceholder(/Ej\. leche/).boundingBox();
    expect(caja?.height ?? 0).toBeGreaterThan(40);
  });

  test("el menú de móvil lleva al contenido", async ({ page, isMobile }) => {
    test.skip(!isMobile, "En escritorio los enlaces van sueltos, sin menú.");
    await page.goto("/es");

    await page.getByRole("button", { name: "Menú" }).click();
    await page.getByRole("navigation", { name: "Secciones" }).getByText("Blog").click();

    await expect(page).toHaveURL(/\/es\/blog$/);
  });

  test("cambiar de idioma conserva la página", async ({ page }) => {
    await page.goto("/es/precios");
    await page.getByRole("link", { name: "EN", exact: true }).click();

    await expect(page).toHaveURL(/\/en\//);
  });

  test("una ruta inventada da un 404 propio", async ({ page }) => {
    const response = await page.goto("/es/esto-no-existe");

    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});

import { expect, test } from "@playwright/test";

/**
 * Plantillas propias y preferencias.
 *
 * Sin credenciales de Supabase no se puede crear una lista ni guardar una
 * plantilla de verdad (ver `e2e/README.md`), así que lo que se comprueba aquí
 * es lo que sale del build: que las rutas existen en los dos idiomas, que no
 * se cuelan en el índice de Google y que la página se planta sola cuando no
 * hay nada que enseñar — que es el estado en el que la ve todo el mundo la
 * primera vez.
 */
test.describe("Mis plantillas", () => {
  test("la ruta existe en español y en inglés", async ({ page }) => {
    await page.goto("/es/mis-plantillas");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Mis plantillas");

    await page.goto("/en/my-templates");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("My templates");
  });

  /**
   * El slug traducido sale del mapa de `routing.ts`. Con el slug del otro
   * idioma, next-intl **redirige** (307) al que toca en vez de dar 404 — que
   * es mejor: un enlace viejo o mal copiado sigue llevando a la página.
   */
  test("el slug del otro idioma redirige al que toca", async ({ page, request }) => {
    const cruda = await request.get("/en/mis-plantillas", { maxRedirects: 0 });
    expect(cruda.status()).toBe(307);
    expect(cruda.headers().location).toContain("/en/my-templates");

    await page.goto("/en/mis-plantillas");
    await expect(page).toHaveURL(/\/en\/my-templates$/);
  });

  test("sin plantillas, explica dónde se guardan en vez de dejar un hueco", async ({ page }) => {
    await page.goto("/es/mis-plantillas");

    await expect(page.getByText(/Todavía no tienes plantillas/)).toBeVisible();
    await expect(page.getByText(/Guardar como plantilla/)).toBeVisible();
  });

  // Son las plantillas de una persona, no el catálogo público: en el índice de
  // Google no pintan nada, y además no tendrían contenido que enseñar.
  test("no se indexa ni entra en el sitemap", async ({ page, request }) => {
    await page.goto("/es/mis-plantillas");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);

    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).not.toContain("/mis-plantillas");
    expect(sitemap).not.toContain("/my-templates");
  });

  test("enlaza con el catálogo público, que sí es contenido", async ({ page }) => {
    await page.goto("/es/mis-plantillas");

    await page.getByRole("link", { name: /Ver plantillas públicas/ }).click();
    await expect(page).toHaveURL(/\/es\/plantillas$/);
  });
});

test.describe("Preferencias", () => {
  // Sin sesión de Supabase la página de cuenta enseña el formulario de acceso,
  // así que aquí sólo se comprueba que sigue en pie y sin indexar.
  test("la cuenta sigue cargando y sin indexar", async ({ page }) => {
    await page.goto("/es/cuenta");

    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});

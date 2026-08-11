import { expect, test } from "@playwright/test";

/**
 * El contenido es el motor de captación, así que lo que se comprueba aquí no
 * es que «se vea bien»: es que lo que Google necesita esté en el HTML servido.
 */
test.describe("Contenido y SEO", () => {
  test("el hub lista las plantillas y cada una abre su ficha", async ({ page }) => {
    await page.goto("/es/plantillas");

    const fichas = page.locator('a[href^="/es/plantillas/"]');
    expect(await fichas.count()).toBeGreaterThanOrEqual(12);

    await fichas.first().click();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("button", { name: "Imprimir" })).toBeVisible();
  });

  test("hreflang apunta a la gemela real, con su otro slug", async ({ page }) => {
    await page.goto("/es/plantillas/lista-compra-sin-gluten");

    const enlaceEn = page.locator('link[rel="alternate"][hrefLang="en-US"]');
    const href = await enlaceEn.getAttribute("href");
    expect(href).toContain("/en/templates/gluten-free-grocery-list");

    // Y la gemela devuelve el favor: un hreflang de ida sin vuelta no lo
    // cuenta Google como par.
    await page.goto(href as string);
    const vuelta = await page
      .locator('link[rel="alternate"][hrefLang="es-ES"]')
      .getAttribute("href");
    expect(vuelta).toContain("/es/plantillas/lista-compra-sin-gluten");
  });

  test("la ficha lleva sus datos estructurados", async ({ page }) => {
    await page.goto("/es/plantillas/lista-compra-semanal");

    const bloques = await page.locator('script[type="application/ld+json"]').allTextContents();
    const tipos = bloques.flatMap((bloque) => {
      const datos = JSON.parse(bloque);
      return (Array.isArray(datos) ? datos : [datos]).map((entrada) => entrada["@type"]);
    });

    expect(tipos).toContain("ItemList");
    expect(tipos).toContain("FAQPage");
    expect(tipos).toContain("BreadcrumbList");
  });

  test("el sitemap incluye las dos versiones de cada pieza", async ({ request }) => {
    const respuesta = await request.get("/sitemap.xml");
    expect(respuesta.status()).toBe(200);

    const xml = await respuesta.text();
    expect(xml).toContain("/es/plantillas/lista-compra-batch-cooking");
    expect(xml).toContain("/en/templates/meal-prep-grocery-list");
    expect((xml.match(/<url>/g) ?? []).length).toBeGreaterThanOrEqual(50);
  });

  test("robots.txt no bloquea el contenido", async ({ request }) => {
    const texto = await (await request.get("/robots.txt")).text();

    expect(texto).toContain("Sitemap:");
    expect(texto).not.toMatch(/Disallow:\s*\/\s*$/m);
  });

  test("la lista compartida no se indexa", async ({ page }) => {
    await page.goto("/l/00000000-0000-0000-0000-000000000000");

    const robots = await page.locator('meta[name="robots"]').getAttribute("content");
    expect(robots).toContain("noindex");
  });
});

import { expect, test } from "@playwright/test";

/**
 * El panel de administración.
 *
 * Lo que se comprueba aquí no es el aspecto —eso se ve mirándolo— sino las
 * dos cosas que tienen que ser ciertas siempre: que no se entra sin
 * contraseña y que la contraseña no viaja al navegador.
 *
 * Las credenciales del servidor de pruebas están en `playwright.config.ts`.
 */
const EMAIL = "admin@ejemplo.com";
const PASSWORD = "contrasena-de-pruebas-e2e";

async function entrar(page: import("@playwright/test").Page, password = PASSWORD) {
  await page.goto("/vegeta");
  await page.getByLabel("Correo").fill(EMAIL);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
}

test.describe("Panel /vegeta", () => {
  test("la ruta existe y no lleva prefijo de idioma", async ({ page }) => {
    const respuesta = await page.goto("/vegeta");

    expect(respuesta?.status()).toBe(200);
    // Si `next-intl` se lo llevara a `/es/vegeta`, la cookie de sesión
    // —que tiene `path=/vegeta`— no llegaría nunca y no habría forma de entrar.
    await expect(page).toHaveURL(/\/vegeta$/);
  });

  test("sin sesión no se ve ni un solo número", async ({ page }) => {
    await page.goto("/vegeta");

    await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
    await expect(page.getByText("Las métricas del plan")).toHaveCount(0);
    await expect(page.getByText("Activos 24 h")).toHaveCount(0);
  });

  // Los dos casos en una sola prueba a propósito: cada intento fallido cuenta
  // para el limitador de la IP, y aquí los dos navegadores comparten IP.
  test("credenciales malas no entran, y no dicen cuál de las dos falla", async ({ page }) => {
    // El aviso se busca dentro del formulario: Next monta su propio
    // `role="alert"` invisible para anunciar los cambios de ruta, y buscarlo
    // por rol a secas encuentra los dos.
    const aviso = page.locator("form p[role=alert]");

    await entrar(page, "esta-no-es");
    await expect(aviso).toHaveText("Credenciales incorrectas.");

    await page.getByLabel("Correo").fill("otra@ejemplo.com");
    await page.getByLabel("Contraseña").fill(PASSWORD);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(aviso).toHaveText("Credenciales incorrectas.");

    await expect(page.getByText("Las métricas del plan")).toHaveCount(0);
  });

  test("con las buenas se entra y el panel se dibuja", async ({ page }) => {
    await entrar(page);

    await expect(page.getByRole("heading", { name: "Panel" })).toBeVisible();
    // Este servidor de pruebas no tiene SUPABASE_SERVICE_ROLE_KEY, así que
    // el panel entra pero avisa de que no puede leer las métricas. Que ese
    // camino salga explicado y no en blanco es parte de lo que se comprueba.
    await expect(page.getByRole("heading", { name: /no se han podido leer/i })).toBeVisible();
    await expect(page.getByRole("button", { name: "Salir" })).toBeVisible();
  });

  test("la sesión aguanta la recarga y «Salir» la cierra", async ({ page }) => {
    await entrar(page);
    await expect(page.getByRole("button", { name: "Salir" })).toBeVisible();

    await page.reload();
    await expect(page.getByRole("button", { name: "Salir" })).toBeVisible();

    await page.getByRole("button", { name: "Salir" }).click();
    await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
  });

  // La cookie no lleva datos, pero si se pudiera leer desde JavaScript un XSS
  // en cualquier página del sitio se llevaría la sesión del panel.
  test("la cookie de sesión es httpOnly y no sale del panel", async ({ page, context }) => {
    await entrar(page);
    // Hay que esperar a estar dentro: si no, se leen las cookies antes de que
    // llegue la respuesta que las pone.
    await expect(page.getByRole("button", { name: "Salir" })).toBeVisible();

    const cookie = (await context.cookies()).find((c) => c.name === "vegeta_sesion");
    expect(cookie).toBeDefined();
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.sameSite).toBe("Strict");
    expect(cookie?.path).toBe("/vegeta");
  });

  /**
   * La comprobación que de verdad importa: descargar **todo** el JavaScript
   * que el navegador ejecuta en esa página y buscar dentro la contraseña, su
   * hash y el nombre de las variables. Que no esté en el HTML no bastaría:
   * podría haber acabado inlineada en un chunk.
   */
  test("ni la contraseña ni su hash llegan al navegador", async ({ page, request }) => {
    const prohibido = [PASSWORD, "ADMIN_PASSWORD_HASH", "SUPABASE_SERVICE_ROLE_KEY", "scrypt$"];

    // Se mira en los dos estados: la pantalla de acceso y el panel ya dentro.
    for (const estado of ["fuera", "dentro"] as const) {
      if (estado === "fuera") await page.goto("/vegeta");
      else await entrar(page);

      const fuentes = await page
        .locator("script[src]")
        .evaluateAll((etiquetas) => etiquetas.map((e) => (e as HTMLScriptElement).src));
      expect(fuentes.length, `${estado}: la página carga JavaScript`).toBeGreaterThan(0);

      const html = await page.content();
      for (const aguja of prohibido) {
        expect(html, `${estado}, en el HTML: ${aguja}`).not.toContain(aguja);
      }

      for (const url of fuentes) {
        const cuerpo = await (await request.get(url)).text();
        for (const aguja of prohibido) {
          expect(cuerpo, `${estado}, en ${url}: ${aguja}`).not.toContain(aguja);
        }
      }
    }
  });

  test("robots.txt lo mantiene fuera de Google", async ({ request }) => {
    const robots = await (await request.get("/robots.txt")).text();

    expect(robots).toContain("/vegeta");
  });

  test("no aparece en el sitemap", async ({ request }) => {
    const sitemap = await (await request.get("/sitemap.xml")).text();

    // Ojo con buscar «vegeta» a secas: hay una plantilla que se llama
    // `lista-compra-vegetariana` y la aserción pasaría a fallar sin motivo.
    expect(sitemap).not.toMatch(/<loc>[^<]*\/vegeta(<|\?)/);
  });
});

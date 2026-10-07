import { expect, type Page, test } from "@playwright/test";

/**
 * Crear una lista desde la portada, de principio a fin, en el navegador.
 *
 * Estas pruebas no tienen un Supabase de verdad (ver `e2e/README.md`), así
 * que aquí se le pone uno de mentira **dentro del navegador**: se interceptan
 * las peticiones a `example.supabase.co` y se contestan como lo haría
 * PostgREST, guardando lo que llega. No prueba la base de datos —eso lo hacen
 * las migraciones contra PostgreSQL—, prueba lo que la base no ve: qué se
 * manda, en qué orden, y qué ve la persona al llegar a su lista.
 */

const SUPABASE = "https://example.supabase.co";
const USUARIO = "00000000-0000-4000-8000-000000000001";

interface Servidor {
  listas: Map<string, Record<string, unknown>>;
  productos: Map<string, Record<string, unknown>>;
  /** Cada envío de productos, con cuántos llevaba. */
  enviosDeProductos: number[];
  lecturasDeProductos: number;
}

function jwtDePrueba(): string {
  const parte = (objeto: object) => Buffer.from(JSON.stringify(objeto)).toString("base64url");
  const ahora = Math.floor(Date.now() / 1000);
  return `${parte({ alg: "HS256", typ: "JWT" })}.${parte({
    sub: USUARIO,
    role: "authenticated",
    aud: "authenticated",
    is_anonymous: true,
    iat: ahora,
    exp: ahora + 3600,
  })}.firma`;
}

async function conSupabaseDeMentira(page: Page): Promise<Servidor> {
  const servidor: Servidor = {
    listas: new Map(),
    productos: new Map(),
    enviosDeProductos: [],
    lecturasDeProductos: 0,
  };

  await page.route(`${SUPABASE}/**`, async (route) => {
    const peticion = route.request();
    const url = new URL(peticion.url());
    const metodo = peticion.method();
    const objetoSuelto = (peticion.headers().accept ?? "").includes("vnd.pgrst.object");

    // Alta de invitado (signInAnonymously).
    if (url.pathname === "/auth/v1/signup") {
      const ahora = Math.floor(Date.now() / 1000);
      return route.fulfill({
        json: {
          access_token: jwtDePrueba(),
          token_type: "bearer",
          expires_in: 3600,
          expires_at: ahora + 3600,
          refresh_token: "refresco-de-prueba",
          user: {
            id: USUARIO,
            aud: "authenticated",
            role: "authenticated",
            is_anonymous: true,
            app_metadata: {},
            user_metadata: {},
            created_at: new Date().toISOString(),
          },
        },
      });
    }

    if (url.pathname === "/rest/v1/lists" && metodo === "POST") {
      const fila = { archived_at: null, budget_cents: null, ...peticion.postDataJSON() };
      servidor.listas.set(fila.id, fila);
      return route.fulfill({ status: 201, json: objetoSuelto ? fila : [fila] });
    }

    if (url.pathname === "/rest/v1/list_items" && metodo === "POST") {
      const cuerpo = peticion.postDataJSON();
      const filas: Record<string, unknown>[] = Array.isArray(cuerpo) ? cuerpo : [cuerpo];
      servidor.enviosDeProductos.push(filas.length);
      for (const fila of filas) servidor.productos.set(fila.id as string, fila);
      return route.fulfill({ status: 201, body: "" });
    }

    if (url.pathname === "/rest/v1/lists" && metodo === "GET") {
      const id = url.searchParams.get("id")?.replace(/^eq\./, "");
      const fila = id ? servidor.listas.get(id) : undefined;
      if (objetoSuelto) {
        return fila
          ? route.fulfill({ json: fila })
          : route.fulfill({ status: 406, json: { code: "PGRST116", message: "0 rows" } });
      }
      return route.fulfill({ json: [...servidor.listas.values()] });
    }

    if (url.pathname === "/rest/v1/list_items" && metodo === "GET") {
      servidor.lecturasDeProductos += 1;
      const lista = url.searchParams.get("list_id")?.replace(/^eq\./, "");
      return route.fulfill({
        json: [...servidor.productos.values()].filter((fila) => fila.list_id === lista),
      });
    }

    // Todo lo demás —historial, categorías, miembros, perfil— no cambia lo que
    // se comprueba aquí: se contesta vacío para que nada se quede colgado.
    if (objetoSuelto) {
      return route.fulfill({ status: 406, json: { code: "PGRST116", message: "0 rows" } });
    }
    return route.fulfill({ status: metodo === "GET" ? 200 : 204, json: [] });
  });

  return servidor;
}

test.describe("Crear una lista desde la portada", () => {
  test("«leche pan tomate» abre una lista con los tres productos ya dentro", async ({ page }) => {
    const servidor = await conSupabaseDeMentira(page);

    await page.goto("/es");
    await page.getByPlaceholder(/Ej\. leche/).fill("leche pan tomate");
    await page.getByRole("button", { name: "Crear mi lista" }).click();

    await page.waitForURL(/\/l\/[0-9a-f-]{36}$/);

    for (const producto of ["Leche", "Pan", "Tomate"]) {
      await expect(page.getByText(producto, { exact: true })).toBeVisible();
    }

    // Los tres en una sola petición, no uno a uno detrás de la navegación.
    expect(servidor.enviosDeProductos).toEqual([3]);
    // Y la lista se pintó con lo que ya se tenía: no se volvió a pedir al
    // servidor lo mismo que se le acababa de mandar.
    expect(servidor.lecturasDeProductos).toBe(0);
  });

  test("lo guardado en el servidor es lo que se ve", async ({ page }) => {
    const servidor = await conSupabaseDeMentira(page);

    await page.goto("/es");
    await page.getByPlaceholder(/Ej\. leche/).fill("2 litros de leche, pan");
    await page.getByRole("button", { name: "Crear mi lista" }).click();
    await page.waitForURL(/\/l\/[0-9a-f-]{36}$/);

    const listaId = page.url().split("/l/")[1];
    const guardados = [...servidor.productos.values()];

    expect(guardados.every((fila) => fila.list_id === listaId)).toBe(true);
    expect(guardados.map((fila) => fila.name)).toEqual(["Leche", "Pan"]);
    expect(guardados[0]).toMatchObject({ qty: 2, unit: "litros", created_by: USUARIO });
  });

  /** Recargar no pierde nada: lo que se ve sale del servidor, no sólo de la
   *  memoria de la pestaña que la creó. */
  test("al recargar la lista sigue completa", async ({ page }) => {
    const servidor = await conSupabaseDeMentira(page);

    await page.goto("/es");
    await page.getByPlaceholder(/Ej\. leche/).fill("leche pan tomate");
    await page.getByRole("button", { name: "Crear mi lista" }).click();
    await page.waitForURL(/\/l\/[0-9a-f-]{36}$/);
    await expect(page.getByText("Tomate", { exact: true })).toBeVisible();

    await page.reload();

    for (const producto of ["Leche", "Pan", "Tomate"]) {
      await expect(page.getByText(producto, { exact: true })).toBeVisible();
    }
    expect(servidor.lecturasDeProductos).toBeGreaterThan(0);
  });
});

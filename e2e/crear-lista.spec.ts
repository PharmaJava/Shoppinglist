import { expect, test } from "@playwright/test";
import { conSupabaseDeMentira, USUARIO } from "./support/supabase-falso";

/**
 * Crear una lista desde la portada, de principio a fin, en el navegador.
 *
 * Con el Supabase de mentira de `support/supabase-falso.ts`: qué se manda, en
 * qué orden, y qué ve la persona al llegar a su lista.
 */

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

  /**
   * El nombre de la lista se guardaba en pantalla pero no en el servidor: al
   * volver atrás volvía a ser «Mi lista». Aquí se comprueba lo que viaja
   * (un `PATCH` con las columnas editables, nunca el dueño ni la caducidad) y
   * que, tras recargar, el nombre es el nuevo.
   */
  test("renombrar la lista la guarda y el nombre sobrevive a recargar", async ({ page }) => {
    const servidor = await conSupabaseDeMentira(page);

    await page.goto("/es");
    await page.getByPlaceholder(/Ej\. leche/).fill("leche");
    await page.getByRole("button", { name: "Crear mi lista" }).click();
    await page.waitForURL(/\/l\/[0-9a-f-]{36}$/);

    const titulo = page.getByLabel("Renombrar lista");
    await expect(titulo).toHaveValue("Mi lista");
    await titulo.fill("Compra del sábado");
    await titulo.blur();

    await expect.poll(() => servidor.actualizacionesDeLista.length).toBe(1);
    const [envio] = servidor.actualizacionesDeLista;
    expect(envio?.id).toBe(page.url().split("/l/")[1]);
    expect(envio?.cambios.title).toBe("Compra del sábado");
    expect(Object.keys(envio?.cambios ?? {})).not.toContain("owner_id");
    expect(Object.keys(envio?.cambios ?? {})).not.toContain("auto_finish_at");

    await page.reload();
    await expect(page.getByLabel("Renombrar lista")).toHaveValue("Compra del sábado");
  });
});

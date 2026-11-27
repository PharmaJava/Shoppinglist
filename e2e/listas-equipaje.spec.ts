import { expect, type Page, test } from "@playwright/test";
import { conSupabaseDeMentira, type Servidor } from "./support/supabase-falso";

/**
 * Una lista de equipaje, de principio a fin, en el navegador: crearla, montar
 * sus secciones, llenarlas, marcar y volver a empezar.
 *
 * Con el Supabase de mentira de `support/supabase-falso.ts`. Lo que la base de
 * datos decide —quién puede, que no caduque, que un producto no vaya a la
 * sección de otra lista— se comprueba aparte, contra PostgreSQL (migración
 * 0018). Aquí, lo que ella no ve: qué se manda, en qué orden y qué se pinta.
 */

async function crearListaDeEquipaje(page: Page, titulo: string) {
  await page.goto("/es/mis-listas");
  // Lo primero que hace cualquiera: contestar el aviso de medición, que va
  // fijo abajo y tapa la barra de añadir hasta que se responde.
  await page.getByRole("button", { name: "No, gracias" }).click();
  await page.getByRole("button", { name: "🧳 Equipaje" }).click();
  await page.getByPlaceholder("Ej. vacaciones en la playa").fill(titulo);
  await page.getByRole("button", { name: "Crear", exact: true }).click();
  await page.waitForURL(/\/l\/[0-9a-f-]{36}$/);
}

async function nuevaSeccion(page: Page, nombre: string) {
  await page.getByRole("button", { name: "+ Sección" }).click();
  await page.getByPlaceholder(/Nombre de la sección/).fill(nombre);
  await page.getByPlaceholder(/Nombre de la sección/).press("Enter");
  await expect(page.getByRole("region", { name: nombre })).toBeVisible();
}

async function anadir(page: Page, seccion: string, texto: string) {
  const campo = page.getByPlaceholder(`Añadir a ${seccion}…`);
  await campo.fill(texto);
  await campo.press("Enter");
}

/** Espera a que la cola haya mandado todo lo que tenía. */
async function sincronizado(servidor: Servidor, productos: number, secciones: number) {
  await expect.poll(() => servidor.productos.size, { timeout: 10_000 }).toBe(productos);
  await expect.poll(() => servidor.secciones.size, { timeout: 10_000 }).toBe(secciones);
}

test.describe("Lista de equipaje", () => {
  test("se crea desde «Mis listas» y explica cómo empezar", async ({ page }) => {
    const servidor = await conSupabaseDeMentira(page);

    await crearListaDeEquipaje(page, "Vacaciones");

    await expect(page.getByLabel("Renombrar lista")).toHaveValue("Vacaciones");
    await expect(page.getByText(/Empieza creando una sección/)).toBeVisible();
    const [lista] = [...servidor.listas.values()];
    expect(lista?.kind).toBe("packing");
  });

  test("secciones con lo suyo dentro, como en el ejemplo de la mochila y la maleta", async ({
    page,
  }) => {
    const servidor = await conSupabaseDeMentira(page);
    await crearListaDeEquipaje(page, "Vacaciones");

    await nuevaSeccion(page, "Mochila niños");
    await anadir(page, "Mochila niños", "botella de agua, cuaderno, rotus");
    await nuevaSeccion(page, "Maleta Dani");
    await anadir(page, "Maleta Dani", "pastilla de la tensión, cargador del móvil, cartera");

    const mochila = page.getByRole("region", { name: "Mochila niños" });
    for (const cosa of ["Botella de agua", "Cuaderno", "Rotus"]) {
      await expect(mochila.getByText(cosa, { exact: true })).toBeVisible();
    }
    const maleta = page.getByRole("region", { name: "Maleta Dani" });
    for (const cosa of ["Pastilla de la tensión", "Cargador del móvil", "Cartera"]) {
      await expect(maleta.getByText(cosa, { exact: true })).toBeVisible();
    }

    // Y al servidor llega igual: cada cosa apuntando a su sección, y la
    // sección siempre antes que lo que lleva dentro.
    await sincronizado(servidor, 6, 2);
    const idDe = new Map([...servidor.secciones.values()].map((s) => [s.name, s.id]));
    const seccionDe = new Map([...servidor.productos.values()].map((p) => [p.name, p.section_id]));
    expect(seccionDe.get("Cuaderno")).toBe(idDe.get("Mochila niños"));
    expect(seccionDe.get("Cartera")).toBe(idDe.get("Maleta Dani"));
    expect(servidor.escrituras.indexOf("list_sections")).toBeLessThan(
      servidor.escrituras.indexOf("list_items"),
    );
  });

  test("marcar, y «Empezar de nuevo» lo desmarca todo sin borrar nada", async ({ page }) => {
    const servidor = await conSupabaseDeMentira(page);
    await crearListaDeEquipaje(page, "Cole");
    await nuevaSeccion(page, "Mochila niños");
    await anadir(page, "Mochila niños", "botella de agua, cuaderno");

    const mochila = page.getByRole("region", { name: "Mochila niños" });
    await mochila.getByRole("button", { name: "Botella de agua", exact: true }).click();
    await expect(page.getByText("1 de 2 listo")).toBeVisible();
    await mochila.getByRole("button", { name: "Cuaderno", exact: true }).click();
    await expect(page.getByText("¡Todo listo!")).toBeVisible();

    await page.getByRole("button", { name: "Empezar de nuevo" }).click();
    await page.getByRole("button", { name: "Desmarcar todo" }).click();

    await expect(page.getByText("0 de 2 listo")).toBeVisible();
    await expect(mochila.getByText("Botella de agua", { exact: true })).toBeVisible();
    await expect
      .poll(() => [...servidor.productos.values()].filter((p) => p.is_checked).length)
      .toBe(0);
    expect([...servidor.productos.values()].filter((p) => p.deleted_at)).toHaveLength(0);
  });

  /** Lo que se ve sale del servidor, no sólo de la memoria de la pestaña. */
  test("al recargar siguen las secciones, en su orden, con lo suyo", async ({ page }) => {
    const servidor = await conSupabaseDeMentira(page);
    await crearListaDeEquipaje(page, "Vacaciones");
    await nuevaSeccion(page, "Mochila niños");
    await anadir(page, "Mochila niños", "cuaderno");
    await nuevaSeccion(page, "Maleta Dani");
    await anadir(page, "Maleta Dani", "cartera");
    await sincronizado(servidor, 2, 2);

    await page.reload();

    const regiones = page.getByRole("region");
    await expect(regiones.first()).toHaveAccessibleName("Mochila niños");
    await expect(
      page.getByRole("region", { name: "Maleta Dani" }).getByText("Cartera", { exact: true }),
    ).toBeVisible();
  });

  test("borrar una sección pide confirmación y se lleva lo que tiene", async ({ page }) => {
    const servidor = await conSupabaseDeMentira(page);
    await crearListaDeEquipaje(page, "Viaje");
    await nuevaSeccion(page, "Neceser");
    await anadir(page, "Neceser", "cepillo de dientes");
    await sincronizado(servidor, 1, 1);

    await page.getByRole("button", { name: "Borrar la sección Neceser" }).click();
    await page.getByRole("button", { name: "Borrar", exact: true }).click();

    await expect(page.getByRole("region", { name: "Neceser" })).toHaveCount(0);
    await expect.poll(() => [...servidor.secciones.values()].every((s) => s.deleted_at)).toBe(true);
    await expect.poll(() => [...servidor.productos.values()].every((p) => p.deleted_at)).toBe(true);
  });

  test("la lista de la compra sigue como siempre: sin secciones", async ({ page }) => {
    await conSupabaseDeMentira(page);

    await page.goto("/es/mis-listas");
    await page.getByRole("button", { name: "No, gracias" }).click();
    await page.getByPlaceholder("Ej. compra del sábado").fill("Sábado");
    await page.getByRole("button", { name: "Crear", exact: true }).click();
    await page.waitForURL(/\/l\/[0-9a-f-]{36}$/);

    await expect(page.getByRole("button", { name: "+ Sección" })).toHaveCount(0);
    await expect(page.getByPlaceholder("Añadir producto…")).toBeVisible();
  });
});

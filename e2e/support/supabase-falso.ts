import type { Page } from "@playwright/test";

/**
 * Un Supabase de mentira **dentro del navegador**, para los e2e.
 *
 * Estas pruebas no tienen un Supabase de verdad (ver `e2e/README.md`), así
 * que se interceptan las peticiones a `example.supabase.co` y se contestan
 * como lo haría PostgREST, guardando lo que llega. No prueba la base de datos
 * —eso lo hacen las migraciones contra PostgreSQL—, prueba lo que la base no
 * ve: qué se manda, en qué orden y qué aparece en pantalla.
 */

export const SUPABASE = "https://example.supabase.co";
export const USUARIO = "00000000-0000-4000-8000-000000000001";

export interface Servidor {
  listas: Map<string, Record<string, unknown>>;
  productos: Map<string, Record<string, unknown>>;
  /** Cada envío de productos, con cuántos llevaba. */
  enviosDeProductos: number[];
  /** Cada `PATCH` a una lista: qué lista y qué columnas se mandaron. */
  actualizacionesDeLista: Array<{ id: string | undefined; cambios: Record<string, unknown> }>;
  lecturasDeProductos: number;
  secciones: Map<string, Record<string, unknown>>;
  /** Cada escritura de productos o secciones, en el orden en que llegó. */
  escrituras: Array<"list_items" | "list_sections">;
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

export async function conSupabaseDeMentira(page: Page): Promise<Servidor> {
  const servidor: Servidor = {
    listas: new Map(),
    productos: new Map(),
    enviosDeProductos: [],
    actualizacionesDeLista: [],
    lecturasDeProductos: 0,
    secciones: new Map(),
    escrituras: [],
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
      servidor.escrituras.push("list_items");
      for (const fila of filas) servidor.productos.set(fila.id as string, fila);
      return route.fulfill({ status: 201, body: "" });
    }

    if (url.pathname === "/rest/v1/lists" && metodo === "PATCH") {
      const id = url.searchParams.get("id")?.replace(/^eq\./, "");
      const cambios = peticion.postDataJSON();
      servidor.actualizacionesDeLista.push({ id, cambios });
      const fila = id ? servidor.listas.get(id) : undefined;
      if (id && fila) servidor.listas.set(id, { ...fila, ...cambios });
      return route.fulfill({ status: 204, body: "" });
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
        json: [...servidor.productos.values()].filter(
          (fila) => fila.list_id === lista && !fila.deleted_at,
        ),
      });
    }

    if (url.pathname === "/rest/v1/list_sections" && metodo === "POST") {
      const cuerpo = peticion.postDataJSON();
      const filas: Record<string, unknown>[] = Array.isArray(cuerpo) ? cuerpo : [cuerpo];
      servidor.escrituras.push("list_sections");
      for (const fila of filas) servidor.secciones.set(fila.id as string, fila);
      return route.fulfill({ status: 201, body: "" });
    }

    if (url.pathname === "/rest/v1/list_sections" && metodo === "GET") {
      const lista = url.searchParams.get("list_id")?.replace(/^eq\./, "");
      return route.fulfill({
        json: [...servidor.secciones.values()]
          .filter((fila) => fila.list_id === lista && !fila.deleted_at)
          .sort((a, b) => String(a.sort_key).localeCompare(String(b.sort_key))),
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

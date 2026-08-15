import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Lo que se prueba: la puerta y lo que **no** se pregunta.
 *
 * Cada consulta que sale de aquí va a Open Food Facts, que es un servicio
 * gratuito mantenido por voluntarios. Preguntar por códigos que no existen
 * —porque la cámara ha leído mal— o dejar que cualquiera use esto de pasarela
 * es maltratar a quien nos deja usar sus datos.
 */

const getUser = vi.fn();
const rpc = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  getSupabaseServerClient: async () => ({ auth: { getUser }, rpc }),
}));

const fetchMock = vi.fn();

function peticion(): NextRequest {
  return new NextRequest("http://localhost/api/barcode/5449000000996?locale=es");
}

async function cargarRuta() {
  vi.resetModules();
  return (await import("./route")).GET;
}

function contexto(code: string) {
  return { params: Promise.resolve({ code }) };
}

/** La respuesta que da Open Food Facts para un producto que conoce. */
function fichaDeCocaCola() {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      status: 1,
      product: { product_name_es: "Coca-Cola", brands: "Coca-Cola", quantity: "330 ml" },
    }),
  };
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_FEATURE_PREMIUM", "1");
  getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
  rpc.mockResolvedValue({ error: null });
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(fichaDeCocaCola());
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("GET /api/barcode/[code]", () => {
  it("devuelve el producto que dice Open Food Facts", async () => {
    const GET = await cargarRuta();

    const respuesta = await GET(peticion(), contexto("5449000000996"));

    expect(respuesta.status).toBe(200);
    expect(await respuesta.json()).toEqual({
      found: true,
      code: "5449000000996",
      name: "Coca-Cola",
      quantity: "330 ml",
    });
  });

  /** Una lectura a medias de la cámara no puede convertirse en una petición. */
  it("un código con el dígito de control mal no sale a la red", async () => {
    const GET = await cargarRuta();

    const respuesta = await GET(peticion(), contexto("5449000000997"));

    expect(respuesta.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sin sesión no se consulta nada", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const GET = await cargarRuta();

    const respuesta = await GET(peticion(), contexto("5449000000996"));

    expect(respuesta.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("con plan gratuito tampoco", async () => {
    rpc.mockResolvedValue({ error: { message: "Esta función es de Premium." } });
    const GET = await cargarRuta();

    const respuesta = await GET(peticion(), contexto("5449000000996"));

    expect(respuesta.status).toBe(402);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("con la Fase 3 apagada la ruta no existe", async () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_PREMIUM", "");
    const GET = await cargarRuta();

    const respuesta = await GET(peticion(), contexto("5449000000996"));

    expect(respuesta.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  /** Open Food Facts pide que quien la use se identifique. */
  it("se identifica ante Open Food Facts y pone un plazo", async () => {
    const GET = await cargarRuta();
    await GET(peticion(), contexto("5449000000996"));

    const [url, opciones] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("openfoodfacts.org/api/v2/product/5449000000996.json");
    expect((opciones.headers as Record<string, string>)["User-Agent"]).toContain(
      "ListaSupermercado",
    );
    expect(opciones.signal).toBeDefined();
  });

  it("un producto que no está es un 404, no un error", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ status: 0 }) });
    const GET = await cargarRuta();

    const respuesta = await GET(peticion(), contexto("5449000000996"));

    expect(respuesta.status).toBe(404);
    expect(await respuesta.json()).toEqual({ found: false, code: "5449000000996" });
  });

  it("una ficha sin nombre es como no tenerla", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: 1, product: { quantity: "330 ml" } }),
    });
    const GET = await cargarRuta();

    expect((await GET(peticion(), contexto("5449000000996"))).status).toBe(404);
  });

  /** Si la fuente se cae, se dice; no se hace pasar por «no lo conozco». */
  it("un fallo de la fuente se distingue de un producto desconocido", async () => {
    fetchMock.mockRejectedValue(new Error("timeout"));
    const GET = await cargarRuta();

    expect((await GET(peticion(), contexto("5449000000996"))).status).toBe(502);
  });

  it("la respuesta no se guarda en cachés compartidas", async () => {
    const GET = await cargarRuta();

    const respuesta = await GET(peticion(), contexto("5449000000996"));

    // Depende de quién pregunta —hay que ser premium—, así que `private`.
    expect(respuesta.headers.get("Cache-Control")).toContain("private");
  });
});

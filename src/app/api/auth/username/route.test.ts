import type { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Lo que se prueba aquí es la **discreción**.
 *
 * Esta ruta existe porque traducir «usuario → correo» exige leer el correo, y
 * eso no puede pasar en el navegador. De modo que lo que hay que fijar no es
 * sólo que deje entrar a quien acierta, sino que **no diga nada más**: ni qué
 * nombres de usuario existen, ni el correo de nadie, ni siquiera si el fallo
 * fue del usuario o de la contraseña.
 */

const rpc = vi.fn();
vi.mock("@supabase/supabase-js", () => ({ createClient: () => ({ rpc }) }));

const signInWithPassword = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  getSupabaseServerClient: async () => ({ auth: { signInWithPassword } }),
}));

function peticion(cuerpo: unknown): NextRequest {
  return { json: async () => cuerpo } as unknown as NextRequest;
}

async function cargarRuta() {
  vi.resetModules();
  return (await import("./route")).POST;
}

beforeEach(() => {
  rpc.mockReset();
  signInWithPassword.mockReset();
  signInWithPassword.mockResolvedValue({ error: null });
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "clave-de-servicio");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://ejemplo.supabase.co");
});

afterEach(() => vi.unstubAllEnvs());

describe("POST /api/auth/username", () => {
  it("con usuario y contraseña buenos, deja la sesión puesta", async () => {
    rpc.mockResolvedValue({ data: "ana@ejemplo.com", error: null });
    const POST = await cargarRuta();

    const respuesta = await POST(peticion({ username: "ANA_87", password: "correcta" }));

    expect(respuesta.status).toBe(200);
    // Normalizado antes de consultar: quien escribe con mayúsculas entra igual.
    expect(rpc).toHaveBeenCalledWith("email_for_username", { p_username: "ana_87" });
    expect(signInWithPassword).toHaveBeenCalledWith({
      email: "ana@ejemplo.com",
      password: "correcta",
    });
  });

  /** Lo importante: la respuesta no lleva el correo que acaba de resolver. */
  it("no devuelve el correo de nadie", async () => {
    rpc.mockResolvedValue({ data: "ana@ejemplo.com", error: null });
    const POST = await cargarRuta();

    const respuesta = await POST(peticion({ username: "ana_87", password: "correcta" }));

    expect(JSON.stringify(await respuesta.json())).not.toContain("ana@ejemplo.com");
  });

  /**
   * Un nombre que no existe y una contraseña equivocada dan **exactamente** la
   * misma respuesta. Distinguirlas convertiría esto en un comprobador de qué
   * nombres están registrados.
   */
  it("no distingue «ese usuario no existe» de «esa contraseña no es»", async () => {
    const POST = await cargarRuta();

    rpc.mockResolvedValue({ data: null, error: null });
    const noExiste = await POST(peticion({ username: "nadie_aqui", password: "x" }));

    rpc.mockResolvedValue({ data: "ana@ejemplo.com", error: null });
    signInWithPassword.mockResolvedValue({ error: { message: "Invalid login credentials" } });
    const malaClave = await POST(peticion({ username: "ana_87", password: "x" }));

    expect(noExiste.status).toBe(401);
    expect(malaClave.status).toBe(401);
    expect(await noExiste.json()).toEqual(await malaClave.json());
  });

  /** Un nombre con formato imposible no llega ni a consultarse. */
  it.each([
    ["jo", "demasiado corto"],
    ["ana@ejemplo.com", "un correo, no un usuario"],
    ["con espacio", "espacios"],
  ])("«%s» se rechaza sin tocar la base de datos (%s)", async (username) => {
    const POST = await cargarRuta();

    const respuesta = await POST(peticion({ username, password: "loquesea" }));

    expect(respuesta.status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("sin contraseña tampoco consulta nada", async () => {
    const POST = await cargarRuta();

    const respuesta = await POST(peticion({ username: "ana_87", password: "" }));

    expect(respuesta.status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("con un cuerpo que no es JSON, 400 y ya", async () => {
    const POST = await cargarRuta();

    const rota = {
      json: async () => {
        throw new Error("no es JSON");
      },
    } as unknown as NextRequest;

    expect((await POST(rota)).status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  /** Sin clave de servicio esto no existe: mismo criterio que el cron. */
  it("sin configurar responde 404", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    const POST = await cargarRuta();

    const respuesta = await POST(peticion({ username: "ana_87", password: "x" }));

    expect(respuesta.status).toBe(404);
  });
});

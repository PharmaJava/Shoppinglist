import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  getSupabaseServerClient: async () => {
    throw new Error("no debería hacer falta: el error llega antes de tocar Supabase");
  },
}));

const { GET } = await import("./route");

function llamar(query: string) {
  return GET(new Request(`https://www.listasupermercado.com/auth/callback?${query}`));
}

describe("GET /auth/callback — cuando Supabase devuelve un error", () => {
  it("lleva el motivo a la pantalla, no sólo el texto", async () => {
    const respuesta = await llamar(
      "next=%2Fes%2Fcuenta&error=server_error&error_code=identity_already_exists" +
        "&error_description=Identity+is+already+linked+to+another+user",
    );

    const destino = new URL(respuesta.headers.get("location") ?? "");
    expect(destino.pathname).toBe("/es/cuenta");
    expect(destino.searchParams.get("authError")).toBe(
      "Identity is already linked to another user",
    );
    expect(destino.searchParams.get("authErrorCode")).toBe("identity_already_exists");
  });

  it("sin código, no inventa uno", async () => {
    const respuesta = await llamar("error_description=algo+fallo");

    const destino = new URL(respuesta.headers.get("location") ?? "");
    expect(destino.searchParams.get("authError")).toBe("algo fallo");
    expect(destino.searchParams.has("authErrorCode")).toBe(false);
  });

  it("sigue sin dejar salir a otro dominio", async () => {
    const respuesta = await llamar("next=%2F%2Fmalo.com&error_description=x");

    expect(new URL(respuesta.headers.get("location") ?? "").host).toBe("www.listasupermercado.com");
  });
});

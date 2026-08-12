import { describe, expect, it } from "vitest";
import { pistaDelError } from "./diagnostico";

describe("pistaDelError", () => {
  /**
   * El error de verdad, tal cual lo devolvió Supabase en producción. La
   * función era SECURITY INVOKER y `service_role` no puede leer `auth.users`.
   */
  it("«permission denied for table users» apunta a la migración 0009", () => {
    expect(pistaDelError("permission denied for table users")).toContain("0009");
  });

  it("una función que no existe apunta a la 0007", () => {
    expect(
      pistaDelError("Could not find the function public.admin_kpis(p_dias) in the schema cache"),
    ).toContain("0007");
  });

  it("el guardián del rol apunta a la clave de servicio", () => {
    expect(pistaDelError("admin_kpis sólo la puede llamar el servidor.")).toContain(
      "SUPABASE_SERVICE_ROLE_KEY",
    );
  });

  it("sin EXECUTE apunta a reaplicar la migración", () => {
    expect(pistaDelError("permission denied for function admin_kpis")).toContain("EXECUTE");
  });

  // Un error desconocido no debe inventarse una causa: mejor enseñar sólo lo
  // que ha dicho Postgres que mandar a alguien a mirar donde no es.
  it("un error que no conocemos no recibe una pista falsa", () => {
    expect(pistaDelError("connection timed out")).toBeNull();
    expect(pistaDelError("")).toBeNull();
  });
});

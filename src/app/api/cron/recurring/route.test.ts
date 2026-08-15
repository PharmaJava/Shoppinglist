import type { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Lo que se prueba aquí es la **puerta**: esta URL es pública —la llama el
 * cron de Vercel, no hay sesión de por medio— y detrás crea listas a nombre de
 * cualquiera. Si el secreto no se comprobara bien, bastaría un `curl` para
 * hacer que a todo el mundo le aparecieran listas cuando no toca.
 */

const rpc = vi.fn();
const eliminar = vi.fn(() => ({ eq: vi.fn(async () => ({})) }));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ rpc, from: () => ({ delete: eliminar }) }),
}));

const sendNotification = vi.fn(async () => ({}));
vi.mock("web-push", () => ({
  default: { setVapidDetails: vi.fn(), sendNotification: () => sendNotification() },
}));

function peticion(cabeceras: Record<string, string> = {}): NextRequest {
  return { headers: new Headers(cabeceras) } as unknown as NextRequest;
}

async function cargarRuta() {
  vi.resetModules();
  return (await import("./route")).GET;
}

beforeEach(() => {
  rpc.mockReset();
  sendNotification.mockClear();
  vi.stubEnv("CRON_SECRET", "secreto-de-pruebas");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "clave-de-servicio");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://ejemplo.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY", "");
  vi.stubEnv("VAPID_PRIVATE_KEY", "");
});

afterEach(() => vi.unstubAllEnvs());

describe("GET /api/cron/recurring", () => {
  it("sin el secreto no crea nada", async () => {
    const GET = await cargarRuta();

    const respuesta = await GET(peticion());

    expect(respuesta.status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("con un secreto que no es, tampoco", async () => {
    const GET = await cargarRuta();

    const respuesta = await GET(peticion({ authorization: "Bearer otra-cosa" }));

    expect(respuesta.status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });

  /**
   * 404 y no 500 cuando falta la configuración: un 500 haría que Vercel diera
   * la tarea por fallida y avisara todos los días de algo que no está montado.
   */
  it("sin configurar responde que no existe", async () => {
    vi.stubEnv("CRON_SECRET", "");
    const GET = await cargarRuta();

    const respuesta = await GET(peticion({ authorization: "Bearer secreto-de-pruebas" }));

    expect(respuesta.status).toBe(404);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("con el secreto correcto corre la pasada", async () => {
    // Cada RPC devuelve lo suyo: la de recurrentes, filas; la de limpieza, un
    // número. Con un único `mockResolvedValue` se colaba un array en `finished`.
    rpc.mockImplementation(async (nombre: string) =>
      nombre === "run_due_recurring_lists" ? { data: [], error: null } : { data: 0, error: null },
    );
    const GET = await cargarRuta();

    const respuesta = await GET(peticion({ authorization: "Bearer secreto-de-pruebas" }));

    expect(respuesta.status).toBe(200);
    expect(await respuesta.json()).toEqual({ created: 0, sent: 0, finished: 0, deleted: 0 });
    expect(rpc).toHaveBeenCalledWith("run_due_recurring_lists", {});
  });

  /** Sin VAPID configurado la lista se crea igual: el aviso es un extra. */
  it("crea las listas aunque no haya avisos configurados", async () => {
    rpc.mockImplementation(async (nombre: string) =>
      nombre === "run_due_recurring_lists"
        ? {
            data: [{ recurring_id: "r1", list_id: "l1", owner_id: "u1", title: "Compra semanal" }],
            error: null,
          }
        : { data: 0, error: null },
    );
    const GET = await cargarRuta();

    const respuesta = await GET(peticion({ authorization: "Bearer secreto-de-pruebas" }));

    expect(await respuesta.json()).toEqual({ created: 1, sent: 0, finished: 0, deleted: 0 });
    expect(sendNotification).not.toHaveBeenCalled();
  });

  it("con avisos puestos, avisa a cada dispositivo del dueño", async () => {
    vi.stubEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY", "publica");
    vi.stubEnv("VAPID_PRIVATE_KEY", "privada");
    rpc.mockImplementation(async (nombre: string) =>
      nombre === "run_due_recurring_lists"
        ? {
            data: [{ recurring_id: "r1", list_id: "l1", owner_id: "u1", title: "Compra semanal" }],
            error: null,
          }
        : nombre === "push_targets_for_user"
          ? {
              data: [
                { endpoint: "https://push/movil", p256dh: "p", auth: "a", locale: "es" },
                { endpoint: "https://push/portatil", p256dh: "p", auth: "a", locale: "en" },
              ],
              error: null,
            }
          : { data: 0, error: null },
    );
    const GET = await cargarRuta();

    const respuesta = await GET(peticion({ authorization: "Bearer secreto-de-pruebas" }));

    expect(await respuesta.json()).toEqual({ created: 1, sent: 2, finished: 0, deleted: 0 });
    expect(rpc).toHaveBeenCalledWith("push_targets_for_user", { p_user: "u1" });
  });

  it("si la base de datos falla lo dice, no finge que ha ido bien", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "boom" } });
    const GET = await cargarRuta();

    const respuesta = await GET(peticion({ authorization: "Bearer secreto-de-pruebas" }));

    expect(respuesta.status).toBe(500);
  });

  /**
   * La misma pasada hace la limpieza: dar por terminadas las listas de
   * invitado a las que se les ha pasado el día (migración 0015).
   */
  it("de paso limpia las listas de invitado: las de ayer y las de hace una semana", async () => {
    rpc.mockImplementation(async (nombre: string) => {
      if (nombre === "run_due_recurring_lists") return { data: [], error: null };
      return { data: nombre === "finish_stale_guest_lists" ? 3 : 2, error: null };
    });
    const GET = await cargarRuta();

    const respuesta = await GET(peticion({ authorization: "Bearer secreto-de-pruebas" }));

    expect(await respuesta.json()).toEqual({ created: 0, sent: 0, finished: 3, deleted: 2 });
    expect(rpc).toHaveBeenCalledWith("finish_stale_guest_lists", {});
    expect(rpc).toHaveBeenCalledWith("delete_stale_guest_lists", {});
  });
});

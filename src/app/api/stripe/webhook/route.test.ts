import type { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Esta ruta es la única que da y quita premium, y su URL es pública. Lo que
 * se prueba aquí es que no hay forma de regalarse el plan mandando un JSON, y
 * que un aviso repetido —Stripe reintenta— no vuelve a aplicarse.
 */

const constructEvent = vi.fn();
const retrieveSubscription = vi.fn();
vi.mock("@/lib/stripe/server", async (original) => ({
  ...(await original<typeof import("@/lib/stripe/server")>()),
  getStripe: () => ({
    webhooks: { constructEvent },
    subscriptions: { retrieve: retrieveSubscription },
  }),
}));

const rpc = vi.fn();
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ rpc }),
}));

function peticion(
  cabeceras: Record<string, string> = { "stripe-signature": "firma" },
): NextRequest {
  return {
    headers: new Headers(cabeceras),
    text: async () => '{"lo que sea":true}',
  } as unknown as NextRequest;
}

async function cargarRuta() {
  vi.resetModules();
  return (await import("./route")).POST;
}

/** Una suscripción como la devuelve Stripe: el fin de periodo va en la línea. */
function suscripcion(estado: string, extra: Record<string, unknown> = {}) {
  return {
    id: "sub_1",
    status: estado,
    customer: "cus_1",
    items: { data: [{ current_period_end: 1_789_000_000 }] },
    ...extra,
  };
}

beforeEach(() => {
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_test");
  vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_test");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "clave-de-servicio");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://ejemplo.supabase.co");
  constructEvent.mockReset();
  retrieveSubscription.mockReset();
  rpc.mockReset();
  rpc.mockResolvedValue({ data: true, error: null });
});

afterEach(() => vi.unstubAllEnvs());

describe("POST /api/stripe/webhook", () => {
  it("sin firma no se lee ni el cuerpo", async () => {
    const POST = await cargarRuta();

    const respuesta = await POST(peticion({}));

    expect(respuesta.status).toBe(400);
    expect(constructEvent).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  /** Lo que impide que cualquiera se regale el plan mandando un JSON. */
  it("con una firma que no cuadra no se aplica nada", async () => {
    constructEvent.mockImplementation(() => {
      throw new Error("No signatures found matching the expected signature");
    });
    const POST = await cargarRuta();

    const respuesta = await POST(peticion());

    expect(respuesta.status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("sin configurar, la ruta no existe", async () => {
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "");
    const POST = await cargarRuta();

    expect((await POST(peticion())).status).toBe(404);
  });

  it("un pago terminado da premium con su fecha de fin de periodo", async () => {
    constructEvent.mockReturnValue({
      id: "evt_1",
      type: "checkout.session.completed",
      data: {
        object: {
          client_reference_id: "u1",
          customer: "cus_1",
          subscription: "sub_1",
        },
      },
    });
    retrieveSubscription.mockResolvedValue(suscripcion("active"));
    const POST = await cargarRuta();

    const respuesta = await POST(peticion());

    expect(respuesta.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith(
      "apply_subscription",
      expect.objectContaining({
        p_event: "evt_1",
        p_user: "u1",
        p_customer: "cus_1",
        p_subscription: "sub_1",
        p_status: "active",
        p_period_end: new Date(1_789_000_000 * 1000).toISOString(),
      }),
    );
  });

  /**
   * Una baja hecha desde el panel de Stripe no trae quién es: hay que
   * resolverlo por el cliente. Sin esto, cancelar por ahí dejaría a alguien
   * con premium para siempre.
   */
  it("una baja sin metadatos se resuelve por el cliente", async () => {
    constructEvent.mockReturnValue({
      id: "evt_2",
      type: "customer.subscription.deleted",
      data: { object: suscripcion("canceled") },
    });
    rpc.mockImplementation(async (nombre: string) =>
      nombre === "user_for_stripe_customer"
        ? { data: "u1", error: null }
        : { data: true, error: null },
    );
    const POST = await cargarRuta();

    await POST(peticion());

    expect(rpc).toHaveBeenCalledWith("user_for_stripe_customer", { p_customer: "cus_1" });
    expect(rpc).toHaveBeenCalledWith(
      "apply_subscription",
      expect.objectContaining({ p_user: "u1", p_status: "canceled" }),
    );
  });

  it("si no se sabe de quién es, no se toca el plan de nadie", async () => {
    constructEvent.mockReturnValue({
      id: "evt_3",
      type: "customer.subscription.updated",
      data: { object: suscripcion("active", { customer: null, metadata: {} }) },
    });
    const POST = await cargarRuta();

    const respuesta = await POST(peticion());

    expect(respuesta.status).toBe(200);
    expect(rpc).not.toHaveBeenCalledWith("apply_subscription", expect.anything());
  });

  /**
   * A lo que no se entiende se le responde 200: un 500 haría que Stripe
   * reintentara durante días y acabara desactivando el endpoint.
   */
  it("un evento que no nos toca se acusa y ya", async () => {
    constructEvent.mockReturnValue({ id: "evt_4", type: "invoice.paid", data: { object: {} } });
    const POST = await cargarRuta();

    const respuesta = await POST(peticion());

    expect(respuesta.status).toBe(200);
    expect(await respuesta.json()).toEqual({ ignorado: "invoice.paid" });
    expect(rpc).not.toHaveBeenCalled();
  });

  /** Aquí sí conviene fallar: el reintento de Stripe es justo lo que hace falta. */
  it("si la base de datos falla, se pide el reintento", async () => {
    constructEvent.mockReturnValue({
      id: "evt_5",
      type: "customer.subscription.updated",
      data: { object: suscripcion("active", { metadata: { user_id: "u1" } }) },
    });
    rpc.mockResolvedValue({ data: null, error: { message: "boom" } });
    const POST = await cargarRuta();

    expect((await POST(peticion())).status).toBe(500);
  });
});

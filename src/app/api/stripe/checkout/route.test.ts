import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * El botón de pagar. Lo que importa aquí es que **no toca el plan**: sólo
 * abre una sesión de Stripe. Quien vuelva de Checkout sin haber pagado no se
 * lleva nada, porque el plan lo pone el webhook.
 */

const create = vi.fn();
vi.mock("@/lib/stripe/server", async (original) => ({
  ...(await original<typeof import("@/lib/stripe/server")>()),
  getStripe: () => ({ checkout: { sessions: { create } } }),
  getPriceId: () => "price_1",
  stripeConfigurado: () => true,
}));

const getUser = vi.fn();
const maybeSingle = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  getSupabaseServerClient: async () => ({
    auth: { getUser },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle }) }) }),
  }),
}));

async function cargarRuta() {
  vi.resetModules();
  return (await import("./route")).POST;
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_FEATURE_PREMIUM", "1");
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://listasupermercado.com");
  getUser.mockResolvedValue({ data: { user: { id: "u1", email: "ana@ejemplo.com" } } });
  maybeSingle.mockResolvedValue({ data: null });
  create.mockReset();
  create.mockResolvedValue({ url: "https://checkout.stripe.com/c/pay/cs_test" });
});

afterEach(() => vi.unstubAllEnvs());

describe("POST /api/stripe/checkout", () => {
  it("devuelve la URL de pago", async () => {
    const POST = await cargarRuta();

    const respuesta = await POST();

    expect(respuesta.status).toBe(200);
    expect(await respuesta.json()).toEqual({ url: "https://checkout.stripe.com/c/pay/cs_test" });
  });

  /** Las dos vías por las que el webhook sabrá luego de quién es el pago. */
  it("marca la sesión con quién está pagando", async () => {
    const POST = await cargarRuta();
    await POST();

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "subscription",
        line_items: [{ price: "price_1", quantity: 1 }],
        client_reference_id: "u1",
        subscription_data: { metadata: { user_id: "u1" } },
      }),
    );
  });

  it("la primera vez va con el correo, y las siguientes con el cliente que ya existe", async () => {
    const POST = await cargarRuta();
    await POST();
    expect(create.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({ customer_email: "ana@ejemplo.com" }),
    );

    // Sin esto, cada intento de pago crearía un cliente nuevo en Stripe y el
    // historial de esa persona quedaría partido en trozos.
    maybeSingle.mockResolvedValue({ data: { stripe_customer_id: "cus_1" } });
    const POST2 = await cargarRuta();
    await POST2();
    expect(create.mock.calls[1]?.[0]).toEqual(expect.objectContaining({ customer: "cus_1" }));
  });

  it("sin sesión no hay a quién cobrar", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const POST = await cargarRuta();

    expect((await POST()).status).toBe(401);
    expect(create).not.toHaveBeenCalled();
  });

  it("con la Fase 3 apagada la ruta no existe", async () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_PREMIUM", "");
    const POST = await cargarRuta();

    expect((await POST()).status).toBe(404);
    expect(create).not.toHaveBeenCalled();
  });

  it("si Stripe no responde, se dice", async () => {
    create.mockRejectedValue(new Error("timeout"));
    const POST = await cargarRuta();

    expect((await POST()).status).toBe(502);
  });
});

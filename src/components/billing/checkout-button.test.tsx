import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import messages from "@/i18n/messages/es.json";

const fetchPlan = vi.fn(async () => "free" as "free" | "premium");
vi.mock("@/features/billing/plan", () => ({ fetchPlan: () => fetchPlan() }));

const push = vi.fn();

async function montar() {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_FEATURE_PREMIUM", "1");

  const { CheckoutButton } = await import("./checkout-button");
  const router = {
    push,
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  };

  render(
    <AppRouterContext.Provider value={router as unknown as AppRouterInstance}>
      <NextIntlClientProvider locale="en" messages={messages}>
        <CheckoutButton disponible={true} />
      </NextIntlClientProvider>
    </AppRouterContext.Provider>,
  );
}

/** El botón sólo existe para quien no paga: se espera a que aparezca. */
function botonDePago() {
  return screen.findByRole("button", { name: "Hacerse Premium" });
}

beforeEach(() => {
  push.mockClear();
  fetchPlan.mockResolvedValue("free");
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("CheckoutButton", () => {
  /**
   * Un invitado no tiene a quién cobrarle, así que primero la cuenta. Lo que
   * no puede pasar es sacarlo de su idioma en mitad de un pago: antes esto
   * navegaba a `/es/cuenta` escrito a mano, con la web en inglés incluida.
   */
  it("sin sesión lleva a la cuenta, en el idioma de la web", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ error: "sin_sesion" }), { status: 401 })),
    );

    await montar();
    const boton = await botonDePago();
    await userEvent.click(boton);

    // `/en/account`, no `/es/cuenta`: next-intl traduce la ruta al idioma de
    // la web, que es justo lo que antes no pasaba.
    await waitFor(() => expect(push).toHaveBeenCalledWith("/en/account"));
  });

  it("con sesión se va a Stripe", async () => {
    const url = "https://checkout.stripe.com/c/pay/cs_test_123";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ url }), { status: 200 })),
    );
    // `window.location.href` no se puede asignar en jsdom sin sustituirlo.
    const location = { href: "" };
    vi.stubGlobal("location", location);

    await montar();
    const boton = await botonDePago();
    await userEvent.click(boton);

    await waitFor(() => expect(location.href).toBe(url));
    expect(push).not.toHaveBeenCalled();
  });

  /** Ofrecer pagar a quien ya paga es la vía rápida a dos suscripciones. */
  it("a quien ya es premium no le ofrece pagar otra vez", async () => {
    fetchPlan.mockResolvedValue("premium");
    await montar();

    expect(await screen.findByText(/Ya eres Premium/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Hacerse Premium" })).not.toBeInTheDocument();
  });
});

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import messages from "@/i18n/messages/es.json";

const fetchPlan = vi.fn(async () => "free" as "free" | "premium");
vi.mock("@/features/billing/plan", () => ({ fetchPlan: () => fetchPlan() }));

async function montar(flag: string) {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_FEATURE_PREMIUM", flag);

  const { PremiumGate } = await import("./premium-gate");
  render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <PremiumGate titulo="La despensa" descripcion="Lo que tienes en casa" cta="Ver precios">
        <p>contenido de pago</p>
      </PremiumGate>
    </NextIntlClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  fetchPlan.mockResolvedValue("free");
});

describe("PremiumGate", () => {
  /**
   * El estado en el que esto va a producción mientras la Fase 3 esté sin
   * terminar: no se enseña ni la función, ni la pared, ni que existe. Y no se
   * pregunta el plan siquiera.
   */
  it("con el interruptor apagado no se pinta nada, ni se consulta el plan", async () => {
    await montar("");

    expect(screen.queryByText("contenido de pago")).not.toBeInTheDocument();
    expect(screen.queryByText("La despensa")).not.toBeInTheDocument();
    expect(fetchPlan).not.toHaveBeenCalled();
  });

  it("encendido y con plan gratuito, se ve la pared", async () => {
    await montar("1");

    await waitFor(() => expect(screen.getByText("La despensa")).toBeInTheDocument());
    expect(screen.getByRole("link", { name: "Ver precios" })).toHaveAttribute(
      "href",
      "/es/precios",
    );
    expect(screen.queryByText("contenido de pago")).not.toBeInTheDocument();
  });

  it("encendido y premium, se ve la función", async () => {
    fetchPlan.mockResolvedValue("premium");
    await montar("1");

    await waitFor(() => expect(screen.getByText("contenido de pago")).toBeInTheDocument());
    expect(screen.queryByText("Ver precios")).not.toBeInTheDocument();
  });

  // A quien ya paga no se le puede enseñar «esto no es tuyo» ni medio segundo
  // mientras se resuelve la consulta.
  it("mientras se sabe el plan no parpadea la pared", async () => {
    let resolver: (plan: "premium") => void = () => {};
    fetchPlan.mockImplementation(
      () =>
        new Promise((r) => {
          resolver = r as (plan: "premium") => void;
        }),
    );

    await montar("1");
    expect(screen.queryByText("La despensa")).not.toBeInTheDocument();

    resolver("premium");
    await waitFor(() => expect(screen.getByText("contenido de pago")).toBeInTheDocument());
  });

  it("si no se puede leer el plan, se trata como gratuito", async () => {
    fetchPlan.mockRejectedValue(new Error("sin red"));
    await montar("1");

    await waitFor(() => expect(screen.getByText("La despensa")).toBeInTheDocument());
  });
});

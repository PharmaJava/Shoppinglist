import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import { denyAll, grantAll, writeConsent } from "@/features/consent/consent";
import messages from "@/i18n/messages/es.json";
import { CookieBanner } from "./cookie-banner";
import { Measurement } from "./measurement";

/**
 * Los scripts de Vercel se sustituyen por marcas visibles: lo que hay que
 * comprobar no es qué pintan, sino **si llegan a montarse**. Ahí está toda la
 * diferencia entre un banner de verdad y uno de adorno.
 */
vi.mock("@vercel/analytics/next", () => ({
  Analytics: () => <div data-testid="vercel-analytics" />,
}));
vi.mock("@vercel/speed-insights/next", () => ({
  SpeedInsights: () => <div data-testid="vercel-speed-insights" />,
}));

function montar(children: React.ReactNode) {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      {children}
    </NextIntlClientProvider>,
  );
}

function seMide() {
  return screen.queryByTestId("vercel-analytics") !== null;
}

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("Measurement", () => {
  /** Quien todavía no ha dicho que sí, no ha dicho que sí. */
  it("sin contestar todavía, no se mide", () => {
    montar(<Measurement />);

    expect(seMide()).toBe(false);
  });

  it("con permiso, se mide", async () => {
    writeConsent(grantAll());
    montar(<Measurement />);

    expect(await screen.findByTestId("vercel-analytics")).toBeInTheDocument();
    expect(screen.getByTestId("vercel-speed-insights")).toBeInTheDocument();
  });

  /** El «no» tiene que apagar algo de verdad, o el banner miente. */
  it("con un no, no se carga ni un script", () => {
    writeConsent(denyAll());
    montar(<Measurement />);

    expect(seMide()).toBe(false);
  });
});

describe("CookieBanner", () => {
  it("pregunta la primera vez", async () => {
    montar(<CookieBanner />);

    expect(await screen.findByRole("button", { name: "Aceptar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "No, gracias" })).toBeInTheDocument();
  });

  /**
   * Negarse tiene que costar lo mismo que aceptar: los dos botones, visibles
   * a la vez, sin esconder el «no» detrás de un «configurar».
   */
  it("el «no» está al mismo nivel que el «sí», no escondido", async () => {
    montar(<CookieBanner />);

    const aceptar = await screen.findByRole("button", { name: "Aceptar" });
    const rechazar = screen.getByRole("button", { name: "No, gracias" });

    expect(rechazar.parentElement).toBe(aceptar.parentElement);
  });

  it("una vez contestado no vuelve a aparecer", () => {
    writeConsent(denyAll());
    montar(<CookieBanner />);

    expect(screen.queryByRole("button", { name: "Aceptar" })).not.toBeInTheDocument();
  });

  /** Y la respuesta enciende (o no) la medición sin recargar la página. */
  it("aceptar enciende la medición en el momento", async () => {
    montar(
      <>
        <CookieBanner />
        <Measurement />
      </>,
    );

    expect(seMide()).toBe(false);
    await userEvent.click(await screen.findByRole("button", { name: "Aceptar" }));

    expect(await screen.findByTestId("vercel-analytics")).toBeInTheDocument();
    // Y el banner se va: ya está contestado.
    expect(screen.queryByRole("button", { name: "Aceptar" })).not.toBeInTheDocument();
  });

  it("y rechazar la deja apagada", async () => {
    montar(
      <>
        <CookieBanner />
        <Measurement />
      </>,
    );

    await userEvent.click(await screen.findByRole("button", { name: "No, gracias" }));

    expect(seMide()).toBe(false);
  });
});

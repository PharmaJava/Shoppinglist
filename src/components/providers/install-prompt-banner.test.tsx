import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import messages from "@/i18n/messages/es.json";
import { InstallPromptBanner } from "./install-prompt-banner";

const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const ANDROID =
  "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36";

function conNavegador(userAgent: string, maxTouchPoints = 5) {
  Object.defineProperty(navigator, "userAgent", { value: userAgent, configurable: true });
  Object.defineProperty(navigator, "maxTouchPoints", { value: maxTouchPoints, configurable: true });
}

/** El banner sólo aparece a partir de la segunda visita. */
function visitasPrevias(n: number) {
  localStorage.setItem("sl_visit_count", String(n));
}

function montar() {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <InstallPromptBanner />
    </NextIntlClientProvider>,
  );
}

/** Lo que dispara Chrome cuando la app es instalable. */
function dispararBeforeInstallPrompt(prompt = vi.fn(async () => {})) {
  const evento = new Event("beforeinstallprompt");
  Object.assign(evento, { prompt, userChoice: Promise.resolve({ outcome: "accepted" }) });
  window.dispatchEvent(evento);
  return prompt;
}

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe("InstallPromptBanner", () => {
  it("no molesta en la primera visita", () => {
    conNavegador(ANDROID);
    montar();

    expect(screen.queryByText(messages.pwa.installTitle)).not.toBeInTheDocument();
  });

  it("en Android espera al evento del navegador y entonces ofrece instalar", async () => {
    conNavegador(ANDROID);
    visitasPrevias(3);
    montar();

    // Sin `beforeinstallprompt` no hay nada que pulsar: enseñar un botón de
    // «Instalar» que no instala es peor que no enseñar nada.
    expect(screen.queryByRole("button", { name: messages.pwa.installCta })).not.toBeInTheDocument();

    const prompt = dispararBeforeInstallPrompt();
    const boton = await screen.findByRole("button", { name: messages.pwa.installCta });
    await userEvent.click(boton);

    expect(prompt).toHaveBeenCalled();
  });

  // Safari no tiene `beforeinstallprompt` ni lo va a tener: en iOS lo único
  // que se puede hacer es explicar el gesto.
  it("en iPhone explica cómo se hace, porque no hay diálogo nativo", async () => {
    conNavegador(IPHONE);
    visitasPrevias(3);
    montar();

    await userEvent.click(await screen.findByRole("button", { name: messages.pwa.iosCta }));

    const hoja = screen.getByRole("dialog");
    expect(hoja).toHaveTextContent(messages.pwa.iosStep1);
    expect(hoja).toHaveTextContent(messages.pwa.iosStep2);
    expect(hoja).toHaveTextContent(messages.pwa.iosStep3);
  });

  it("dentro de Instagram no se dan instrucciones que allí no valen", () => {
    conNavegador(`${IPHONE} Instagram 300.0.0.0`);
    visitasPrevias(3);
    montar();

    expect(screen.queryByText(messages.pwa.installTitle)).not.toBeInTheDocument();
  });

  it("«ahora no» lo calla para siempre", async () => {
    conNavegador(IPHONE);
    visitasPrevias(3);
    const { unmount } = montar();

    await userEvent.click(await screen.findByRole("button", { name: messages.pwa.installDismiss }));
    await waitFor(() =>
      expect(screen.queryByText(messages.pwa.installTitle)).not.toBeInTheDocument(),
    );

    unmount();
    montar();
    expect(screen.queryByText(messages.pwa.installTitle)).not.toBeInTheDocument();
  });

  it("si la instalan por su cuenta, el banner desaparece", async () => {
    conNavegador(ANDROID);
    visitasPrevias(3);
    montar();
    dispararBeforeInstallPrompt();
    await screen.findByRole("button", { name: messages.pwa.installCta });

    window.dispatchEvent(new Event("appinstalled"));

    await waitFor(() =>
      expect(screen.queryByText(messages.pwa.installTitle)).not.toBeInTheDocument(),
    );
  });
});

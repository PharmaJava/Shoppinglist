import { cleanup, render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import { grantAll, writeConsent } from "@/features/consent/consent";
import messages from "@/i18n/messages/es.json";

/** `next/script` sólo estorba aquí: se sustituye por lo que pinta de verdad. */
vi.mock("next/script", () => ({
  default: ({
    src,
    dangerouslySetInnerHTML,
  }: {
    src?: string;
    dangerouslySetInnerHTML?: { __html: string };
  }) => (
    <script
      data-testid="ga-script"
      data-src={src ?? ""}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: doble de prueba
      dangerouslySetInnerHTML={dangerouslySetInnerHTML ?? { __html: "" }}
    />
  ),
}));

async function montar(id: string) {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", id);

  const { GoogleAnalytics } = await import("./google-analytics");
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <GoogleAnalytics />
    </NextIntlClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.unstubAllEnvs();
});

/**
 * Google Analytics todavía no se usa: sin `NEXT_PUBLIC_GA_MEASUREMENT_ID` no
 * existe en esta web. Lo que se fija aquí es que **encenderlo sea sólo poner
 * la variable**, y que ni así se cargue antes de tener permiso — que es lo
 * que de verdad se sanciona, porque pone cookies.
 */
describe("GoogleAnalytics", () => {
  it("sin identificador configurado no se carga nada, ni con permiso", async () => {
    writeConsent(grantAll());
    const { container } = await montar("");

    expect(container.querySelectorAll("script")).toHaveLength(0);
  });

  it("con identificador pero sin contestar, tampoco", async () => {
    const { container } = await montar("G-PRUEBA123");

    expect(container.querySelectorAll("script")).toHaveLength(0);
  });

  /**
   * `grantAll` sólo concede lo que hoy se pregunta, y `analytics` no se
   * pregunta si no hay identificador. Con identificador, sí — y entonces el
   * permiso vale y el script se carga.
   */
  it("con identificador y permiso, carga gtag y declara el consentimiento", async () => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "G-PRUEBA123");
    const { grantAll: conceder, writeConsent: guardar } = await import(
      "@/features/consent/consent"
    );
    guardar(conceder());

    const { container } = await montar("G-PRUEBA123");
    const scripts = [...container.querySelectorAll("script")];

    expect(scripts.some((s) => s.dataset.src?.includes("G-PRUEBA123"))).toBe(true);

    const enLinea = scripts.map((s) => s.innerHTML).join("\n");
    expect(enLinea).toContain("G-PRUEBA123");
    // Consent Mode v2: se declara el estado, y lo de publicidad se queda
    // denegado siempre porque esta web no hace nada de eso.
    expect(enLinea).toContain("analytics_storage: 'granted'");
    expect(enLinea).toContain("ad_storage: 'denied'");
    expect(enLinea).toContain("ad_user_data: 'denied'");
    expect(enLinea).toContain("ad_personalization: 'denied'");
  });
});

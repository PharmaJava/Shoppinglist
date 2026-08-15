import { cleanup, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import messages from "@/i18n/messages/es.json";

const fetchPlan = vi.fn(async () => "free" as "free" | "premium");
vi.mock("@/features/billing/plan", () => ({ fetchPlan: () => fetchPlan() }));

// La hoja arrastra el cliente de Supabase, que exige sus variables de entorno
// al cargarse. Aquí sólo se prueba quién ve el botón.
vi.mock("@/features/barcode/api", () => ({
  reconocerCodigo: vi.fn(),
  recordarCodigo: vi.fn(),
}));
vi.mock("@/features/list/use-list-mutations", () => ({
  useAddParsedItems: () => ({ mutate: vi.fn() }),
}));

/**
 * `PREMIUM_VISIBLE` se resuelve al cargar el módulo (es una constante de
 * compilación), así que hay que volver a importarlo con el entorno cambiado.
 */
async function montar(flag: string) {
  vi.stubEnv("NEXT_PUBLIC_FEATURE_PREMIUM", flag);
  vi.resetModules();
  const { ScanAddButton } = await import("./scan-add-button");

  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <ScanAddButton listId="l1" />
    </NextIntlClientProvider>,
  );
}

const BOTON = { name: messages.barcode.scan };

beforeEach(() => fetchPlan.mockResolvedValue("free"));
afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe("ScanAddButton", () => {
  /** Es el estado en el que va a producción mientras la Fase 3 esté oculta. */
  it("con la Fase 3 apagada no pinta nada", async () => {
    await montar("");

    expect(screen.queryByRole("button", BOTON)).not.toBeInTheDocument();
  });

  /**
   * En una barra de botones redondos no cabe una pared de pago con título y
   * enlace: lo que corresponde es no estar, como el micrófono en los
   * navegadores que no entienden de voz.
   */
  it("encendida pero con plan gratuito, tampoco: sin pared de pago en la barra", async () => {
    await montar("1");

    expect(screen.queryByRole("button", BOTON)).not.toBeInTheDocument();
    expect(screen.queryByText(/Premium/)).not.toBeInTheDocument();
  });

  it("con plan premium sí aparece", async () => {
    fetchPlan.mockResolvedValue("premium");
    await montar("1");

    expect(await screen.findByRole("button", BOTON)).toBeInTheDocument();
  });
});

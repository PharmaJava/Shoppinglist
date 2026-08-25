import { cleanup, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import messages from "@/i18n/messages/es.json";
import { AccountClient } from "./account-client";

vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  useSearchParams: () => new URLSearchParams(),
}));

const useSession = vi.fn();
vi.mock("@/features/auth/use-session", () => ({ useSession: () => useSession() }));

// El resto de la pantalla no entra en juego para lo que se prueba aquí —
// mismo motivo que en finish-sheet.test.tsx: aislar sin arrastrar Supabase.
vi.mock("@/features/auth/api", () => ({
  deleteAccount: vi.fn(),
  fetchDisplayName: vi.fn(async () => ""),
  linkEmailToGuestSession: vi.fn(),
  linkPasswordToGuestSession: vi.fn(),
  sendMagicLink: vi.fn(),
  sendPasswordReset: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  signUpWithPassword: vi.fn(),
  updateDisplayName: vi.fn(),
  updatePassword: vi.fn(),
}));
vi.mock("@/features/auth/export-data", () => ({
  downloadExport: vi.fn(),
  exportMyData: vi.fn(),
}));
vi.mock("@/components/billing/manage-subscription-button", () => ({
  ManageSubscriptionButton: () => null,
}));
vi.mock("./preferences-panel", () => ({ PreferencesPanel: () => null }));

function montar(email: string) {
  useSession.mockReturnValue({ status: "registered", user: { email } });

  render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <AccountClient callbackNext="/cuenta" />
    </NextIntlClientProvider>,
  );
}

beforeEach(() => {
  useSession.mockReset();
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

/**
 * El atajo a `/vegeta` desde la cuenta propia. No mete a nadie en el panel
 * —sigue pidiendo su contraseña— así que lo único que hay que fijar es a
 * quién se le enseña: sólo a la cuenta que coincide con la variable pública,
 * y sólo cuando esa variable está puesta.
 */
describe("AccountClient — atajo al panel de administración", () => {
  it("sin NEXT_PUBLIC_ADMIN_EMAIL no aparece, aunque alguien acierte el correo", () => {
    montar("dueño@listasupermercado.com");

    expect(screen.queryByRole("link", { name: "Panel de administración" })).not.toBeInTheDocument();
  });

  it("con la variable puesta y el correo igual, aparece y lleva a /vegeta", () => {
    vi.stubEnv("NEXT_PUBLIC_ADMIN_EMAIL", "dueño@listasupermercado.com");
    montar("dueño@listasupermercado.com");

    const enlace = screen.getByRole("link", { name: "Panel de administración" });
    expect(enlace).toHaveAttribute("href", "/vegeta");
  });

  it("a cualquier otra cuenta registrada no se le enseña", () => {
    vi.stubEnv("NEXT_PUBLIC_ADMIN_EMAIL", "dueño@listasupermercado.com");
    montar("alguien-mas@ejemplo.com");

    expect(screen.queryByRole("link", { name: "Panel de administración" })).not.toBeInTheDocument();
  });
});

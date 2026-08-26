import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
const signInWithPassword = vi.fn(async () => {});
const signInWithUsername = vi.fn(async () => {});
const signUpWithUsername = vi.fn(async () => {});
const signUpWithPassword = vi.fn(async () => {});
const signInWithGoogle = vi.fn(async () => {});
const isUsernameAvailable = vi.fn(async (_nombre: string) => true);

vi.mock("@/features/auth/api", () => ({
  deleteAccount: vi.fn(),
  fetchDisplayName: vi.fn(async () => ""),
  isUsernameAvailable: (n: string) => isUsernameAvailable(n),
  linkEmailToGuestSession: vi.fn(),
  linkPasswordToGuestSession: vi.fn(),
  sendMagicLink: vi.fn(),
  sendPasswordReset: vi.fn(),
  setUsername: vi.fn(),
  signInWithGoogle: (...args: unknown[]) => signInWithGoogle(...(args as [])),
  signInWithPassword: (...args: unknown[]) => signInWithPassword(...(args as [])),
  signInWithUsername: (...args: unknown[]) => signInWithUsername(...(args as [])),
  signOut: vi.fn(),
  signUpWithPassword: (...args: unknown[]) => signUpWithPassword(...(args as [])),
  signUpWithUsername: (...args: unknown[]) => signUpWithUsername(...(args as [])),
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
  for (const espia of [
    signInWithPassword,
    signInWithUsername,
    signUpWithUsername,
    signUpWithPassword,
    signInWithGoogle,
  ]) {
    espia.mockClear();
  }
  isUsernameAvailable.mockReset();
  isUsernameAvailable.mockResolvedValue(true);
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

/**
 * Las tres formas de darse de alta y las dos de entrar. Lo que se fija aquí
 * es el enrutado: qué función acaba llamándose según lo que se escribe, que
 * es donde se puede colar un fallo silencioso —entrar con un usuario por la
 * vía del correo no da error, simplemente no encuentra a nadie—.
 */
describe("AccountClient — cómo se entra y cómo se registra uno", () => {
  function montarSinSesion() {
    useSession.mockReturnValue({ status: "anonymous", user: null });

    render(
      <NextIntlClientProvider locale="es" messages={messages}>
        <AccountClient callbackNext="/cuenta" />
      </NextIntlClientProvider>,
    );
  }

  async function irAContrasena() {
    await userEvent.click(screen.getByRole("button", { name: "Contraseña" }));
  }

  it("ofrece Google sin tener que abrir ningún formulario", async () => {
    montarSinSesion();

    await userEvent.click(screen.getByRole("button", { name: "Continuar con Google" }));

    expect(signInWithGoogle).toHaveBeenCalledWith("/cuenta", false);
  });

  it("con arroba entra por correo", async () => {
    montarSinSesion();
    await irAContrasena();

    await userEvent.type(screen.getByLabelText("Correo o nombre de usuario"), "ana@ejemplo.com");
    await userEvent.type(screen.getByLabelText("Contraseña"), "contrasena-larga");
    await userEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(signInWithPassword).toHaveBeenCalledWith("ana@ejemplo.com", "contrasena-larga");
    expect(signInWithUsername).not.toHaveBeenCalled();
  });

  it("sin arroba entra por nombre de usuario", async () => {
    montarSinSesion();
    await irAContrasena();

    await userEvent.type(screen.getByLabelText("Correo o nombre de usuario"), "ana_87");
    await userEvent.type(screen.getByLabelText("Contraseña"), "contrasena-larga");
    await userEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(signInWithUsername).toHaveBeenCalledWith("ana_87", "contrasena-larga");
    expect(signInWithPassword).not.toHaveBeenCalled();
  });

  it("al registrarse con usuario, el correo va igualmente", async () => {
    montarSinSesion();
    await irAContrasena();
    await userEvent.click(screen.getByRole("button", { name: /No tienes cuenta/ }));

    await userEvent.type(screen.getByLabelText("Nombre de usuario"), "ana_87");
    await userEvent.type(screen.getByLabelText("Tu correo electrónico"), "ana@ejemplo.com");
    await userEvent.type(screen.getByLabelText("Contraseña"), "contrasena-larga");
    await userEvent.click(screen.getByRole("button", { name: "Crear cuenta" }));

    await waitFor(() =>
      expect(signUpWithUsername).toHaveBeenCalledWith(
        "ana_87",
        "ana@ejemplo.com",
        "contrasena-larga",
        "/cuenta",
      ),
    );
  });

  /** El usuario es opcional: sin él, el alta es la de toda la vida. */
  it("y sin usuario, se registra sólo con correo", async () => {
    montarSinSesion();
    await irAContrasena();
    await userEvent.click(screen.getByRole("button", { name: /No tienes cuenta/ }));

    await userEvent.type(screen.getByLabelText("Tu correo electrónico"), "ana@ejemplo.com");
    await userEvent.type(screen.getByLabelText("Contraseña"), "contrasena-larga");
    await userEvent.click(screen.getByRole("button", { name: "Crear cuenta" }));

    await waitFor(() =>
      expect(signUpWithPassword).toHaveBeenCalledWith(
        "ana@ejemplo.com",
        "contrasena-larga",
        "/cuenta",
      ),
    );
    expect(signUpWithUsername).not.toHaveBeenCalled();
  });

  it("un nombre cogido se dice antes de crear nada", async () => {
    isUsernameAvailable.mockResolvedValueOnce(false);
    montarSinSesion();
    await irAContrasena();
    await userEvent.click(screen.getByRole("button", { name: /No tienes cuenta/ }));

    await userEvent.type(screen.getByLabelText("Nombre de usuario"), "ana_87");
    await userEvent.type(screen.getByLabelText("Tu correo electrónico"), "ana@ejemplo.com");
    await userEvent.type(screen.getByLabelText("Contraseña"), "contrasena-larga");
    await userEvent.click(screen.getByRole("button", { name: "Crear cuenta" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/ya es de otra persona/);
    expect(signUpWithUsername).not.toHaveBeenCalled();
  });
});

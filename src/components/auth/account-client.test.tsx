import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import messages from "@/i18n/messages/es.json";
import { AccountClient } from "./account-client";

let parametros = new URLSearchParams();
vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  useSearchParams: () => parametros,
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
const linkPasswordToGuestSession = vi.fn(async () => {});
const isUsernameAvailable = vi.fn(async (_nombre: string) => true);

vi.mock("@/features/auth/api", () => ({
  deleteAccount: vi.fn(),
  fetchDisplayName: vi.fn(async () => ""),
  isUsernameAvailable: (n: string) => isUsernameAvailable(n),
  linkEmailToGuestSession: vi.fn(),
  linkPasswordToGuestSession: (...args: unknown[]) => linkPasswordToGuestSession(...(args as [])),
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
    linkPasswordToGuestSession,
  ]) {
    espia.mockClear();
  }
  parametros = new URLSearchParams();
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

/**
 * Un invitado que ya tiene cuenta.
 *
 * La web hace invitado a cualquiera en cuanto crea su primera lista, así que
 * quien ya se había registrado y vuelve desde un navegador nuevo es un
 * invitado. Antes, todo lo que se le ofrecía era *guardar*: vincular Google,
 * un correo o una contraseña a su identidad de invitado — y eso falla siempre
 * si ya pertenecen a otra cuenta. No había ningún camino para entrar.
 */
describe("AccountClient — invitado que ya tiene cuenta", () => {
  function montarInvitado() {
    useSession.mockReturnValue({ status: "guest", user: { id: "invitado-1" } });

    render(
      <NextIntlClientProvider locale="es" messages={messages}>
        <AccountClient callbackNext="/cuenta" />
      </NextIntlClientProvider>,
    );
  }

  it("por defecto sigue ofreciendo guardar las listas con Google", async () => {
    montarInvitado();

    await userEvent.click(screen.getByRole("button", { name: "Guardarlas con Google" }));

    expect(signInWithGoogle).toHaveBeenCalledWith("/cuenta", true);
  });

  it("ofrece entrar en una cuenta que ya existe", () => {
    montarInvitado();

    expect(screen.getByRole("button", { name: "¿Ya tienes cuenta? Entra en ella" })).toBeVisible();
  });

  /** Entrar es `signInWithOAuth`, no `linkIdentity`: el segundo se limita a
   *  añadir Google al invitado, y si ese Google ya es de otro usuario, falla. */
  it("al elegirlo, Google entra en la cuenta en vez de vincularse al invitado", async () => {
    montarInvitado();
    await userEvent.click(screen.getByRole("button", { name: "¿Ya tienes cuenta? Entra en ella" }));

    await userEvent.click(screen.getByRole("button", { name: "Continuar con Google" }));

    expect(signInWithGoogle).toHaveBeenCalledWith("/cuenta", false);
  });

  it("avisa de que las listas de este navegador no pasan a la cuenta", async () => {
    montarInvitado();
    await userEvent.click(screen.getByRole("button", { name: "¿Ya tienes cuenta? Entra en ella" }));

    expect(screen.getByText(/no se pasarán a ella/)).toBeVisible();
  });

  it("con contraseña, entra en vez de intentar crear la cuenta de nuevo", async () => {
    montarInvitado();
    await userEvent.click(screen.getByRole("button", { name: "¿Ya tienes cuenta? Entra en ella" }));
    await userEvent.click(screen.getByRole("button", { name: "Contraseña" }));

    await userEvent.type(screen.getByLabelText("Correo o nombre de usuario"), "ana@ejemplo.com");
    await userEvent.type(screen.getByLabelText("Contraseña"), "contrasena-larga");
    await userEvent.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() =>
      expect(signInWithPassword).toHaveBeenCalledWith("ana@ejemplo.com", "contrasena-larga"),
    );
    expect(linkPasswordToGuestSession).not.toHaveBeenCalled();
  });

  it("se puede volver a guardar las listas del navegador", async () => {
    montarInvitado();
    await userEvent.click(screen.getByRole("button", { name: "¿Ya tienes cuenta? Entra en ella" }));

    await userEvent.click(
      screen.getByRole("button", { name: "Volver: guardar las listas de este navegador" }),
    );

    expect(screen.getByRole("button", { name: "Guardarlas con Google" })).toBeVisible();
  });

  /** Lo que Supabase devuelve cuando el Google ya está en otra cuenta. Se
   *  decía «el enlace ha caducado», que no tiene nada que ver. */
  it("si ese Google ya tiene cuenta, lo dice y deja entrar en ella", async () => {
    parametros = new URLSearchParams({
      authError: "Identity is already linked to another user",
      authErrorCode: "identity_already_exists",
    });
    montarInvitado();

    expect(screen.getByText(/Ese Google ya tiene una cuenta/)).toBeVisible();
    expect(screen.queryByText(/El enlace no ha funcionado/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Continuar con Google" }));
    expect(signInWithGoogle).toHaveBeenCalledWith("/cuenta", false);
  });

  it("cualquier otro error de enlace sigue diciendo lo de siempre", () => {
    parametros = new URLSearchParams({ authError: "otp_expired", authErrorCode: "otp_expired" });
    montarInvitado();

    expect(screen.getByText(/El enlace no ha funcionado/)).toBeVisible();
  });
});

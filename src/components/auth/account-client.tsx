"use client";

import NextLink from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { ManageSubscriptionButton } from "@/components/billing/manage-subscription-button";
import {
  deleteAccount,
  fetchDisplayName,
  isUsernameAvailable,
  linkEmailToGuestSession,
  linkPasswordToGuestSession,
  sendMagicLink,
  sendPasswordReset,
  setUsername,
  signInWithGoogle,
  signInWithPassword,
  signInWithUsername,
  signOut,
  signUpWithPassword,
  signUpWithUsername,
  updateDisplayName,
  updatePassword,
} from "@/features/auth/api";
import { downloadExport, exportMyData } from "@/features/auth/export-data";
import { useSession } from "@/features/auth/use-session";
import { isValidUsername, looksLikeEmail, USERNAME_MAX } from "@/features/auth/username";
import { Link } from "@/i18n/navigation";
import { PreferencesPanel } from "./preferences-panel";

/** Mínimo propio, por encima del de Supabase (6): 8 es el suelo razonable hoy
 *  y comprobarlo antes evita un viaje de red para un error evitable. */
const MIN_PASSWORD_LENGTH = 8;

type Method = "magic" | "password";

/**
 * ¿Es la cuenta de quien administra la web?
 *
 * `NEXT_PUBLIC_ADMIN_EMAIL` es aparte de `ADMIN_EMAIL` (`.env.example`): ese
 * segundo es del servidor y decide quién entra en `/vegeta` con su
 * contraseña — nunca llega al navegador, ni falta que hace. Éste sólo decide
 * si se enseña el atajo, así que es público a propósito: literal para que
 * Next lo sustituya en el build, como en `src/lib/flags.ts`.
 *
 * Que aparezca el atajo no mete a nadie en el panel — sigue pidiendo su
 * contraseña, igual que si hubiera escrito la URL a mano.
 */
function esCuentaDelPropietario(email: string): boolean {
  const propietario = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  return Boolean(propietario) && email.trim().toLowerCase() === propietario?.toLowerCase();
}

interface AccountClientProps {
  /** Ruta a la que vuelve el enlace del correo, ya con prefijo de idioma. */
  callbackNext: string;
}

export function AccountClient({ callbackNext }: AccountClientProps) {
  const t = useTranslations("account");
  const session = useSession();
  const searchParams = useSearchParams();

  const linkError = searchParams.get("authError");
  const justConfirmed = searchParams.get("authOk") === "1";
  const isRecovery = searchParams.get("recovery") === "1";

  if (session.status === "loading") {
    return <p className="text-on-surface-muted">{t("loadingTitle")}</p>;
  }

  // El enlace de recuperación deja sesión iniciada; lo único que falta es que
  // elija la contraseña nueva, así que eso manda sobre cualquier otra vista.
  const showRecovery = isRecovery && session.status === "registered";

  return (
    <div className="flex w-full flex-col gap-6">
      {justConfirmed && !showRecovery && session.status === "registered" && (
        <p className="rounded-card bg-brand/10 p-4 text-center font-medium text-on-surface">
          {t("confirmed")}
        </p>
      )}

      {linkError && (
        <p role="alert" className="rounded-card bg-red-50 p-4 text-sm text-red-700">
          <span className="font-semibold">{t("linkError")}</span> {t("linkExpired")}
        </p>
      )}

      {showRecovery ? (
        <RecoveryPanel />
      ) : session.status === "registered" ? (
        <RegisteredPanel email={session.user.email ?? ""} />
      ) : (
        <AuthPanel isGuest={session.status === "guest"} callbackNext={callbackNext} />
      )}
    </div>
  );
}

function RegisteredPanel({ email }: { email: string }) {
  const t = useTranslations("account");
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    setPending(true);
    try {
      await signOut();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-on-surface">
          {t("registeredTitle")}
        </h1>
        <p className="text-on-surface-muted">{t("registeredBody")}</p>
      </div>

      <p className="rounded-card bg-surface-muted px-4 py-3 font-medium text-on-surface">{email}</p>

      <Link
        href="/mis-listas"
        className="h-tap flex items-center rounded-full bg-brand px-6 font-semibold text-brand-contrast"
      >
        {t("myLists")}
      </Link>

      {/* `/vegeta` no lleva prefijo de idioma (fuera de `[locale]`, ver
          `src/proxy.ts`), así que es el `Link` normal de Next y no el de
          next-intl, que intentaría traducir una ruta que no está en su mapa. */}
      {esCuentaDelPropietario(email) && (
        <NextLink href="/vegeta" className="text-sm font-medium text-brand underline">
          {t("adminPanel")}
        </NextLink>
      )}

      <button
        type="button"
        onClick={handleSignOut}
        disabled={pending}
        className="text-sm text-on-surface-muted underline disabled:opacity-50"
      >
        {pending ? t("signingOut") : t("signOut")}
      </button>

      <DisplayNameForm />
      <PreferencesPanel />
      {/* Sólo se pinta para quien paga, y con la Fase 3 apagada ni pregunta
          el plan. Ver src/components/billing/manage-subscription-button.tsx. */}
      <ManageSubscriptionButton />
      <DataExport />
      <DangerZone />
    </div>
  );
}

function DisplayNameForm() {
  const t = useTranslations("account");
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchDisplayName()
      .then((value) => {
        if (active) setName(value);
      })
      .catch(() => {
        // Un fallo al leerlo no debe bloquear el resto de la página: el campo
        // queda vacío y se puede escribir igualmente.
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;

    setPending(true);
    setErrorMessage(null);
    setSaved(false);
    try {
      await updateDisplayName(name);
      setSaved(true);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-sm flex-col gap-2 border-border border-t pt-6 text-left"
    >
      <label htmlFor="display-name" className="font-semibold text-on-surface">
        {t("nameTitle")}
      </label>
      <p className="text-sm text-on-surface-muted">{t("nameHint")}</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="display-name"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setSaved(false);
          }}
          placeholder={t("namePlaceholder")}
          autoComplete="nickname"
          maxLength={40}
          className="h-tap w-full rounded-full border border-border bg-surface px-5 sm:flex-1 text-base text-on-surface outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
        />
        <button
          type="submit"
          disabled={pending}
          className="h-tap shrink-0 rounded-full border border-brand px-5 font-semibold text-brand disabled:opacity-50"
        >
          {pending ? t("nameSaving") : t("nameSave")}
        </button>
      </div>
      {saved && <p className="text-sm text-brand">{t("nameSaved")}</p>}
      {errorMessage && <ErrorLine message={errorMessage} />}
    </form>
  );
}

/**
 * Portabilidad del RGPD sin escribir un correo. La política de privacidad la
 * promete desde el primer día y hasta ahora sólo se podía pedir a mano.
 */
function DataExport() {
  const t = useTranslations("account");
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleExport() {
    if (pending) return;

    setPending(true);
    setErrorMessage(null);
    try {
      downloadExport(await exportMyData());
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="flex w-full max-w-sm flex-col gap-2 border-border border-t pt-6 text-left">
      <h2 className="font-semibold text-on-surface">{t("exportTitle")}</h2>
      <p className="text-sm text-on-surface-muted">{t("exportBody")}</p>
      <button
        type="button"
        onClick={handleExport}
        disabled={pending}
        className="h-tap self-start rounded-full border border-border px-5 font-semibold text-on-surface disabled:opacity-50"
      >
        {pending ? t("exportPending") : t("exportButton")}
      </button>
      {errorMessage && <ErrorLine message={errorMessage} />}
    </section>
  );
}

function DangerZone() {
  const t = useTranslations("account");
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleDelete() {
    if (pending) return;

    setPending(true);
    setErrorMessage(null);
    try {
      await deleteAccount();
      // Tras borrar no queda sesión: recargar deja la página en su estado
      // inicial sin arrastrar nada del usuario que acaba de desaparecer.
      window.location.reload();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
      setPending(false);
    }
  }

  return (
    <section className="flex w-full max-w-sm flex-col gap-2 border-border border-t pt-6 text-left">
      <h2 className="font-semibold text-on-surface">{t("dangerTitle")}</h2>
      <p className="text-sm text-on-surface-muted">{t("dangerBody")}</p>

      {confirming ? (
        <>
          <p className="rounded-card bg-red-50 p-3 text-sm text-red-700">{t("dangerShared")}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={pending}
              className="h-tap rounded-full bg-red-600 px-5 font-semibold text-white disabled:opacity-50"
            >
              {pending ? t("dangerDeleting") : t("dangerConfirm")}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={pending}
              className="h-tap rounded-full border border-border px-5 font-semibold text-on-surface disabled:opacity-50"
            >
              {t("dangerCancel")}
            </button>
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="self-start text-sm text-red-600 underline"
        >
          {t("dangerStart")}
        </button>
      )}

      {errorMessage && <ErrorLine message={errorMessage} />}
    </section>
  );
}

function RecoveryPanel() {
  const t = useTranslations("account");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isValidation, setIsValidation] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;

    if (password.length < MIN_PASSWORD_LENGTH) {
      setErrorMessage(t("passwordTooShort"));
      setIsValidation(true);
      return;
    }

    setPending(true);
    setErrorMessage(null);
    setIsValidation(false);
    try {
      await updatePassword(password);
      setDone(true);
      setPassword("");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="rounded-card bg-brand/10 p-4 font-medium text-on-surface">
          {t("recoveryDone")}
        </p>
        <Link
          href="/mis-listas"
          className="h-tap flex items-center rounded-full bg-brand px-6 font-semibold text-brand-contrast"
        >
          {t("myLists")}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4 text-center">
      <h1 className="text-3xl font-bold tracking-tight text-on-surface">{t("recoveryTitle")}</h1>
      <p className="text-on-surface-muted">{t("recoveryBody")}</p>

      <PasswordField value={password} onChange={setPassword} autoComplete="new-password" />

      <button
        type="submit"
        disabled={!password || pending}
        className="h-tap w-full max-w-sm rounded-full bg-brand px-6 font-semibold text-brand-contrast disabled:opacity-50"
      >
        {pending ? t("recoverySaving") : t("recoverySave")}
      </button>

      {errorMessage && <ErrorLine message={errorMessage} plain={isValidation} />}
    </form>
  );
}

interface AuthPanelProps {
  isGuest: boolean;
  callbackNext: string;
}

function AuthPanel({ isGuest, callbackNext }: AuthPanelProps) {
  const t = useTranslations("account");
  const [method, setMethod] = useState<Method>("magic");

  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-on-surface">
          {isGuest ? t("guestTitle") : t("signedOutTitle")}
        </h1>
        <p className="text-on-surface-muted">
          {isGuest
            ? t("guestBody")
            : method === "magic"
              ? t("signedOutBody")
              : t("signedOutBodyPassword")}
        </p>
      </div>

      {isGuest && (
        <p className="rounded-card bg-brand/10 p-4 text-sm text-on-surface">
          {t("guestKeepsEverything")}
        </p>
      )}

      {/* Arriba y separado: es el camino de un clic, y quien lo quiere no
          tiene que leer nada de lo de abajo. */}
      <GoogleButton isGuest={isGuest} callbackNext={callbackNext} />

      <div className="flex w-full max-w-sm items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-border" />
        <span className="text-sm text-on-surface-muted">{t("or")}</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      {/* Botones de alternancia con `aria-pressed`, no `role="tab"`: sin
          `tabpanel` ni `aria-controls`, los roles de pestaña prometen una
          semántica que no existe y confunden al lector de pantalla. */}
      <fieldset className="flex w-full max-w-sm rounded-full bg-surface-muted p-1">
        <legend className="sr-only">{t("metaTitle")}</legend>
        {(["magic", "password"] as const).map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={method === option}
            onClick={() => setMethod(option)}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              method === option
                ? "bg-surface text-on-surface shadow-sm"
                : "text-on-surface-muted hover:text-on-surface"
            }`}
          >
            {option === "magic" ? t("methodMagic") : t("methodPassword")}
          </button>
        ))}
      </fieldset>

      {method === "magic" ? (
        <MagicLinkForm isGuest={isGuest} callbackNext={callbackNext} />
      ) : (
        <PasswordForm isGuest={isGuest} callbackNext={callbackNext} />
      )}

      {/* Un invitado tiene perfil desde su primera lista y puede comprar en
          pesos igual que cualquiera: las preferencias son de quien usa la app,
          no de quien se registra. Sin sesión no hay perfil que guardar. */}
      {isGuest && <PreferencesPanel />}
    </div>
  );
}

/**
 * Entrar con Google.
 *
 * A un invitado se le enlaza Google **al usuario que ya es** en vez de crearle
 * uno nuevo: si no, sus listas se quedarían en la identidad anterior. Lo
 * resuelve `signInWithGoogle` mirando `isGuest`; aquí sólo hay que pasárselo.
 */
function GoogleButton({ isGuest, callbackNext }: AuthPanelProps) {
  const t = useTranslations("account");
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleClick() {
    if (pending) return;
    setPending(true);
    setErrorMessage(null);
    try {
      // No hay `finally`: si sale bien, el navegador se va a Google y no
      // vuelve a esta función. Reactivar el botón sería para nadie.
      await signInWithGoogle(callbackNext, isGuest);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
      setPending(false);
    }
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="h-tap flex items-center justify-center gap-3 rounded-full border border-border bg-surface px-6 font-semibold text-on-surface disabled:opacity-50"
      >
        <GoogleMark />
        {pending ? t("googlePending") : isGuest ? t("googleLink") : t("googleSignIn")}
      </button>
      {errorMessage && <ErrorLine message={errorMessage} />}
    </div>
  );
}

/** La «G» de Google. Sus colores son marca suya, así que van tal cual. */
function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}

function MagicLinkForm({ isGuest, callbackNext }: AuthPanelProps) {
  const t = useTranslations("account");
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const value = email.trim();
    if (!value || pending) return;

    setPending(true);
    setErrorMessage(null);
    try {
      if (isGuest) {
        await linkEmailToGuestSession(value, callbackNext);
      } else {
        await sendMagicLink(value, callbackNext);
      }
      setSentTo(value);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setPending(false);
    }
  }

  if (sentTo) return <SentNotice email={sentTo} />;

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-3">
      <EmailField value={email} onChange={setEmail} />
      <button
        type="submit"
        disabled={!email.trim() || pending}
        className="h-tap rounded-full bg-brand px-6 font-semibold text-brand-contrast disabled:opacity-50"
      >
        {pending ? t("submitting") : t("submit")}
      </button>
      {errorMessage && <ErrorLine message={errorMessage} />}
    </form>
  );
}

function PasswordForm({ isGuest, callbackNext }: AuthPanelProps) {
  const t = useTranslations("account");
  const [email, setEmail] = useState("");
  const [username, setUsernameValue] = useState("");
  const [password, setPassword] = useState("");
  // Un invitado siempre está creando su cuenta; quien no tiene sesión suele
  // venir a entrar, así que ese es el modo por defecto.
  const [isSignUp, setIsSignUp] = useState(false);
  const [pending, setPending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [resetSentTo, setResetSentTo] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isValidation, setIsValidation] = useState(false);

  const needsNewPassword = isGuest || isSignUp;

  function fallar(mensaje: string) {
    setErrorMessage(mensaje);
    setIsValidation(true);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const value = email.trim();
    if (!value || !password || pending) return;

    if (needsNewPassword && password.length < MIN_PASSWORD_LENGTH) {
      fallar(t("passwordTooShort"));
      return;
    }

    // El usuario es opcional al darse de alta: quien no lo quiera entra con
    // su correo y no se pierde nada. Pero si lo escribe, tiene que valer.
    const alias = username.trim();
    if (needsNewPassword && alias && !isValidUsername(alias)) {
      fallar(t("usernameInvalid"));
      return;
    }

    setPending(true);
    setErrorMessage(null);
    setIsValidation(false);
    try {
      if (needsNewPassword && alias && !(await isUsernameAvailable(alias))) {
        fallar(t("usernameTaken"));
        setPending(false);
        return;
      }

      if (isGuest) {
        await linkPasswordToGuestSession(value, password, callbackNext);
        // Ya hay sesión —es el invitado de siempre—, así que el nombre se
        // escribe directamente en su perfil en vez de viajar en el alta.
        if (alias) await setUsername(alias);
        setSentTo(value);
      } else if (isSignUp) {
        if (alias) {
          await signUpWithUsername(alias, value, password, callbackNext);
        } else {
          await signUpWithPassword(value, password, callbackNext);
        }
        setSentTo(value);
      } else if (looksLikeEmail(value)) {
        // Al entrar con contraseña la sesión queda lista aquí mismo; el estado
        // de sesión lo recoge `onAuthStateChange` y la vista cambia sola.
        await signInWithPassword(value, password);
      } else {
        await signInWithUsername(value, password);
      }
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : String(err);
      // Los dos que la ruta y la base de datos devuelven en clave, no en
      // castellano: aquí es donde se traducen a algo legible.
      if (mensaje === "username_taken") fallar(t("usernameTaken"));
      else if (mensaje === "credenciales_invalidas") fallar(t("badCredentials"));
      else setErrorMessage(mensaje);
    } finally {
      setPending(false);
    }
  }

  async function handleReset() {
    const value = email.trim();
    if (!value || pending) return;

    // El enlace de recuperación va por correo, así que hace falta el correo:
    // con el nombre de usuario no hay a dónde mandarlo, y decirlo es mejor
    // que mandar la petición y esperar un error de Supabase en inglés.
    if (!looksLikeEmail(value)) {
      fallar(t("resetNeedsEmail"));
      return;
    }

    setPending(true);
    setErrorMessage(null);
    try {
      await sendPasswordReset(value, `${callbackNext}?recovery=1`);
      setResetSentTo(value);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setPending(false);
    }
  }

  if (sentTo) return <SentNotice email={sentTo} />;

  if (resetSentTo) {
    return (
      <div className="flex flex-col items-center gap-3">
        <h2 className="text-xl font-bold text-on-surface">{t("resetSentTitle")}</h2>
        <p className="text-on-surface-muted">{t("resetSentBody", { email: resetSentTo })}</p>
        <p className="text-sm text-on-surface-muted">{t("sentSpam")}</p>
      </div>
    );
  }

  const submitLabel = isGuest
    ? pending
      ? t("guestSaving")
      : t("guestSave")
    : isSignUp
      ? pending
        ? t("signingUp")
        : t("signUp")
      : pending
        ? t("signingIn")
        : t("signIn");

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-3">
      {/* Al darse de alta, el usuario va primero: es lo que la mayoría viene
          a elegir. Al entrar no existe como campo aparte — el de abajo acepta
          las dos cosas y se distinguen por la arroba. */}
      {needsNewPassword && <UsernameField value={username} onChange={setUsernameValue} />}

      <EmailField value={email} onChange={setEmail} loginConUsuario={!needsNewPassword} />
      <PasswordField
        value={password}
        onChange={setPassword}
        autoComplete={needsNewPassword ? "new-password" : "current-password"}
      />

      {needsNewPassword && (
        <p className="text-left text-xs text-on-surface-muted">
          {isGuest ? t("guestPasswordHint") : t("passwordHint")}
        </p>
      )}

      <button
        type="submit"
        disabled={!email.trim() || !password || pending}
        className="h-tap rounded-full bg-brand px-6 font-semibold text-brand-contrast disabled:opacity-50"
      >
        {submitLabel}
      </button>

      {errorMessage && <ErrorLine message={errorMessage} plain={isValidation} />}

      {!isGuest && (
        <div className="flex flex-col gap-1 text-sm">
          <button
            type="button"
            onClick={() => {
              setIsSignUp((current) => !current);
              setErrorMessage(null);
            }}
            className="text-brand underline"
          >
            {isSignUp ? t("hasAccount") : t("noAccount")}
          </button>
          {!isSignUp && (
            <button
              type="button"
              onClick={handleReset}
              disabled={pending || !email.trim()}
              className="text-on-surface-muted underline disabled:opacity-50"
            >
              {t("forgot")}
            </button>
          )}
        </div>
      )}
    </form>
  );
}

function SentNotice({ email }: { email: string }) {
  const t = useTranslations("account");

  return (
    <div className="flex flex-col items-center gap-3">
      <h2 className="text-xl font-bold text-on-surface">{t("sentTitle")}</h2>
      <p className="text-on-surface-muted">{t("sentBody", { email })}</p>
      <p className="text-sm text-on-surface-muted">{t("sentSpam")}</p>
    </div>
  );
}

/**
 * El campo de identidad.
 *
 * Al entrar acepta las dos cosas —correo o usuario— en un solo campo: obligar
 * a acertar la pestaña antes de escribir es un paso de más para algo que se
 * distingue por la arroba. Al darse de alta es el correo y sólo el correo, y
 * ahí `type="email"` saca el teclado con arroba y valida de balde.
 */
function EmailField({
  value,
  onChange,
  loginConUsuario,
}: {
  value: string;
  onChange: (value: string) => void;
  loginConUsuario?: boolean;
}) {
  const t = useTranslations("account");

  return (
    <>
      <label htmlFor="account-email" className="sr-only">
        {loginConUsuario ? t("identifierLabel") : t("emailLabel")}
      </label>
      <input
        id="account-email"
        type={loginConUsuario ? "text" : "email"}
        required
        autoComplete={loginConUsuario ? "username" : "email"}
        autoCapitalize="none"
        spellCheck={false}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={loginConUsuario ? t("identifierPlaceholder") : t("emailPlaceholder")}
        className="h-tap rounded-full border border-border bg-surface px-5 text-base text-on-surface outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
      />
    </>
  );
}

/** El nombre de usuario al darse de alta. Opcional: quien no lo quiera entra
 *  con su correo y no se pierde nada. */
function UsernameField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const t = useTranslations("account");

  return (
    <>
      <label htmlFor="account-username" className="sr-only">
        {t("usernameLabel")}
      </label>
      <input
        id="account-username"
        type="text"
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        maxLength={USERNAME_MAX}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={t("usernamePlaceholder")}
        aria-describedby="account-username-hint"
        className="h-tap rounded-full border border-border bg-surface px-5 text-base text-on-surface outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
      />
      <p id="account-username-hint" className="text-left text-xs text-on-surface-muted">
        {t("usernameHint")}
      </p>
    </>
  );
}

function PasswordField({
  value,
  onChange,
  autoComplete,
}: {
  value: string;
  onChange: (value: string) => void;
  autoComplete: "new-password" | "current-password";
}) {
  const t = useTranslations("account");

  return (
    <>
      <label htmlFor="account-password" className="sr-only">
        {t("passwordLabel")}
      </label>
      <input
        id="account-password"
        type="password"
        required
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={
          autoComplete === "new-password"
            ? t("passwordPlaceholder")
            : t("passwordPlaceholderExisting")
        }
        className="h-tap w-full max-w-sm rounded-full border border-border bg-surface px-5 text-base text-on-surface outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
      />
    </>
  );
}

/**
 * `plain` distingue lo que ya está escrito para la persona (una validación
 * nuestra, traducida) de lo que viene crudo de Supabase, que necesita una
 * frase delante para no aparecer suelto y en inglés.
 */
function ErrorLine({ message, plain }: { message: string; plain?: boolean }) {
  const t = useTranslations("account");

  return (
    <p role="alert" className="text-sm text-red-600">
      {plain ? (
        message
      ) : (
        <>
          {t("genericError")} <span className="text-red-500/80">({message})</span>
        </>
      )}
    </p>
  );
}

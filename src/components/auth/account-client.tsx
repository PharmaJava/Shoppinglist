"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  linkEmailToGuestSession,
  linkPasswordToGuestSession,
  sendMagicLink,
  sendPasswordReset,
  signInWithPassword,
  signOut,
  signUpWithPassword,
  updatePassword,
} from "@/features/auth/api";
import { useSession } from "@/features/auth/use-session";
import { Link } from "@/i18n/navigation";

/** Mínimo propio, por encima del de Supabase (6): 8 es el suelo razonable hoy
 *  y comprobarlo antes evita un viaje de red para un error evitable. */
const MIN_PASSWORD_LENGTH = 8;

type Method = "magic" | "password";

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

      <button
        type="button"
        onClick={handleSignOut}
        disabled={pending}
        className="text-sm text-on-surface-muted underline disabled:opacity-50"
      >
        {pending ? t("signingOut") : t("signOut")}
      </button>
    </div>
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
    </div>
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

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const value = email.trim();
    if (!value || !password || pending) return;

    if (needsNewPassword && password.length < MIN_PASSWORD_LENGTH) {
      setErrorMessage(t("passwordTooShort"));
      setIsValidation(true);
      return;
    }

    setPending(true);
    setErrorMessage(null);
    setIsValidation(false);
    try {
      if (isGuest) {
        await linkPasswordToGuestSession(value, password, callbackNext);
        setSentTo(value);
      } else if (isSignUp) {
        await signUpWithPassword(value, password, callbackNext);
        setSentTo(value);
      } else {
        // Al entrar con contraseña la sesión queda lista aquí mismo; el estado
        // de sesión lo recoge `onAuthStateChange` y la vista cambia sola.
        await signInWithPassword(value, password);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setPending(false);
    }
  }

  async function handleReset() {
    const value = email.trim();
    if (!value || pending) return;

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
      <EmailField value={email} onChange={setEmail} />
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

function EmailField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const t = useTranslations("account");

  return (
    <>
      <label htmlFor="account-email" className="sr-only">
        {t("emailLabel")}
      </label>
      <input
        id="account-email"
        type="email"
        required
        autoComplete="email"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={t("emailPlaceholder")}
        className="h-tap rounded-full border border-border bg-surface px-5 text-base text-on-surface outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
      />
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

"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { linkEmailToGuestSession, sendMagicLink, signOut } from "@/features/auth/api";
import { useSession } from "@/features/auth/use-session";
import { Link } from "@/i18n/navigation";

interface AccountClientProps {
  /** Ruta a la que vuelve el enlace del correo, ya con prefijo de idioma. */
  callbackNext: string;
}

export function AccountClient({ callbackNext }: AccountClientProps) {
  const t = useTranslations("account");
  const session = useSession();
  const searchParams = useSearchParams();

  const [sentTo, setSentTo] = useState<string | null>(null);
  const linkError = searchParams.get("authError");
  const justConfirmed = searchParams.get("authOk") === "1";

  if (session.status === "loading") {
    return <p className="text-on-surface-muted">{t("loadingTitle")}</p>;
  }

  return (
    <div className="flex w-full flex-col gap-6">
      {justConfirmed && session.status === "registered" && (
        <p className="rounded-card bg-brand/10 p-4 text-center font-medium text-on-surface">
          {t("confirmed")}
        </p>
      )}

      {linkError && (
        <p role="alert" className="rounded-card bg-red-50 p-4 text-sm text-red-700">
          <span className="font-semibold">{t("linkError")}</span> {t("linkExpired")}
        </p>
      )}

      {session.status === "registered" ? (
        <RegisteredPanel email={session.user.email ?? ""} />
      ) : (
        <EmailPanel
          // El invitado convierte su identidad para no perder sus listas; quien
          // no tiene ninguna sesión simplemente entra o se da de alta.
          isGuest={session.status === "guest"}
          callbackNext={callbackNext}
          sentTo={sentTo}
          onSent={setSentTo}
        />
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
        href="/"
        className="h-tap flex items-center rounded-full bg-brand px-6 font-semibold text-brand-contrast"
      >
        {t("cta")}
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

interface EmailPanelProps {
  isGuest: boolean;
  callbackNext: string;
  sentTo: string | null;
  onSent: (email: string) => void;
}

function EmailPanel({ isGuest, callbackNext, sentTo, onSent }: EmailPanelProps) {
  const t = useTranslations("account");
  const [email, setEmail] = useState("");
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
      onSent(value);
    } catch (err) {
      console.error("No se pudo enviar el enlace de acceso:", err);
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setPending(false);
    }
  }

  if (sentTo) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-on-surface">{t("sentTitle")}</h1>
        <p className="text-on-surface-muted">{t("sentBody", { email: sentTo })}</p>
        <p className="text-sm text-on-surface-muted">{t("sentSpam")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-on-surface">
          {isGuest ? t("guestTitle") : t("signedOutTitle")}
        </h1>
        <p className="text-on-surface-muted">{isGuest ? t("guestBody") : t("signedOutBody")}</p>
      </div>

      {isGuest && (
        <p className="rounded-card bg-brand/10 p-4 text-sm text-on-surface">
          {t("guestKeepsEverything")}
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-3">
        <label htmlFor="account-email" className="sr-only">
          {t("emailLabel")}
        </label>
        <input
          id="account-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={t("emailPlaceholder")}
          className="h-tap rounded-full border border-border bg-surface px-5 text-base text-on-surface outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
        />
        <button
          type="submit"
          disabled={!email.trim() || pending}
          className="h-tap rounded-full bg-brand px-6 font-semibold text-brand-contrast disabled:opacity-50"
        >
          {pending ? t("submitting") : t("submit")}
        </button>
      </form>

      {errorMessage && (
        <p role="alert" className="text-sm text-red-600">
          {t("error")} <span className="text-red-500/80">({errorMessage})</span>
        </p>
      )}
    </div>
  );
}

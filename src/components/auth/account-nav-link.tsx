"use client";

import { useTranslations } from "next-intl";
import { useSession } from "@/features/auth/use-session";
import { Link } from "@/i18n/navigation";

/**
 * Enlace de cuenta del header. Un invitado ve «Iniciar sesión» igual que quien
 * no tiene sesión: técnicamente tiene identidad, pero para él no es una cuenta
 * todavía y decirle lo contrario sería confuso.
 *
 * Mientras carga el estado mantiene el texto de invitado en vez de un esqueleto:
 * es lo que verá la mayoría, y evita que el botón cambie de ancho al hidratar.
 */
export function AccountNavLink() {
  const t = useTranslations("nav");
  const session = useSession();
  const label = session.status === "registered" ? t("account") : t("login");
  // Sólo tiene sentido enseñar «Mis listas» a quien ya tiene alguna, y tener
  // sesión —aunque sea de invitado— es la señal de que ha creado al menos una.
  const hasLists = session.status === "guest" || session.status === "registered";

  return (
    <>
      {hasLists && (
        <Link
          href="/mis-listas"
          className="hidden whitespace-nowrap text-sm text-on-surface-muted hover:text-on-surface sm:inline"
        >
          {t("myLists")}
        </Link>
      )}
      <Link
        href="/cuenta"
        className="shrink-0 whitespace-nowrap rounded-full border border-brand px-4 py-1.5 text-sm font-semibold text-brand transition-colors hover:bg-brand hover:text-brand-contrast"
      >
        {label}
      </Link>
    </>
  );
}

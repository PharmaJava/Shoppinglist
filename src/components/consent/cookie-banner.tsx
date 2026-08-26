"use client";

import { useTranslations } from "next-intl";
import { useConsent } from "@/features/consent/use-consent";
import { Link } from "@/i18n/navigation";

/**
 * La pregunta sobre la medición.
 *
 * Tres cosas que lo separan del banner de cookies corriente:
 *
 * 1. **«Rechazar» está al mismo nivel que «Aceptar».** No es estética: la ley
 *    exige que negarse cueste lo mismo que aceptar, y esconder el «no» detrás
 *    de un «configurar» en gris es lo que multan.
 * 2. **No bloquea la web.** No hay velo negro ni pantalla secuestrada: la
 *    lista se puede usar sin contestar. Lo único que hay en juego es una
 *    medición agregada, no el servicio.
 * 3. **Decir que no apaga algo de verdad.** Ver `Measurement`: sin permiso,
 *    los scripts de Vercel no se cargan.
 */
export function CookieBanner() {
  const t = useTranslations("consent");
  const { consent, cargando, aceptar, rechazar } = useConsent();

  // Mientras se lee no se pinta nada: enseñarlo y quitarlo medio segundo
  // después es el parpadeo que hace que una web parezca rota.
  if (cargando || consent) return null;

  return (
    // `<section>` con nombre —que ya es una región para el lector de
    // pantalla— y no un `dialog`: esto no atrapa el foco ni bloquea la
    // página, así que anunciarlo como diálogo sería prometer lo que no hace.
    <section
      aria-label={t("title")}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface-raised px-4 py-4 shadow-[0_-4px_16px_-8px_rgb(0_0_0/0.25)] print:hidden"
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 sm:flex-row sm:items-center">
        <p className="flex-1 text-sm text-on-surface">
          {t("body")}{" "}
          <Link href="/privacidad" className="text-brand underline">
            {t("more")}
          </Link>
        </p>

        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={rechazar}
            className="h-11 flex-1 rounded-full border border-border px-5 font-semibold text-on-surface sm:flex-none"
          >
            {t("reject")}
          </button>
          <button
            type="button"
            onClick={aceptar}
            className="h-11 flex-1 rounded-full bg-brand px-5 font-semibold text-brand-contrast sm:flex-none"
          >
            {t("accept")}
          </button>
        </div>
      </div>
    </section>
  );
}

/**
 * El enlace del pie para cambiar de opinión.
 *
 * Retirar el permiso tiene que ser tan fácil como darlo, y eso significa que
 * tiene que estar **siempre** a la vista, no sólo la primera vez. Enseña en
 * qué quedó la cosa, así que además responde a «¿yo qué le di?».
 */
export function ConsentFooterLink({ className }: { className?: string }) {
  const t = useTranslations("consent");
  const { consent, cargando, aceptar, rechazar } = useConsent();

  if (cargando) return null;

  const concedido = consent?.measurement === "granted";

  return (
    <button type="button" onClick={concedido ? rechazar : aceptar} className={className}>
      {consent ? (concedido ? t("footerOn") : t("footerOff")) : t("footerUndecided")}
    </button>
  );
}

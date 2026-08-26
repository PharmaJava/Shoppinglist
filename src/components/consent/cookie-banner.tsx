"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { ASKED_CATEGORIES, type ConsentCategory } from "@/features/consent/categories";
import { CONSENT_OPEN_EVENT, isGranted } from "@/features/consent/consent";
import { useConsent } from "@/features/consent/use-consent";
import { Link } from "@/i18n/navigation";

/**
 * El aviso sobre lo que no es imprescindible.
 *
 * Cuatro cosas lo separan del banner de cookies corriente:
 *
 * 1. **«No» está al mismo nivel que «Sí».** No es estética: la ley exige que
 *    negarse cueste lo mismo que aceptar, y esconder el «no» detrás de un
 *    «configurar» en gris es lo que se sanciona.
 * 2. **No bloquea la web.** No hay velo negro ni pantalla secuestrada: la
 *    lista se puede usar sin contestar. Lo que está en juego es una medición,
 *    no el servicio.
 * 3. **Decir que no apaga algo de verdad** (ver `Measurement`).
 * 4. **Se puede elegir por separado** en cuanto hay más de una cosa que
 *    preguntar. Con una sola —como hoy— ese botón no aparece: un «elegir»
 *    que lleva a una única casilla es un paso de más.
 */
export function CookieBanner() {
  const t = useTranslations("consent");
  const { consent, cargando, aceptarTodo, rechazarTodo, guardarEleccion } = useConsent();
  const [abiertoAMano, setAbiertoAMano] = useState(false);
  const [eligiendo, setEligiendo] = useState(false);

  // El enlace del pie lo vuelve a abrir cuando ya se había contestado.
  useEffect(() => {
    const abrir = () => {
      setAbiertoAMano(true);
      setEligiendo(true);
    };

    window.addEventListener(CONSENT_OPEN_EVENT, abrir);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, abrir);
  }, []);

  // Mientras se lee no se pinta nada: enseñarlo y quitarlo medio segundo
  // después es el parpadeo que hace que una web parezca rota.
  if (cargando) return null;
  if (consent && !abiertoAMano) return null;

  function cerrar() {
    setAbiertoAMano(false);
    setEligiendo(false);
  }

  const hayVariasCosas = ASKED_CATEGORIES.length > 1;

  return (
    // `<section>` con nombre —que ya es una región para el lector de
    // pantalla— y no un `dialog`: esto no atrapa el foco ni bloquea la
    // página, así que anunciarlo como diálogo sería prometer lo que no hace.
    <section
      aria-label={t("title")}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface-raised px-4 py-4 shadow-[0_-4px_16px_-8px_rgb(0_0_0/0.25)] print:hidden"
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <p className="flex-1 text-sm text-on-surface">
            {t("body")}{" "}
            <Link href="/privacidad" className="text-brand underline">
              {t("more")}
            </Link>
          </p>

          <div className="flex shrink-0 flex-wrap gap-2">
            {hayVariasCosas && !eligiendo && (
              <button
                type="button"
                onClick={() => setEligiendo(true)}
                className="h-11 rounded-full border border-border px-5 font-semibold text-on-surface"
              >
                {t("choose")}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                rechazarTodo();
                cerrar();
              }}
              className="h-11 flex-1 rounded-full border border-border px-5 font-semibold text-on-surface sm:flex-none"
            >
              {t("reject")}
            </button>
            <button
              type="button"
              onClick={() => {
                aceptarTodo();
                cerrar();
              }}
              className="h-11 flex-1 rounded-full bg-brand px-5 font-semibold text-brand-contrast sm:flex-none"
            >
              {hayVariasCosas ? t("acceptAll") : t("accept")}
            </button>
          </div>
        </div>

        {eligiendo && (
          <ChoicePanel
            consent={consent}
            onGuardar={(elecciones) => {
              guardarEleccion(elecciones);
              cerrar();
            }}
          />
        )}
      </div>
    </section>
  );
}

/**
 * Una casilla por cada cosa que se pregunta.
 *
 * Todas empiezan **apagadas** salvo las que ya estuvieran concedidas: el
 * consentimiento no se presupone, y una casilla marcada de fábrica no es
 * consentimiento válido por mucho que la persona pueda desmarcarla.
 */
function ChoicePanel({
  consent,
  onGuardar,
}: {
  consent: Parameters<typeof isGranted>[0];
  onGuardar: (elecciones: Partial<Record<ConsentCategory, boolean>>) => void;
}) {
  const t = useTranslations("consent");
  const [elecciones, setElecciones] = useState<Partial<Record<ConsentCategory, boolean>>>(() =>
    Object.fromEntries(ASKED_CATEGORIES.map((c) => [c, isGranted(consent, c)])),
  );

  return (
    <div className="flex flex-col gap-3 border-border border-t pt-3">
      <fieldset className="flex flex-col gap-3">
        <legend className="sr-only">{t("title")}</legend>

        <label className="flex items-start gap-3 text-sm text-on-surface-muted">
          <input type="checkbox" checked disabled className="mt-1 size-4 shrink-0" />
          <span>
            <span className="font-semibold text-on-surface">{t("necessaryTitle")}</span>{" "}
            {t("necessaryBody")}
          </span>
        </label>

        {ASKED_CATEGORIES.map((categoria) => (
          <label key={categoria} className="flex items-start gap-3 text-sm text-on-surface-muted">
            <input
              type="checkbox"
              checked={elecciones[categoria] ?? false}
              onChange={(event) =>
                setElecciones((actuales) => ({ ...actuales, [categoria]: event.target.checked }))
              }
              className="mt-1 size-4 shrink-0"
            />
            <span>
              <span className="font-semibold text-on-surface">{t(`${categoria}Title`)}</span>{" "}
              {t(`${categoria}Body`)}
            </span>
          </label>
        ))}
      </fieldset>

      <button
        type="button"
        onClick={() => onGuardar(elecciones)}
        className="h-11 self-start rounded-full border border-brand px-5 font-semibold text-brand"
      >
        {t("save")}
      </button>
    </div>
  );
}

/**
 * El enlace del pie para cambiar de opinión.
 *
 * Retirar el permiso tiene que ser tan fácil como darlo, y eso significa que
 * tiene que estar **siempre** a la vista, no sólo la primera vez. Dice además
 * en qué quedó la cosa, así que responde a «¿yo qué le di?».
 */
export function ConsentFooterLink({ className }: { className?: string }) {
  const t = useTranslations("consent");
  const { consent, cargando } = useConsent();

  if (cargando) return null;

  const concedidas = ASKED_CATEGORIES.filter((categoria) => isGranted(consent, categoria)).length;

  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(CONSENT_OPEN_EVENT))}
      className={className}
    >
      {!consent
        ? t("footerUndecided")
        : concedidas === 0
          ? t("footerOff")
          : concedidas === ASKED_CATEGORIES.length
            ? t("footerOn")
            : t("footerPartial")}
    </button>
  );
}

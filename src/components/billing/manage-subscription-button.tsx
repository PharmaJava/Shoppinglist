"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { usePlan } from "@/features/billing/use-plan";

/**
 * «Gestionar la suscripción»: lleva al portal de Stripe.
 *
 * Sólo aparece para quien paga. Y no hace falta comprobar aquí si tiene
 * cliente en Stripe: si no lo tuviera, la ruta responde que no hay
 * suscripción y se dice; preguntarlo antes sería un viaje de red en cada
 * carga de la cuenta para casi nadie.
 */
export function ManageSubscriptionButton() {
  const t = useTranslations("billing");
  const { plan, cargando, premiumVisible } = usePlan();
  const [yendo, setYendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!premiumVisible || cargando || plan !== "premium") return null;

  async function gestionar() {
    if (yendo) return;
    setYendo(true);
    setError(null);

    try {
      const respuesta = await fetch("/api/stripe/portal", { method: "POST" });
      const datos = (await respuesta.json()) as { url?: string };

      if (!datos.url) {
        setError(t("error"));
        setYendo(false);
        return;
      }
      window.location.href = datos.url;
    } catch {
      setError(t("error"));
      setYendo(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={gestionar}
        disabled={yendo}
        className="h-tap flex items-center justify-center rounded-full border border-border px-6 font-medium text-on-surface disabled:opacity-50"
      >
        {yendo ? t("going") : t("manage")}
      </button>
      <p className="text-xs text-on-surface-muted">{t("manageHint")}</p>
      {error && (
        <p role="alert" className="text-sm text-on-surface-muted">
          {error}
        </p>
      )}
    </div>
  );
}

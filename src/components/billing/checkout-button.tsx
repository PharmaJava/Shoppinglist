"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { usePlan } from "@/features/billing/use-plan";
import { Link, useRouter } from "@/i18n/navigation";

/**
 * El botón de hacerse premium.
 *
 * `disponible` lo decide el servidor: es `true` sólo si la Fase 3 está
 * encendida **y** Stripe tiene sus claves. Mientras no lo esté, aquí no se
 * pinta nada y la página de precios sigue diciendo que todavía no hay forma
 * de pagar, que es la verdad.
 *
 * Quien ya paga ve un enlace a su cuenta en vez del botón: ofrecerle pagar
 * otra vez es la forma más rápida de que alguien acabe con dos suscripciones.
 */
export function CheckoutButton({ disponible }: { disponible: boolean }) {
  const t = useTranslations("billing");
  const router = useRouter();
  const { plan, cargando, premiumVisible } = usePlan();
  const [yendo, setYendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!disponible || !premiumVisible || cargando) return null;

  if (plan === "premium") {
    return (
      <Link href="/cuenta" className="font-medium text-brand underline">
        {t("alreadyPremium")}
      </Link>
    );
  }

  async function pagar() {
    if (yendo) return;
    setYendo(true);
    setError(null);

    try {
      const respuesta = await fetch("/api/stripe/checkout", { method: "POST" });
      const datos = (await respuesta.json()) as { url?: string; error?: string };

      /**
       * Sin sesión no hay a quién cobrarle: se manda a la cuenta a entrar, y
       * al volver el botón ya funciona.
       *
       * Por el router de next-intl y no con la URL a mano: estaba escrito
       * `/es/cuenta`, que a quien tiene la web en inglés lo sacaba de su idioma
       * a mitad de un pago.
       */
      if (respuesta.status === 401) {
        router.push("/cuenta");
        return;
      }
      if (!datos.url) {
        setError(t("error"));
        setYendo(false);
        return;
      }

      // Fuera de la aplicación, a Stripe: no es una navegación del router.
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
        onClick={pagar}
        disabled={yendo}
        className="h-tap flex items-center justify-center rounded-full bg-brand px-6 font-semibold text-brand-contrast disabled:opacity-50"
      >
        {yendo ? t("going") : t("subscribe")}
      </button>
      {error && (
        <p role="alert" className="text-sm text-on-surface-muted">
          {error}
        </p>
      )}
    </div>
  );
}

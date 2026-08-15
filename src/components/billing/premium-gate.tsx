"use client";

import type { ReactNode } from "react";
import { usePlan } from "@/features/billing/use-plan";
import { Link } from "@/i18n/navigation";

/**
 * Envuelve lo que es de pago.
 *
 * Tres estados y ninguno más:
 *
 * - **Interruptor apagado** (`NEXT_PUBLIC_FEATURE_PREMIUM` sin poner): no se
 *   pinta nada. Ni la función, ni la pared, ni la mención de que existe. Es el
 *   estado en el que va a producción mientras la Fase 3 esté sin terminar.
 * - **Interruptor encendido y plan gratuito**: se ve la pared, con lo que se
 *   consigue y un enlace a precios.
 * - **Premium**: la función.
 *
 * Que esto se pueda saltar manipulando el navegador **no importa**: lo que hay
 * detrás está protegido por RLS y por `require_premium()` en el servidor
 * (migración 0010). Aquí sólo se decide qué se enseña.
 */
export function PremiumGate({
  titulo,
  descripcion,
  cta,
  children,
}: {
  titulo: string;
  descripcion: string;
  cta: string;
  children: ReactNode;
}) {
  const { plan, cargando, premiumVisible } = usePlan();

  if (!premiumVisible) return null;
  // Sin esto se vería un parpadeo de la pared antes de saber el plan, que a
  // quien ya paga le dice «esto no es tuyo» durante medio segundo.
  if (cargando) return null;
  if (plan === "premium") return <>{children}</>;

  return (
    <section className="flex flex-col items-start gap-3 rounded-card border border-brand/30 bg-brand/5 p-5">
      <span className="rounded-full bg-brand px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-brand-contrast">
        Premium
      </span>
      <div>
        <h2 className="font-semibold text-on-surface">{titulo}</h2>
        <p className="text-sm text-on-surface-muted">{descripcion}</p>
      </div>
      <Link
        href="/precios"
        className="h-tap flex items-center rounded-full bg-brand px-5 font-semibold text-brand-contrast"
      >
        {cta}
      </Link>
    </section>
  );
}

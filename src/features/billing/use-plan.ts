"use client";

import { useEffect, useState } from "react";
import { PREMIUM_VISIBLE } from "@/lib/flags";
import type { Plan } from "@/lib/supabase/types";
import { fetchPlan } from "./plan";

export interface EstadoPlan {
  plan: Plan;
  cargando: boolean;
  /** ¿Se le puede ofrecer premium a esta persona? */
  premiumVisible: boolean;
}

/**
 * Con el interruptor apagado no se pregunta el plan siquiera: se devuelve
 * 'free' y no hay viaje de red. Mientras la Fase 3 esté oculta, nadie debería
 * ver una consulta a `profiles` que no sirve para nada.
 */
export function usePlan(): EstadoPlan {
  const [plan, setPlan] = useState<Plan>("free");
  const [cargando, setCargando] = useState(PREMIUM_VISIBLE);

  useEffect(() => {
    if (!PREMIUM_VISIBLE) return;

    let vivo = true;
    fetchPlan()
      .then((valor) => {
        if (vivo) setPlan(valor);
      })
      .catch(() => {
        // Sin plan legible se trata como gratuito: equivocarse hacia el lado
        // que no regala funciones de pago.
      })
      .finally(() => {
        if (vivo) setCargando(false);
      });

    return () => {
      vivo = false;
    };
  }, []);

  return { plan, cargando, premiumVisible: PREMIUM_VISIBLE };
}

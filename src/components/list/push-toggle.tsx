"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  disablePush,
  enablePush,
  hasPushSubscription,
  pushPermission,
} from "@/features/push/subscribe";
import type { Locale } from "@/lib/supabase/types";

/**
 * Activar o desactivar los avisos en este dispositivo.
 *
 * Vive en la hoja de compartir a propósito: los avisos sólo tienen sentido
 * cuando hay alguien más en la lista, y es ahí donde uno piensa en eso.
 *
 * No aparece si el navegador no puede —Safari en iOS sólo permite push con la
 * aplicación instalada— ni si falta la clave VAPID: un interruptor que no
 * hace nada es peor que no tenerlo.
 */
export function PushToggle() {
  const t = useTranslations("push");
  const locale = useLocale() as Locale;
  const [state, setState] = useState<"loading" | "off" | "on" | "denied" | "unsupported">(
    "loading",
  );
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const permission = pushPermission();
    if (permission === "unsupported") {
      setState("unsupported");
      return;
    }
    if (permission === "denied") {
      setState("denied");
      return;
    }
    hasPushSubscription()
      .then((active) => setState(active ? "on" : "off"))
      .catch(() => setState("off"));
  }, []);

  async function toggle() {
    setPending(true);
    try {
      if (state === "on") {
        await disablePush();
        setState("off");
      } else {
        setState((await enablePush(locale)) ? "on" : "denied");
      }
    } catch {
      setState("off");
    } finally {
      setPending(false);
    }
  }

  if (state === "loading" || state === "unsupported") return null;

  // Denegado sólo se arregla desde los ajustes del navegador: ofrecer el botón
  // otra vez llevaría a un diálogo que ya no aparece.
  if (state === "denied") {
    return (
      <p className="mt-4 border-border border-t pt-4 text-on-surface-muted text-xs">
        {t("denied")}
      </p>
    );
  }

  return (
    <div className="mt-4 flex items-center justify-between gap-3 border-border border-t pt-4">
      <span className="text-on-surface text-sm">{t("label")}</span>
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-pressed={state === "on"}
        className="rounded-full border border-border px-4 py-1.5 font-medium text-on-surface text-sm aria-pressed:border-brand aria-pressed:bg-brand/10 disabled:opacity-50"
      >
        {state === "on" ? t("on") : t("off")}
      </button>
    </div>
  );
}

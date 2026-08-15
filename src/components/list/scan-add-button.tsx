"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { usePlan } from "@/features/billing/use-plan";
import { ScanSheet } from "./scan-sheet";

/**
 * El botón de escanear, al lado del micrófono.
 *
 * Aquí no se usa `<PremiumGate>` y es a propósito: la pared de pago es una
 * tarjeta con título, explicación y enlace a precios, y eso no cabe en una
 * fila de botones redondos —la barra de añadir se rompería—. En una barra, lo
 * que corresponde es no estar: igual que el micrófono no aparece en los
 * navegadores que no entienden de voz. Quien no paga se entera en `/precios`,
 * que es donde se cuenta lo que trae Premium.
 *
 * Con la Fase 3 apagada `usePlan` devuelve `premiumVisible: false` sin
 * consultar nada, así que esto no existe ni hace una sola petición.
 */
export function ScanAddButton({ listId }: { listId: string }) {
  const t = useTranslations("barcode");
  const { plan, cargando, premiumVisible } = usePlan();
  const [abierto, setAbierto] = useState(false);

  if (!premiumVisible || cargando || plan !== "premium") return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        aria-label={t("scan")}
        className="flex size-tap shrink-0 items-center justify-center rounded-full border border-border text-xl text-on-surface-muted"
      >
        🔎
      </button>
      {abierto && <ScanSheet listId={listId} onCerrar={() => setAbierto(false)} />}
    </>
  );
}

"use client";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { isGranted } from "@/features/consent/consent";
import { useConsent } from "@/features/consent/use-consent";
import { GoogleAnalytics } from "./google-analytics";

/**
 * Lo que sólo se carga con permiso.
 *
 * Esto es lo que convierte el aviso en una pregunta de verdad y no en un
 * trámite: sin permiso, estos componentes **no se montan**, así que sus
 * scripts no se descargan y no se manda un solo dato. Un aviso cuyo «no» no
 * apaga nada es peor que no tener aviso, porque además miente.
 *
 * Cada categoría, por su cuenta: se puede decir que sí a la medición de
 * Vercel y que no a Google, y entonces se carga una y no la otra. Un único
 * interruptor para dos cosas distintas obliga a tragar con la que no se
 * quiere.
 *
 * Mientras no haya contestado no se carga nada: quien todavía no ha dicho que
 * sí, no ha dicho que sí.
 */
export function Measurement() {
  const { consent } = useConsent();

  return (
    <>
      {isGranted(consent, "measurement") && (
        <>
          <Analytics />
          <SpeedInsights />
        </>
      )}
      <GoogleAnalytics />
    </>
  );
}

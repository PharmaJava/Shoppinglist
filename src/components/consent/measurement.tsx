"use client";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { useConsent } from "@/features/consent/use-consent";

/**
 * La medición de Vercel, sólo con permiso.
 *
 * Esto es lo que convierte el banner en una pregunta de verdad y no en un
 * trámite: sin permiso, estos dos componentes **no se montan**, así que sus
 * scripts no se descargan y no se manda un solo dato. Un banner cuyo «no» no
 * apaga nada es peor que no tener banner, porque además miente.
 *
 * Ninguno de los dos usa cookies —de ahí que la política de privacidad diga,
 * y siga siendo verdad, que aquí no hay cookies de seguimiento—. Se pregunta
 * igual porque se puede apagar, y porque quien no quiere ser contado tiene
 * derecho a no serlo aunque el conteo sea anónimo.
 *
 * Mientras no haya contestado tampoco se mide: quien todavía no ha dicho que
 * sí, no ha dicho que sí.
 */
export function Measurement() {
  const { consent } = useConsent();

  if (consent?.measurement !== "granted") return null;

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}

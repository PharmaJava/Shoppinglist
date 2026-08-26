"use client";

import Script from "next/script";
import { GA_MEASUREMENT_ID } from "@/features/consent/categories";
import { isGranted } from "@/features/consent/consent";
import { useConsent } from "@/features/consent/use-consent";

/**
 * Google Analytics, y sólo con permiso previo.
 *
 * **Hoy esto no se monta nunca**: sin `NEXT_PUBLIC_GA_MEASUREMENT_ID` no hay
 * identificador, no se pregunta por Google en el aviso y este componente
 * devuelve `null`. Está escrito por adelantado para que encenderlo sea poner
 * una variable, no rehacer el consentimiento — el mismo criterio con el que
 * se escribió el cobro de la Fase 3.
 *
 * Dos cosas que lo separan de pegar el fragmento que da Google:
 *
 * **1. No se carga antes de contestar.** Google Analytics pone cookies
 * (`_ga`, `_ga_<id>`), así que aquí no vale el «se carga y ya se verá»: sin
 * permiso previo no se puede, y la forma de garantizarlo es que el script
 * literalmente no exista en la página. Cargarlo y luego pedir perdón es lo
 * que se sanciona.
 *
 * **2. Consent Mode v2.** Aunque no lleguemos a cargarlo sin permiso, se
 * declara el estado del consentimiento igualmente: es lo que Google espera
 * del tráfico europeo, y deja dicho por escrito que aquí **no** hay
 * publicidad ni datos para anuncios. `ad_storage`, `ad_user_data` y
 * `ad_personalization` se quedan denegados siempre, porque esta web no hace
 * nada de eso — ni con permiso.
 */
export function GoogleAnalytics() {
  const { consent } = useConsent();

  if (!GA_MEASUREMENT_ID || !isGranted(consent, "analytics")) return null;

  return (
    <>
      <Script
        id="ga-consent-mode"
        strategy="afterInteractive"
        // `dangerouslySetInnerHTML` es la forma que tiene `next/script` de
        // llevar un script en línea; el contenido es literal nuestro, sin
        // nada que venga de fuera.
        // biome-ignore lint/security/noDangerouslySetInnerHtml: contenido fijo, sin entrada externa
        dangerouslySetInnerHTML={{
          __html: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied'
});
gtag('consent', 'update', { analytics_storage: 'granted' });
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}', { anonymize_ip: true });
`.trim(),
        }}
      />
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
    </>
  );
}

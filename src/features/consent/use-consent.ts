"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CONSENT_EVENT,
  type Consent,
  denyAll,
  grantAll,
  readConsent,
  writeConsent,
} from "./consent";

interface UseConsent {
  /** `null` mientras se lee y cuando todavía no ha contestado. */
  consent: Consent | null;
  /** Distingue «aún no sé» de «no ha contestado»: sin esto el banner parpadea. */
  cargando: boolean;
  aceptar: () => void;
  rechazar: () => void;
}

/**
 * Lo decidido sobre la medición, y cómo cambiarlo.
 *
 * Se lee en un efecto y no en el primer render a propósito: `localStorage` no
 * existe en el servidor, y pintar el banner en el HTML del servidor para
 * quitarlo medio segundo después es justo el parpadeo que hace que la web
 * parezca rota.
 *
 * Escucha el evento propio para que dos sitios de la misma página —el banner
 * y el enlace del pie— no se contradigan sin recargar.
 */
export function useConsent(): UseConsent {
  const [consent, setConsent] = useState<Consent | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const refrescar = () => setConsent(readConsent());

    refrescar();
    setCargando(false);

    window.addEventListener(CONSENT_EVENT, refrescar);
    // Y entre pestañas: decidir en una y que la otra siga preguntando sería
    // dar la sensación de que no se ha guardado.
    window.addEventListener("storage", refrescar);

    return () => {
      window.removeEventListener(CONSENT_EVENT, refrescar);
      window.removeEventListener("storage", refrescar);
    };
  }, []);

  const aceptar = useCallback(() => writeConsent(grantAll()), []);
  const rechazar = useCallback(() => writeConsent(denyAll()), []);

  return { consent, cargando, aceptar, rechazar };
}

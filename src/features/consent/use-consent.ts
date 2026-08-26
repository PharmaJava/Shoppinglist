"use client";

import { useCallback, useEffect, useState } from "react";
import type { ConsentCategory } from "./categories";
import {
  CONSENT_EVENT,
  type Consent,
  denyAll,
  fromChoices,
  grantAll,
  readConsent,
  writeConsent,
} from "./consent";

interface UseConsent {
  /** `null` mientras se lee y cuando todavía no ha contestado. */
  consent: Consent | null;
  /** Distingue «aún no sé» de «no ha contestado»: sin esto el banner parpadea. */
  cargando: boolean;
  aceptarTodo: () => void;
  rechazarTodo: () => void;
  guardarEleccion: (choices: Partial<Record<ConsentCategory, boolean>>) => void;
}

/**
 * Lo decidido, y cómo cambiarlo.
 *
 * Se lee en un efecto y no en el primer render a propósito: `localStorage` no
 * existe en el servidor, y pintar el aviso en el HTML del servidor para
 * quitarlo medio segundo después es justo el parpadeo que hace que una web
 * parezca rota.
 *
 * Escucha el evento propio para que dos sitios de la misma página —el aviso y
 * el enlace del pie— no se contradigan sin recargar.
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

  const aceptarTodo = useCallback(() => writeConsent(grantAll()), []);
  const rechazarTodo = useCallback(() => writeConsent(denyAll()), []);
  const guardarEleccion = useCallback(
    (choices: Partial<Record<ConsentCategory, boolean>>) => writeConsent(fromChoices(choices)),
    [],
  );

  return { consent, cargando, aceptarTodo, rechazarTodo, guardarEleccion };
}

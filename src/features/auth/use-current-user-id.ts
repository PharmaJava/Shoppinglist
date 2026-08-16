"use client";

import { useEffect, useState } from "react";
import { getCurrentUserId } from "@/lib/supabase/get-current-user-id";

/**
 * Quién está usando la app, leído de la sesión guardada en el dispositivo.
 *
 * A diferencia de `useSession`, esto no llama al servidor: sirve dentro del
 * súper y sin cobertura, que es donde se decide si la lista es tuya o de
 * quien te la compartió. `null` mientras se lee y si no hay sesión —quien
 * todavía no ha creado ninguna lista—, así que quien lo use debe tratar el
 * «no sé» como «no es suya», nunca al revés.
 */
export function useCurrentUserId(): string | null {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    getCurrentUserId().then((id) => {
      if (vivo) setUserId(id);
    });
    return () => {
      vivo = false;
    };
  }, []);

  return userId;
}

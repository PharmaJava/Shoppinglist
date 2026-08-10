"use client";

import { useEffect, useRef } from "react";

/** Mantiene la pantalla encendida mientras `active` es true (modo supermercado). */
export function useWakeLock(active: boolean) {
  const sentinelRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!active || typeof navigator === "undefined" || !("wakeLock" in navigator)) return;

    let cancelled = false;

    async function requestLock() {
      try {
        const sentinel = await navigator.wakeLock.request("screen");
        if (cancelled) {
          sentinel.release();
          return;
        }
        sentinelRef.current = sentinel;
      } catch {
        // Rechazado por el navegador (pestaña en segundo plano, ahorro de
        // batería…): no es un error del que recuperarse, simplemente no se
        // mantiene la pantalla encendida esta vez.
      }
    }

    void requestLock();

    // El wake lock se libera solo al ocultar la pestaña; hay que
    // reponerlo al volver si el modo supermercado sigue activo.
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") void requestLock();
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      sentinelRef.current?.release().catch(() => {});
      sentinelRef.current = null;
    };
  }, [active]);
}

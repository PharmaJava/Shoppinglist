"use client";

import { useEffect, useRef, useState } from "react";

export type WakeLockState = "no-soportado" | "encendida" | "apagada";

/**
 * Mantiene la pantalla encendida mientras `active` sea true.
 *
 * Dos cosas que no son evidentes y que costaron una queja:
 *
 * 1. El navegador **retira** el bloqueo en cuanto la pestaña deja de estar
 *    visible, y no lo devuelve solo. Hay que volver a pedirlo al volver, o la
 *    pantalla se apaga a los treinta segundos de haber salido y vuelto.
 * 2. Pedirlo dos veces a la vez deja un `sentinel` huérfano que nadie libera.
 *    De ahí el `pidiendo`.
 *
 * Devuelve en qué estado está para poder decirlo en pantalla: prometer que la
 * pantalla se queda encendida y que se apague es peor que no prometer nada.
 */
export function useWakeLock(active: boolean): WakeLockState {
  const sentinelRef = useRef<WakeLockSentinel | null>(null);
  const pidiendoRef = useRef(false);
  const [encendida, setEncendida] = useState(false);

  const soportado = typeof navigator !== "undefined" && "wakeLock" in navigator;

  useEffect(() => {
    if (!active || !soportado) {
      setEncendida(false);
      return;
    }

    let cancelado = false;

    async function pedir() {
      if (pidiendoRef.current || sentinelRef.current) return;
      pidiendoRef.current = true;

      try {
        const sentinel = await navigator.wakeLock.request("screen");
        if (cancelado) {
          void sentinel.release();
          return;
        }
        sentinelRef.current = sentinel;
        setEncendida(true);

        // El propio navegador avisa cuando lo suelta (pestaña oculta, batería
        // baja). Sin esto, `sentinelRef` se quedaría apuntando a un bloqueo
        // muerto y `pedir()` no volvería a intentarlo nunca.
        sentinel.addEventListener("release", () => {
          sentinelRef.current = null;
          setEncendida(false);
        });
      } catch {
        // Rechazado: no es un error del que recuperarse, simplemente esta vez
        // la pantalla no se queda encendida. Se dice en la interfaz.
        setEncendida(false);
      } finally {
        pidiendoRef.current = false;
      }
    }

    void pedir();

    function alVolver() {
      if (document.visibilityState === "visible") void pedir();
    }
    document.addEventListener("visibilitychange", alVolver);
    window.addEventListener("focus", alVolver);

    return () => {
      cancelado = true;
      document.removeEventListener("visibilitychange", alVolver);
      window.removeEventListener("focus", alVolver);
      void sentinelRef.current?.release().catch(() => {});
      sentinelRef.current = null;
      setEncendida(false);
    };
  }, [active, soportado]);

  if (!soportado) return "no-soportado";
  return encendida ? "encendida" : "apagada";
}

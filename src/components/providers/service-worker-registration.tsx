"use client";

import { useEffect } from "react";

/** Registra el service worker una vez, sólo en producción y si el navegador lo soporta. */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Instalable sin PWA si el registro falla; no es un error fatal para la app.
    });
  }, []);

  return null;
}

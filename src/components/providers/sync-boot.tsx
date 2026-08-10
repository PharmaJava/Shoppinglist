"use client";

import { useEffect } from "react";
import { startSyncLoop } from "@/lib/sync/flush";

/** Arranca el bucle de sincronización del outbox una vez, en el cliente. */
export function SyncBoot() {
  useEffect(() => {
    startSyncLoop();
  }, []);

  return null;
}

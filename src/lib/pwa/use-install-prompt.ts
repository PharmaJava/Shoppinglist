"use client";

import { useCallback, useEffect, useState } from "react";
import { detectPlatform, isInAppBrowser, isStandalone } from "./platform";
import {
  bumpVisitCount,
  dismissInstallPrompt,
  getVisitCount,
  isInstallPromptDismissed,
} from "./visit-count";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * `native` es Chrome/Edge en Android y escritorio: hay un diálogo del sistema
 * que se dispara con `prompt()`. `ios` es Safari, que no tiene nada parecido
 * —`beforeinstallprompt` no existe— y donde instalar es un gesto manual que
 * hay que explicar. `null` es «aquí no se ofrece nada».
 */
export type InstallMode = "native" | "ios" | null;

/**
 * Expone cómo se instala la app en este dispositivo, mostrable sólo a partir
 * de la segunda visita y nunca si ya se descartó una vez (docs/03-UX.md §6).
 */
export function useInstallPrompt() {
  const [deferredEvent, setDeferredEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [eligible, setEligible] = useState(false);
  const [iosCapable, setIosCapable] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;

    const visits = bumpVisitCount();
    setEligible(visits >= 2 && !isInstallPromptDismissed());

    const ua = navigator.userAgent;
    setIosCapable(detectPlatform(ua, navigator.maxTouchPoints) === "ios" && !isInAppBrowser(ua));

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredEvent(event as BeforeInstallPromptEvent);
    };
    // Si la instalan desde el menú del navegador en vez de desde nuestro
    // banner, el banner sobra para siempre.
    const onInstalled = () => {
      dismissInstallPrompt();
      setEligible(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const ready = eligible && getVisitCount() >= 2;
  const mode: InstallMode = !ready ? null : deferredEvent ? "native" : iosCapable ? "ios" : null;

  const promptInstall = useCallback(async () => {
    if (!deferredEvent) return;
    await deferredEvent.prompt();
    await deferredEvent.userChoice;
    setDeferredEvent(null);
    setEligible(false);
  }, [deferredEvent]);

  const dismiss = useCallback(() => {
    dismissInstallPrompt();
    setEligible(false);
  }, []);

  return { mode, promptInstall, dismiss };
}

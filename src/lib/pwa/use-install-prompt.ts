"use client";

import { useEffect, useState } from "react";
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

function isStandalone(): boolean {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // Safari/iOS
    (navigator as { standalone?: boolean }).standalone === true
  );
}

/**
 * Expone el prompt nativo de instalación, mostrable sólo a partir de la
 * segunda visita y nunca si ya se descartó una vez (docs/03-UX.md §6).
 */
export function useInstallPrompt() {
  const [deferredEvent, setDeferredEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [eligible, setEligible] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;

    const visits = bumpVisitCount();
    setEligible(visits >= 2 && !isInstallPromptDismissed());

    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredEvent(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const canPrompt = eligible && deferredEvent !== null && getVisitCount() >= 2;

  async function promptInstall() {
    if (!deferredEvent) return;
    await deferredEvent.prompt();
    await deferredEvent.userChoice;
    setDeferredEvent(null);
    setEligible(false);
  }

  function dismiss() {
    dismissInstallPrompt();
    setEligible(false);
  }

  return { canPrompt, promptInstall, dismiss };
}

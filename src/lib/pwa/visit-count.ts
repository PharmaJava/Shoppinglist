const VISIT_KEY = "sl_visit_count";
const DISMISSED_KEY = "sl_install_dismissed";

/** Incrementa y devuelve el nº de visitas (persistido en localStorage, best-effort). */
export function bumpVisitCount(): number {
  try {
    const next = getVisitCount() + 1;
    localStorage.setItem(VISIT_KEY, String(next));
    return next;
  } catch {
    return 1;
  }
}

export function getVisitCount(): number {
  try {
    return Number(localStorage.getItem(VISIT_KEY) ?? "0");
  } catch {
    return 0;
  }
}

export function isInstallPromptDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

export function dismissInstallPrompt(): void {
  try {
    localStorage.setItem(DISMISSED_KEY, "1");
  } catch {
    // localStorage no disponible (modo privado, etc.) — no es crítico.
  }
}

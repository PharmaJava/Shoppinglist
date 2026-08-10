"use client";

import { useTranslations } from "next-intl";
import { useInstallPrompt } from "@/lib/pwa/use-install-prompt";

export function InstallPromptBanner() {
  const t = useTranslations("pwa");
  const { canPrompt, promptInstall, dismiss } = useInstallPrompt();

  if (!canPrompt) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-border bg-surface-raised p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-lg">
      <span className="text-2xl" aria-hidden>
        🛒
      </span>
      <div className="flex-1">
        <p className="text-sm font-semibold text-on-surface">{t("installTitle")}</p>
        <p className="text-xs text-on-surface-muted">{t("installBody")}</p>
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="px-2 py-1.5 text-xs font-medium text-on-surface-muted"
      >
        {t("installDismiss")}
      </button>
      <button
        type="button"
        onClick={promptInstall}
        className="rounded-full bg-brand px-4 py-1.5 text-xs font-semibold text-brand-contrast"
      >
        {t("installCta")}
      </button>
    </div>
  );
}

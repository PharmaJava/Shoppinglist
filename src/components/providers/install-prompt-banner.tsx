"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useInstallPrompt } from "@/lib/pwa/use-install-prompt";

/**
 * El icono de compartir de iOS, dibujado en vez de descrito: en la barra de
 * Safari no pone «Compartir» en ningún sitio, sólo está este cuadrado con la
 * flecha, y es lo que hay que buscar.
 */
function IosShareIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
    >
      <path
        d="M12 3v12M12 3l-3.5 3.5M12 3l3.5 3.5"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 11H4.5v9.5h15V11H18"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function InstallPromptBanner() {
  const t = useTranslations("pwa");
  const { mode, promptInstall, dismiss } = useInstallPrompt();
  const [howToOpen, setHowToOpen] = useState(false);

  if (!mode) return null;

  const isIos = mode === "ios";

  return (
    <>
      {/* Texto arriba y botones debajo, no todo en una fila: a 390 px el
          título y los dos botones en línea dejaban el mensaje partido en
          tres renglones de dos palabras. */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface-raised p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-lg print:hidden">
        <div className="mx-auto flex w-full max-w-md items-start gap-3">
          <span className="text-2xl leading-none" aria-hidden>
            🛒
          </span>
          <div className="flex flex-1 flex-col gap-2">
            <div>
              <p className="text-sm font-semibold text-on-surface">{t("installTitle")}</p>
              <p className="text-xs text-on-surface-muted">{t("installBody")}</p>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={dismiss}
                className="px-3 py-2 text-xs font-medium text-on-surface-muted"
              >
                {t("installDismiss")}
              </button>
              <button
                type="button"
                onClick={isIos ? () => setHowToOpen(true) : promptInstall}
                className="rounded-full bg-brand px-5 py-2 text-xs font-semibold text-brand-contrast"
              >
                {isIos ? t("iosCta") : t("installCta")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {isIos && howToOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center print:hidden sm:items-center">
          <button
            type="button"
            aria-label={t("iosClose")}
            onClick={() => setHowToOpen(false)}
            className="absolute inset-0 bg-black/50"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t("iosTitle")}
            className="relative z-10 w-full max-w-md rounded-t-2xl bg-surface-raised p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-xl sm:rounded-2xl"
          >
            <h2 className="text-lg font-semibold text-on-surface">{t("iosTitle")}</h2>
            <ol className="mt-4 flex flex-col gap-4">
              <li className="flex items-center gap-3 text-sm text-on-surface">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-brand-contrast">
                  1
                </span>
                {/* El icono va pegado al texto, no al otro lado de la fila:
                    es el objeto de la frase, no un adorno de la lista. */}
                <span className="flex-1">
                  {t("iosStep1")}{" "}
                  <IosShareIcon className="inline size-5 align-text-bottom text-brand" />
                </span>
              </li>
              <li className="flex items-center gap-3 text-sm text-on-surface">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-brand-contrast">
                  2
                </span>
                <span className="flex-1">{t("iosStep2")}</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-on-surface">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-brand-contrast">
                  3
                </span>
                <span className="flex-1">{t("iosStep3")}</span>
              </li>
            </ol>
            <p className="mt-4 text-xs text-on-surface-muted">{t("iosNote")}</p>
            <button
              type="button"
              onClick={() => setHowToOpen(false)}
              className="mt-5 w-full rounded-full bg-surface-muted px-4 py-2.5 text-sm font-semibold text-on-surface"
            >
              {t("iosClose")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

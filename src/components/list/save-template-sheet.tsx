"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { saveListAsTemplate } from "@/features/templates/api";

type Estado = "editando" | "guardando" | "hecho";

/**
 * «Guardar como plantilla», en hoja inferior.
 *
 * Se pide el nombre en vez de copiar el de la lista sin más: la lista se llama
 * «Compra del sábado» y la plantilla debería llamarse «Semanal de casa». Se
 * ofrece el título actual como punto de partida, que casi siempre vale.
 */
export function SaveTemplateSheet({
  listId,
  listTitle,
  itemCount,
  onClose,
}: {
  listId: string;
  listTitle: string;
  itemCount: number;
  onClose: () => void;
}) {
  const t = useTranslations("templatesMine");
  const [title, setTitle] = useState(listTitle);
  const [estado, setEstado] = useState<Estado>("editando");
  const [error, setError] = useState<string | null>(null);

  async function guardar() {
    if (estado === "guardando") return;
    setEstado("guardando");
    setError(null);

    try {
      await saveListAsTemplate(listId, title.trim() || listTitle);
      setEstado("hecho");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setEstado("editando");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center print:hidden sm:items-center">
      <button
        type="button"
        aria-label={t("close")}
        onClick={onClose}
        className="absolute inset-0 bg-black/50"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("saveTitle")}
        className="relative z-10 flex w-full max-w-md flex-col gap-4 rounded-t-2xl bg-surface-raised p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-xl sm:rounded-2xl"
      >
        {estado === "hecho" ? (
          <>
            <h2 className="text-lg font-semibold text-on-surface">{t("saved")}</h2>
            <p className="text-sm text-on-surface-muted">{t("savedBody")}</p>
            <button
              type="button"
              onClick={onClose}
              className="h-tap rounded-full bg-brand font-semibold text-brand-contrast"
            >
              {t("close")}
            </button>
          </>
        ) : (
          <>
            <div>
              <h2 className="text-lg font-semibold text-on-surface">{t("saveTitle")}</h2>
              <p className="text-sm text-on-surface-muted">{t("saveBody", { count: itemCount })}</p>
            </div>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-on-surface">{t("nameLabel")}</span>
              <input
                value={title}
                onChange={(evento) => setTitle(evento.target.value)}
                maxLength={80}
                className="min-h-12 rounded-card border border-border bg-surface px-4 text-on-surface outline-none focus:border-brand"
              />
            </label>

            {error && (
              <p role="alert" className="text-sm font-medium text-accent">
                {error}
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-tap flex-1 rounded-full border border-border font-medium text-on-surface"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={guardar}
                disabled={estado === "guardando" || itemCount === 0}
                className="h-tap flex-1 rounded-full bg-brand font-semibold text-brand-contrast disabled:opacity-50"
              >
                {estado === "guardando" ? t("saving") : t("save")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

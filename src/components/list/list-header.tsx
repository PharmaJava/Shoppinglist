"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { renameList } from "@/features/list/api";
import type { List, ListWithItems } from "@/features/list/types";
import { Link } from "@/i18n/navigation";
import { ErrorBoundary } from "./error-boundary";
import { ShareSheet } from "./share-sheet";

export function ListHeader({
  listId,
  list,
  checked,
  total,
}: {
  listId: string;
  list: List;
  checked: number;
  total: number;
}) {
  const t = useTranslations("list");
  const queryClient = useQueryClient();
  const [shareOpen, setShareOpen] = useState(false);
  const [title, setTitle] = useState(list.title);

  function handleTitleBlur() {
    const trimmed = title.trim() || t("untitled");
    setTitle(trimmed);
    if (trimmed === list.title) return;

    // Optimista y offline-first: no se espera a la red para reflejar el cambio.
    renameList(list, trimmed).then((updated) => {
      queryClient.setQueryData<ListWithItems>(["list", listId], (current) =>
        current ? { ...current, list: updated } : current,
      );
    });
  }

  return (
    <header className="flex items-center gap-2 border-b border-border bg-surface-raised px-4 py-3">
      {/* La lista se abre desde un enlace de WhatsApp, así que muchas veces es
          la primera pantalla de la web y no hay «atrás» al que volver. Sin
          esto no había forma de llegar al inicio —ni de hacerse otra lista—
          más que borrando la URL a mano. */}
      <Link
        href="/"
        aria-label={t("home")}
        className="-ml-1 flex size-tap shrink-0 items-center justify-center rounded-full text-xl print:hidden"
      >
        🏠
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onBlur={handleTitleBlur}
          aria-label={t("renameList")}
          className="w-full truncate bg-transparent text-lg font-semibold text-on-surface outline-none"
        />
        {total > 0 && (
          <span className="text-sm text-on-surface-muted">{t("progress", { checked, total })}</span>
        )}
      </div>

      {/* La compra se termina en la barra de abajo, no aquí. Aquí sólo está
          lo que sirve igual antes, durante y después: compartir la lista. */}
      <button
        type="button"
        onClick={() => setShareOpen(true)}
        className="flex h-10 items-center gap-1.5 rounded-full bg-brand px-4 text-sm font-medium text-brand-contrast print:hidden"
      >
        {t("share")}
      </button>

      {shareOpen && (
        // Un fallo dentro de la hoja no puede llevarse por delante la lista que
        // hay detrás, ni esconder qué ha pasado.
        <ErrorBoundary
          fallback={(error, reset) => (
            <ShareFallback error={error} onRetry={reset} onClose={() => setShareOpen(false)} />
          )}
        >
          <ShareSheet listId={listId} onClose={() => setShareOpen(false)} />
        </ErrorBoundary>
      )}
    </header>
  );
}

/**
 * Lo que se ve si la hoja de compartir revienta.
 *
 * Enseña el mensaje del error a propósito: es feo, pero es la diferencia entre
 * «al compartir falla» y saber qué arreglar. Una captura de esta pantalla vale
 * más que diez idas y venidas.
 */
function ShareFallback({
  error,
  onRetry,
  onClose,
}: {
  error: Error;
  onRetry: () => void;
  onClose: () => void;
}) {
  const t = useTranslations("list");

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center print:hidden">
      <div className="relative z-10 flex w-full max-w-md flex-col gap-3 rounded-t-2xl bg-surface-raised p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-xl sm:rounded-2xl">
        <h2 className="font-semibold text-lg text-on-surface">{t("shareError")}</h2>
        <p className="break-words rounded-card bg-surface-muted p-3 font-mono text-on-surface-muted text-xs">
          {error.message}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onRetry}
            className="h-tap flex-1 rounded-xl bg-brand font-medium text-brand-contrast"
          >
            {t("retry")}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-tap flex-1 rounded-xl border border-border font-medium text-on-surface"
          >
            {t("editCancel")}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { renameList } from "@/features/list/api";
import type { List, ListWithItems } from "@/features/list/types";
import { ShareSheet } from "./share-sheet";

export function ListHeader({
  listId,
  list,
  checked,
  total,
  supermarketMode,
  onToggleSupermarketMode,
}: {
  listId: string;
  list: List;
  checked: number;
  total: number;
  supermarketMode: boolean;
  onToggleSupermarketMode: () => void;
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
    <header className="flex items-center gap-3 border-b border-border bg-surface-raised px-4 py-3">
      <div className="flex flex-1 flex-col">
        {supermarketMode ? (
          <span className="truncate text-lg font-semibold text-on-surface">{list.title}</span>
        ) : (
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onBlur={handleTitleBlur}
            aria-label={t("renameList")}
            className="w-full truncate bg-transparent text-lg font-semibold text-on-surface outline-none"
          />
        )}
        {total > 0 && (
          <span className="text-sm text-on-surface-muted">{t("progress", { checked, total })}</span>
        )}
      </div>

      <button
        type="button"
        onClick={onToggleSupermarketMode}
        aria-pressed={supermarketMode}
        aria-label={supermarketMode ? t("exitSupermarketMode") : t("supermarketMode")}
        className="flex size-tap shrink-0 items-center justify-center rounded-full border border-border text-xl print:hidden"
      >
        {supermarketMode ? "✕" : "🛒"}
      </button>

      {!supermarketMode && (
        <button
          type="button"
          onClick={() => setShareOpen(true)}
          className="flex h-10 items-center gap-1.5 rounded-full bg-brand px-4 text-sm font-medium text-brand-contrast print:hidden"
        >
          {t("share")}
        </button>
      )}

      {shareOpen && <ShareSheet listId={listId} onClose={() => setShareOpen(false)} />}
    </header>
  );
}

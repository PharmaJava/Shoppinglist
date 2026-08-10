"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { renameList } from "@/features/list/api";
import type { List } from "@/features/list/types";
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
    if (trimmed !== list.title) {
      renameList(listId, trimmed).then(() =>
        queryClient.invalidateQueries({ queryKey: ["list", listId] }),
      );
    }
  }

  return (
    <header className="flex items-center gap-3 border-b border-border bg-surface-raised px-4 py-3">
      <div className="flex flex-1 flex-col">
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

      <button
        type="button"
        onClick={() => setShareOpen(true)}
        className="flex h-10 items-center gap-1.5 rounded-full bg-brand px-4 text-sm font-medium text-brand-contrast"
      >
        {t("share")}
      </button>

      {shareOpen && <ShareSheet listId={listId} onClose={() => setShareOpen(false)} />}
    </header>
  );
}

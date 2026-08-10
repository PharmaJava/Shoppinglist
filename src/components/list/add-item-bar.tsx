"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { useAddItem } from "@/features/list/use-list-mutations";

export function AddItemBar({ listId }: { listId: string }) {
  const t = useTranslations("list");
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const addItem = useAddItem(listId);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const name = value.trim();
    if (!name) return;

    addItem.mutate(name);
    setValue("");
    inputRef.current?.focus();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="sticky bottom-0 flex items-center gap-2 border-t border-border bg-surface-raised p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      <input
        ref={inputRef}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={t("addPlaceholder")}
        enterKeyHint="done"
        autoComplete="off"
        className="h-tap flex-1 rounded-full border border-border bg-surface px-4 text-base text-on-surface outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
      />
      <button
        type="submit"
        disabled={!value.trim()}
        aria-label={t("add")}
        className="flex size-tap shrink-0 items-center justify-center rounded-full bg-brand text-2xl leading-none text-brand-contrast disabled:opacity-40"
      >
        +
      </button>
    </form>
  );
}

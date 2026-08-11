"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { parseVoiceTranscript } from "@/features/list/parse-voice";
import { useAddParsedItems } from "@/features/list/use-list-mutations";
import type { Locale } from "@/lib/supabase/types";
import { VoiceAddButton } from "./voice-add-button";

export function AddItemBar({ listId }: { listId: string }) {
  const t = useTranslations("list");
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const locale = useLocale() as Locale;
  const addItems = useAddParsedItems(listId);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const text = value.trim();
    if (!text) return;

    // Mismo parser que la voz y que el alta de la landing: escribir "carne
    // picada 500g" o "tomates, pan" debe comportarse igual que dictarlo.
    const parsed = parseVoiceTranscript(text, locale);
    addItems.mutate(parsed.length > 0 ? parsed : [{ name: text, qty: null, unit: null }]);
    setValue("");
    inputRef.current?.focus();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="sticky bottom-0 flex flex-col gap-1 border-t border-border bg-surface-raised p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={t("addPlaceholder")}
          enterKeyHint="done"
          autoComplete="off"
          className="h-tap flex-1 rounded-full border border-border bg-surface px-4 text-base text-on-surface outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
        />
        <VoiceAddButton listId={listId} />
        <button
          type="submit"
          disabled={!value.trim()}
          aria-label={t("add")}
          className="flex size-tap shrink-0 items-center justify-center rounded-full bg-brand text-2xl leading-none text-brand-contrast disabled:opacity-40"
        >
          +
        </button>
      </div>
      {/* Sin esta pista, que el campo entienda cantidades es invisible. */}
      <p className="px-2 text-xs text-on-surface-muted">{t("addHint")}</p>
    </form>
  );
}

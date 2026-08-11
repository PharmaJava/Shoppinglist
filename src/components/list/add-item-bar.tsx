"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { parseVoiceTranscript } from "@/features/list/parse-voice";
import { useAddParsedItems } from "@/features/list/use-list-mutations";
import { useSuggestions } from "@/features/list/use-suggestions";
import type { Locale } from "@/lib/supabase/types";
import { VoiceAddButton } from "./voice-add-button";

interface AddItemBarProps {
  listId: string;
  /** Nombres normalizados que ya están en la lista, para no sugerirlos. */
  existingNormalized: string[];
}

export function AddItemBar({ listId, existingNormalized }: AddItemBarProps) {
  const t = useTranslations("list");
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const locale = useLocale() as Locale;
  const addItems = useAddParsedItems(listId);
  const suggestions = useSuggestions(value, existingNormalized);

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

  function addSuggestion(name: string) {
    addItems.mutate([{ name, qty: null, unit: null }]);
    setValue("");
    inputRef.current?.focus();
  }

  // Sólo mientras se interactúa: en el supermercado, con la lista abierta y
  // sin tocar nada, esta franja sería pantalla robada a los productos.
  const showSuggestions = (focused || value.trim() !== "") && suggestions.length > 0;

  return (
    <div className="sticky bottom-0 border-t border-border bg-surface-raised">
      {showSuggestions && (
        <ul
          aria-label={value.trim() === "" ? t("frequentLabel") : t("suggestionsLabel")}
          className="flex gap-2 overflow-x-auto px-3 pt-3 [scrollbar-width:none]"
        >
          {suggestions.map((suggestion) => (
            <li key={suggestion.name}>
              <button
                type="button"
                // Sin esto, el campo pierde el foco antes de que el clic llegue
                // al botón, la franja desaparece y el toque se pierde.
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => addSuggestion(suggestion.name)}
                className={
                  suggestion.source === "history"
                    ? "whitespace-nowrap rounded-full border border-brand/40 bg-brand/10 px-3 py-1.5 text-sm font-medium text-on-surface"
                    : "whitespace-nowrap rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-on-surface"
                }
              >
                {suggestion.name}
              </button>
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-1 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      >
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
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
    </div>
  );
}

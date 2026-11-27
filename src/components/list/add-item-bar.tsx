"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { parseVoiceTranscript } from "@/features/list/parse-voice";
import { valueAfterPaste } from "@/features/list/paste";
import type { ListSection } from "@/features/list/types";
import { useAddParsedItems, useAddSection } from "@/features/list/use-list-mutations";
import { useSuggestions } from "@/features/list/use-suggestions";
import type { Locale } from "@/lib/supabase/types";
import { ScanAddButton } from "./scan-add-button";
import { VoiceAddButton } from "./voice-add-button";

interface AddItemBarProps {
  listId: string;
  /** Nombres normalizados que ya están en la lista, para no sugerirlos. */
  existingNormalized: string[];
  /** Sólo en las listas de equipaje: sus secciones y a cuál va lo nuevo. */
  packing?: {
    sections: ListSection[];
    targetId: string | null;
    onTarget: (sectionId: string) => void;
  };
}

export function AddItemBar({ listId, existingNormalized, packing }: AddItemBarProps) {
  const t = useTranslations("list");
  const tPacking = useTranslations("packing");
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  // Crear una sección usa el mismo campo que añadir cosas: un segundo campo
  // en una barra que ya va justa en un móvil sería pantalla robada a la lista.
  const [naming, setNaming] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const locale = useLocale() as Locale;
  const target = packing?.sections.find((section) => section.id === packing.targetId) ?? null;
  const addItems = useAddParsedItems(listId, target?.id ?? null);
  const addSection = useAddSection(listId);
  const suggestions = useSuggestions(value, existingNormalized);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const text = value.trim();
    if (!text) return;

    if (naming) {
      // La sección recién creada queda elegida: lo siguiente que se escribe
      // es casi siempre lo que va dentro.
      addSection.mutate(text, { onSuccess: (created) => packing?.onTarget(created.id) });
      setNaming(false);
      setValue("");
      inputRef.current?.focus();
      return;
    }

    // Mismo parser que la voz y que el alta de la landing: escribir "carne
    // picada 500g" o "tomates, pan" debe comportarse igual que dictarlo.
    const parsed = parseVoiceTranscript(text, locale);
    addItems.mutate(parsed.length > 0 ? parsed : [{ name: text, qty: null, unit: null }]);
    setValue("");
    inputRef.current?.focus();
  }

  /**
   * Un `<input>` de una línea se come los saltos al pegar y deja «Agua
   * Gazpacho Chocolate» todo junto. Se convierten en comas, que es lo que el
   * campo sabe enseñar y el parser sabe separar.
   */
  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    const field = event.currentTarget;
    const next = valueAfterPaste(
      value,
      field.selectionStart ?? value.length,
      field.selectionEnd ?? value.length,
      event.clipboardData.getData("text"),
    );

    if (next === null) return;
    event.preventDefault();
    setValue(next);
  }

  function addSuggestion(name: string) {
    addItems.mutate([{ name, qty: null, unit: null }]);
    setValue("");
    inputRef.current?.focus();
  }

  // Sólo mientras se interactúa: en el supermercado, con la lista abierta y
  // sin tocar nada, esta franja sería pantalla robada a los productos.
  const showSuggestions = !naming && (focused || value.trim() !== "") && suggestions.length > 0;

  const placeholder = naming
    ? tPacking("newSectionPlaceholder")
    : target
      ? tPacking("addTo", { name: target.name })
      : t("addPlaceholder");

  return (
    <div className="sticky bottom-0 border-t border-border bg-surface-raised print:hidden">
      {packing && (
        <fieldset className="flex min-w-0 items-center gap-2 overflow-x-auto px-3 pt-3 [scrollbar-width:none]">
          <legend className="sr-only">{tPacking("sectionsLabel")}</legend>
          {packing.sections.map((section) => {
            const chosen = !naming && section.id === target?.id;
            return (
              <button
                key={section.id}
                type="button"
                aria-pressed={chosen}
                onClick={() => {
                  setNaming(false);
                  packing.onTarget(section.id);
                  inputRef.current?.focus();
                }}
                className={
                  chosen
                    ? "whitespace-nowrap rounded-full bg-brand px-3 py-1.5 text-sm font-semibold text-brand-contrast"
                    : "whitespace-nowrap rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-on-surface"
                }
              >
                {section.name}
              </button>
            );
          })}
          <button
            type="button"
            aria-pressed={naming}
            onClick={() => {
              setNaming((current) => !current);
              setValue("");
              inputRef.current?.focus();
            }}
            className={
              naming
                ? "whitespace-nowrap rounded-full bg-on-surface px-3 py-1.5 text-sm font-semibold text-surface"
                : "whitespace-nowrap rounded-full border border-dashed border-brand px-3 py-1.5 text-sm font-semibold text-brand"
            }
          >
            {tPacking("newSection")}
          </button>
        </fieldset>
      )}

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
            data-add-input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onPaste={handlePaste}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={(event) => {
              if (event.key === "Escape" && naming) {
                setNaming(false);
                setValue("");
              }
            }}
            placeholder={placeholder}
            aria-label={placeholder}
            enterKeyHint="done"
            autoComplete="off"
            className="h-tap min-w-0 flex-1 rounded-full border border-border bg-surface px-4 text-base text-on-surface outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
          />
          {/* El código de barras es para la compra: en una maleta, nada de lo
              que se lleva viene de un envase que haya que escanear. */}
          {!packing && <ScanAddButton listId={listId} />}
          {!naming && <VoiceAddButton listId={listId} sectionId={target?.id ?? null} />}
          <button
            type="submit"
            disabled={!value.trim()}
            aria-label={naming ? tPacking("createSection") : t("add")}
            className="flex size-tap shrink-0 items-center justify-center rounded-full bg-brand text-2xl leading-none text-brand-contrast disabled:opacity-40"
          >
            +
          </button>
        </div>
        {/* Sin esta pista, que el campo entienda cantidades es invisible. */}
        {/* La pista habla de cantidades de la compra («carne picada 500g»): en
            una maleta no aporta y ocupa dos líneas de una barra que ya va justa. */}
        {!packing && <p className="px-2 text-xs text-on-surface-muted">{t("addHint")}</p>}
      </form>
    </div>
  );
}

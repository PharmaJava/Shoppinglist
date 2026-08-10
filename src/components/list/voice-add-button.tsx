"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback } from "react";
import { parseVoiceTranscript } from "@/features/list/parse-voice";
import { useAddParsedItems } from "@/features/list/use-list-mutations";
import { useVoiceInput } from "@/features/list/use-voice-input";
import { cn } from "@/lib/cn";
import type { Locale } from "@/lib/supabase/types";

export function VoiceAddButton({ listId }: { listId: string }) {
  const t = useTranslations("list");
  const locale = useLocale() as Locale;
  const addParsedItems = useAddParsedItems(listId);

  const handleTranscript = useCallback(
    (transcript: string) => {
      const parsed = parseVoiceTranscript(transcript, locale);
      if (parsed.length > 0) addParsedItems.mutate(parsed);
    },
    [locale, addParsedItems],
  );

  const { isSupported, isListening, start } = useVoiceInput(handleTranscript);

  if (!isSupported) return null;

  return (
    <button
      type="button"
      onClick={start}
      aria-label={isListening ? t("voiceListening") : t("voiceAdd")}
      aria-pressed={isListening}
      className={cn(
        "flex size-tap shrink-0 items-center justify-center rounded-full border border-border text-xl",
        isListening ? "animate-pulse border-brand bg-brand/10 text-brand" : "text-on-surface-muted",
      )}
    >
      🎤
    </button>
  );
}

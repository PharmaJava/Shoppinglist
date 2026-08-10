"use client";

import { useLocale } from "next-intl";
import { useCallback, useRef, useState } from "react";

const LOCALE_TO_SPEECH_LANG: Record<string, string> = { es: "es-ES", en: "en-US" };

function getSpeechRecognitionCtor(): SpeechRecognitionConstructor | undefined {
  if (typeof window === "undefined") return undefined;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition;
}

/**
 * Envuelve la Web Speech API. Deliberadamente no soportado en navegadores sin
 * ella (Safari/Firefox de escritorio): la interfaz simplemente no debe
 * mostrar el micrófono en ese caso (docs/03-UX.md §4.2).
 */
export function useVoiceInput(onTranscript: (transcript: string) => void) {
  const locale = useLocale();
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const isSupported = getSpeechRecognitionCtor() !== undefined;

  const start = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor || isListening) return;

    const recognition = new Ctor();
    recognition.lang = LOCALE_TO_SPEECH_LANG[locale] ?? "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1]?.[0]?.transcript;
      if (transcript) onTranscript(transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  }, [isListening, locale, onTranscript]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  return { isSupported, isListening, start, stop };
}

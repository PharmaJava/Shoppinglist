"use client";

import { useLocale } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

const LOCALE_TO_SPEECH_LANG: Record<string, string> = { es: "es-ES", en: "en-US" };

function getSpeechRecognitionCtor(): SpeechRecognitionConstructor | undefined {
  if (typeof window === "undefined") return undefined;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition;
}

/**
 * Envuelve la Web Speech API. Deliberadamente no soportado en navegadores sin
 * ella (Safari/Firefox de escritorio): la interfaz simplemente no debe
 * mostrar el micrófono en ese caso (docs/03-UX.md §4.2).
 *
 * **Escucha seguida y se apaga con el mismo botón.** Antes se abría el
 * micrófono, se soltaba una frase y ahí acababa: todo lo dicho llegaba en un
 * solo trozo —«leche pan huevos»— que no había forma de separar, y el botón
 * no servía para cerrarlo. Ahora cada pausa al hablar es un producto, se
 * pueden decir diez seguidos, y volver a pulsar corta.
 */
export function useVoiceInput(onTranscript: (transcript: string) => void) {
  const locale = useLocale();
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  // El callback cambia en cada render de quien lo pasa; en una referencia no
  // obliga a reabrir el micrófono por eso.
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;

  const isSupported = getSpeechRecognitionCtor() !== undefined;

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const start = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.lang = LOCALE_TO_SPEECH_LANG[locale] ?? "en-US";
    recognition.interimResults = false;
    // Sigue escuchando hasta que se le diga que pare: dictar la compra es
    // decir diez cosas con pausas, no una frase y a callar.
    recognition.continuous = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      // Cada resultado nuevo es una pausa al hablar, y cada pausa es un
      // producto. Se empieza en `resultIndex` para no repetir los anteriores,
      // que la API vuelve a mandar en cada evento.
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const resultado = event.results[i];
        if (!resultado?.isFinal) continue;

        const transcript = resultado[0]?.transcript?.trim();
        if (transcript) onTranscriptRef.current(transcript);
      }
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  }, [locale]);

  /** Un botón, dos funciones: abrir el micrófono y cerrarlo. */
  const toggle = useCallback(() => {
    if (isListening) stop();
    else start();
  }, [isListening, start, stop]);

  // Salirse de la lista con el micrófono abierto lo dejaría escuchando.
  useEffect(() => () => recognitionRef.current?.abort(), []);

  return { isSupported, isListening, start, stop, toggle };
}

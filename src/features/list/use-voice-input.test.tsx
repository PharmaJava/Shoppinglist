import { act, renderHook } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useVoiceInput } from "./use-voice-input";

/**
 * Un micrófono de mentira que se comporta como el del navegador: en cada
 * evento manda **toda** la lista de resultados acumulados y dice desde cuál
 * es nuevo (`resultIndex`). Ahí estaba el fallo original — sin mirar ese
 * índice, todo lo dictado se juntaba en una sola línea.
 */
class MicroFalso {
  static ultimo: MicroFalso | null = null;

  lang = "";
  continuous = false;
  interimResults = true;
  maxAlternatives = 0;
  onresult: ((event: SpeechRecognitionEvent) => void) | null = null;
  onerror: (() => void) | null = null;
  onend: (() => void) | null = null;

  encendido = false;
  abortado = false;
  private frases: { transcript: string; isFinal: boolean }[] = [];

  constructor() {
    MicroFalso.ultimo = this;
  }

  start() {
    this.encendido = true;
  }
  stop() {
    this.encendido = false;
  }
  abort() {
    this.abortado = true;
    this.encendido = false;
  }

  /** Una pausa al hablar: se acumula y se avisa desde dónde es nuevo. */
  decir(transcript: string, isFinal = true) {
    const desde = this.frases.length;
    this.frases.push({ transcript, isFinal });

    const results = this.frases.map((frase) => ({
      0: { transcript: frase.transcript },
      isFinal: frase.isFinal,
      length: 1,
    }));

    this.onresult?.({
      resultIndex: desde,
      results: { ...results, length: results.length },
    } as unknown as SpeechRecognitionEvent);
  }
}

function envoltorio({ children }: { children: ReactNode }) {
  return (
    <NextIntlClientProvider locale="es" messages={{}}>
      {children}
    </NextIntlClientProvider>
  );
}

beforeEach(() => {
  MicroFalso.ultimo = null;
  window.SpeechRecognition = MicroFalso as unknown as SpeechRecognitionConstructor;
});

afterEach(() => {
  window.SpeechRecognition = undefined;
});

describe("useVoiceInput", () => {
  it("sin la API del navegador no se ofrece el micrófono", () => {
    window.SpeechRecognition = undefined;
    const { result } = renderHook(() => useVoiceInput(vi.fn()), { wrapper: envoltorio });

    expect(result.current.isSupported).toBe(false);
  });

  /**
   * Dictar la compra es decir diez cosas con pausas, no soltar una frase y
   * callarse: sin `continuous`, el navegador cierra el micrófono a la primera.
   */
  it("escucha seguido y en el idioma de la interfaz", () => {
    const { result } = renderHook(() => useVoiceInput(vi.fn()), { wrapper: envoltorio });

    act(() => result.current.start());

    expect(MicroFalso.ultimo?.continuous).toBe(true);
    expect(MicroFalso.ultimo?.lang).toBe("es-ES");
    expect(MicroFalso.ultimo?.encendido).toBe(true);
    expect(result.current.isListening).toBe(true);
  });

  /** Cada pausa, un producto. Antes llegaba «leche pan huevos» de una pieza. */
  it("manda cada pausa por separado, sin repetir lo anterior", () => {
    const alDictar = vi.fn();
    const { result } = renderHook(() => useVoiceInput(alDictar), { wrapper: envoltorio });

    act(() => result.current.start());
    act(() => MicroFalso.ultimo?.decir("dos litros de leche"));
    act(() => MicroFalso.ultimo?.decir("pan"));

    expect(alDictar).toHaveBeenCalledTimes(2);
    expect(alDictar).toHaveBeenNthCalledWith(1, "dos litros de leche");
    expect(alDictar).toHaveBeenNthCalledWith(2, "pan");
  });

  it("lo que aún no es definitivo no se añade", () => {
    const alDictar = vi.fn();
    const { result } = renderHook(() => useVoiceInput(alDictar), { wrapper: envoltorio });

    act(() => result.current.start());
    act(() => MicroFalso.ultimo?.decir("hue", false));

    expect(alDictar).not.toHaveBeenCalled();
  });

  /** El mismo botón apaga: antes se quedaba escuchando para siempre. */
  it("volver a pulsar cierra el micrófono", () => {
    const { result } = renderHook(() => useVoiceInput(vi.fn()), { wrapper: envoltorio });

    act(() => result.current.toggle());
    expect(result.current.isListening).toBe(true);

    act(() => result.current.toggle());
    expect(MicroFalso.ultimo?.encendido).toBe(false);
    expect(result.current.isListening).toBe(false);
  });

  it("si el navegador lo cierra por su cuenta, el botón se entera", () => {
    const { result } = renderHook(() => useVoiceInput(vi.fn()), { wrapper: envoltorio });

    act(() => result.current.start());
    act(() => MicroFalso.ultimo?.onend?.());

    expect(result.current.isListening).toBe(false);
  });

  /** Salirse de la lista con el micrófono abierto lo dejaría escuchando. */
  it("al desmontar lo aborta", () => {
    const { result, unmount } = renderHook(() => useVoiceInput(vi.fn()), { wrapper: envoltorio });

    act(() => result.current.start());
    unmount();

    expect(MicroFalso.ultimo?.abortado).toBe(true);
  });
});

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { esCodigoValido, normalizarCodigo } from "./code";

/**
 * La cámara leyendo códigos de barras.
 *
 * Usa `BarcodeDetector`, que va en el navegador y no descarga ninguna
 * librería: en un móvil con datos justos, meter medio megabyte de wasm para
 * leer un número sería el mayor coste de toda la app. Safari no la
 * implementa, así que **la pantalla tiene que funcionar sin cámara**: quien
 * no la tenga teclea el número, que está impreso debajo de las rayas.
 *
 * Los formatos son los cuatro de producto. Pedir todos los que soporta el
 * navegador (QR incluido) haría que apuntar a un cartel del súper devolviera
 * una URL en vez de un producto.
 */
const FORMATOS = ["ean_13", "ean_8", "upc_a", "upc_e"];

/** Cada cuánto se mira un fotograma. 10/s va sobrado y no calienta el móvil. */
const INTERVALO = 100;

export type EstadoEscaner =
  | "no-soportado"
  | "parado"
  | "pidiendo-permiso"
  | "escaneando"
  | "sin-permiso"
  | "error";

export function useBarcodeScanner(alLeer: (code: string) => void) {
  const [estado, setEstado] = useState<EstadoEscaner>("parado");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const temporizadorRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // El callback cambia en cada render del componente que lo pasa; guardarlo en
  // una referencia evita rearrancar la cámara por eso.
  const alLeerRef = useRef(alLeer);
  alLeerRef.current = alLeer;

  const soportado =
    typeof window !== "undefined" &&
    "BarcodeDetector" in window &&
    typeof navigator !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia);

  const parar = useCallback(() => {
    if (temporizadorRef.current) clearInterval(temporizadorRef.current);
    temporizadorRef.current = null;

    // Sin esto la luz de la cámara se queda encendida al cerrar la hoja, que
    // es la forma más rápida de que alguien desinstale la aplicación.
    for (const pista of streamRef.current?.getTracks() ?? []) pista.stop();
    streamRef.current = null;

    setEstado((actual) => (actual === "no-soportado" ? actual : "parado"));
  }, []);

  const empezar = useCallback(async () => {
    if (!soportado) {
      setEstado("no-soportado");
      return;
    }

    setEstado("pidiendo-permiso");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        // La de atrás: nadie escanea un producto con la cámara selfie.
        video: { facingMode: { ideal: "environment" } },
      });
      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();

      // Se relee del `window` en vez de dar por hecho que sigue ahí: entre la
      // comprobación de arriba y este punto hay dos `await`.
      const Detector = window.BarcodeDetector;
      if (!Detector) {
        setEstado("no-soportado");
        return;
      }

      const detector = new Detector({ formats: FORMATOS });
      setEstado("escaneando");

      temporizadorRef.current = setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) return;
        try {
          const [leido] = await detector.detect(videoRef.current);
          if (!leido) return;

          const codigo = normalizarCodigo(leido.rawValue);
          // El dígito de control descarta las lecturas a medias, que con poca
          // luz son muchas: sin esto se preguntaría por productos que no
          // existen y la pantalla parpadearía entre «no lo conozco» y el bueno.
          if (!esCodigoValido(codigo)) return;

          alLeerRef.current(codigo);
        } catch {
          // Un fotograma que no se puede analizar no es un fallo: el
          // siguiente llega en una décima de segundo.
        }
      }, INTERVALO);
    } catch (fallo) {
      const nombre = fallo instanceof Error ? fallo.name : "";
      setEstado(
        nombre === "NotAllowedError" || nombre === "SecurityError" ? "sin-permiso" : "error",
      );
      parar();
    }
  }, [parar, soportado]);

  // Al desmontar, la cámara se apaga siempre.
  useEffect(() => parar, [parar]);

  return { estado: soportado ? estado : ("no-soportado" as const), videoRef, empezar, parar };
}

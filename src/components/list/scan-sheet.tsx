"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { type Reconocido, reconocerCodigo, recordarCodigo } from "@/features/barcode/api";
import { esCodigoValido, normalizarCodigo } from "@/features/barcode/code";
import { useBarcodeScanner } from "@/features/barcode/use-barcode-scanner";
import { categorize } from "@/features/list/categorize";
import { useAddParsedItems } from "@/features/list/use-list-mutations";
import type { Locale } from "@/lib/supabase/types";

type Hallazgo =
  | { estado: "nada" }
  | { estado: "buscando"; code: string }
  | { estado: "conocido"; producto: Reconocido }
  | { estado: "desconocido"; code: string };

/**
 * Escanear un producto y meterlo en la lista.
 *
 * La cámara es un atajo, no el único camino: `BarcodeDetector` no existe en
 * Safari, y aunque exista hay sitios donde no hay luz o el envase está
 * arrugado. Por eso el campo para teclear el número **siempre** está, no
 * aparece sólo cuando algo falla.
 */
export function ScanSheet({ listId, onCerrar }: { listId: string; onCerrar: () => void }) {
  const t = useTranslations("barcode");
  const locale = useLocale() as Locale;
  const addItems = useAddParsedItems(listId);

  const [hallazgo, setHallazgo] = useState<Hallazgo>({ estado: "nada" });
  const [nombre, setNombre] = useState("");
  const [tecleado, setTecleado] = useState("");
  const [anadido, setAnadido] = useState<string | null>(null);

  const buscar = useCallback(
    async (code: string) => {
      setHallazgo({ estado: "buscando", code });
      const producto = await reconocerCodigo(code, locale);

      if (producto) {
        setHallazgo({ estado: "conocido", producto });
        setNombre(producto.name);
      } else {
        setHallazgo({ estado: "desconocido", code });
        setNombre("");
      }
    },
    [locale],
  );

  const alLeer = useCallback(
    (code: string) => {
      // Mientras se está mirando un resultado, la cámara sigue viendo el mismo
      // envase: sin esto, cada décima de segundo se reiniciaría la pantalla.
      setHallazgo((actual) => {
        if (actual.estado !== "nada") return actual;
        void buscar(code);
        return { estado: "buscando", code };
      });
    },
    [buscar],
  );

  const { estado: camara, videoRef, empezar, parar } = useBarcodeScanner(alLeer);

  function cerrar() {
    parar();
    onCerrar();
  }

  function otro() {
    setHallazgo({ estado: "nada" });
    setNombre("");
    setTecleado("");
  }

  function buscarTecleado(evento: React.FormEvent) {
    evento.preventDefault();
    const codigo = normalizarCodigo(tecleado);
    if (!esCodigoValido(codigo)) return;
    void buscar(codigo);
  }

  async function anadir() {
    const limpio = nombre.trim();
    if (!limpio) return;

    const code =
      hallazgo.estado === "conocido" ? hallazgo.producto.code : (hallazgo as { code: string }).code;
    const categoryId = categorize(limpio, locale);

    addItems.mutate([{ name: limpio, qty: null, unit: null }]);

    // Se recuerda siempre, no sólo cuando el nombre se ha escrito a mano: la
    // segunda vez que se escanee este envase la respuesta será instantánea y
    // con el nombre que usa esta persona, no con el de la ficha.
    await recordarCodigo(code, limpio, categoryId);

    setAnadido(limpio);
    otro();
  }

  const codigoTecleadoVale = esCodigoValido(normalizarCodigo(tecleado));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center print:hidden sm:items-center">
      <button
        type="button"
        aria-label={t("close")}
        onClick={cerrar}
        className="absolute inset-0 bg-black/50"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("title")}
        className="relative z-10 flex w-full max-w-md flex-col gap-4 rounded-t-2xl bg-surface-raised p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-xl sm:rounded-2xl"
      >
        <h2 className="text-lg font-semibold text-on-surface">{t("title")}</h2>

        {anadido && (
          <p role="status" className="rounded-card bg-brand/10 p-3 text-sm text-on-surface">
            {t("added", { name: anadido })}
          </p>
        )}

        {/* La cámara sólo mientras no hay nada que decidir. */}
        {hallazgo.estado === "nada" && (
          <>
            {camara === "no-soportado" ? (
              <p className="rounded-card bg-surface-muted p-3 text-sm text-on-surface-muted">
                {t("noCamera")}
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {/* Sin `<track>`: es la imagen de la cámara en directo, no un
                    vídeo con diálogo que subtitular. */}
                <video
                  ref={videoRef}
                  muted
                  playsInline
                  aria-label={t("cameraLabel")}
                  className={
                    camara === "escaneando"
                      ? "aspect-video w-full rounded-card bg-black object-cover"
                      : "hidden"
                  }
                />
                {camara === "escaneando" ? (
                  <p className="text-sm text-on-surface-muted">{t("aim")}</p>
                ) : (
                  <button
                    type="button"
                    onClick={empezar}
                    disabled={camara === "pidiendo-permiso"}
                    className="h-tap rounded-full bg-brand font-semibold text-brand-contrast disabled:opacity-50"
                  >
                    {camara === "pidiendo-permiso" ? t("asking") : t("useCamera")}
                  </button>
                )}
                {camara === "sin-permiso" && (
                  <p className="text-sm text-on-surface-muted">{t("noPermission")}</p>
                )}
                {camara === "error" && (
                  <p className="text-sm text-on-surface-muted">{t("cameraError")}</p>
                )}
              </div>
            )}

            {/* Siempre presente, no sólo cuando la cámara falla: el número
                está impreso debajo de las rayas y a veces es más rápido. */}
            <form onSubmit={buscarTecleado} className="flex flex-col gap-2">
              <label className="flex flex-col gap-1 text-sm text-on-surface-muted">
                {t("typeLabel")}
                <div className="flex gap-2">
                  <input
                    value={tecleado}
                    onChange={(evento) => setTecleado(evento.target.value)}
                    inputMode="numeric"
                    placeholder="8412345678905"
                    className="min-h-12 flex-1 rounded-card border border-border bg-surface px-3 text-on-surface outline-none focus:border-brand"
                  />
                  <button
                    type="submit"
                    disabled={!codigoTecleadoVale}
                    className="min-h-12 shrink-0 rounded-full border border-border px-4 font-medium text-on-surface disabled:opacity-40"
                  >
                    {t("search")}
                  </button>
                </div>
              </label>
              {tecleado.trim() !== "" && !codigoTecleadoVale && (
                <p className="text-xs text-on-surface-muted">{t("invalidCode")}</p>
              )}
            </form>
          </>
        )}

        {hallazgo.estado === "buscando" && (
          <p className="text-on-surface-muted">{t("searching", { code: hallazgo.code })}</p>
        )}

        {(hallazgo.estado === "conocido" || hallazgo.estado === "desconocido") && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm text-on-surface-muted">
                {hallazgo.estado === "conocido"
                  ? t(hallazgo.producto.origen === "memoria" ? "fromMemory" : "fromOpenFoodFacts")
                  : t("unknown")}
              </span>
              {hallazgo.estado === "conocido" && hallazgo.producto.quantity && (
                <span className="text-sm text-on-surface-muted">{hallazgo.producto.quantity}</span>
              )}
            </div>

            <label className="flex flex-col gap-1 text-sm text-on-surface-muted">
              {t("nameLabel")}
              <input
                // biome-ignore lint/a11y/noAutofocus: si el código no se conoce, escribir el nombre es lo único que queda por hacer, y con el móvil en una mano y el envase en la otra un toque de más cuesta.
                autoFocus={hallazgo.estado === "desconocido"}
                value={nombre}
                onChange={(evento) => setNombre(evento.target.value)}
                maxLength={200}
                className="min-h-12 rounded-card border border-border bg-surface px-3 text-on-surface outline-none focus:border-brand"
              />
            </label>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={otro}
                className="h-tap flex-1 rounded-full border border-border font-medium text-on-surface"
              >
                {t("another")}
              </button>
              <button
                type="button"
                onClick={anadir}
                disabled={!nombre.trim()}
                className="h-tap flex-1 rounded-full bg-brand font-semibold text-brand-contrast disabled:opacity-50"
              >
                {t("add")}
              </button>
            </div>
          </div>
        )}

        <button type="button" onClick={cerrar} className="text-sm text-on-surface-muted underline">
          {t("done")}
        </button>
      </div>
    </div>
  );
}

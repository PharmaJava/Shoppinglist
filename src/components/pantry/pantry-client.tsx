"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { categorize } from "@/features/list/categorize";
import { parseVoiceTranscript } from "@/features/list/parse-voice";
import {
  addToPantry,
  fetchPantry,
  type PantryItem,
  removeFromPantry,
  updatePantryItem,
} from "@/features/pantry/api";
import {
  type EstadoCaducidad,
  estadoCaducidad,
  ordenarPorCaducidad,
  urge,
} from "@/features/pantry/expiry";
import type { Locale } from "@/lib/supabase/types";

const COLOR: Record<EstadoCaducidad, string> = {
  caducado: "bg-accent/15 text-accent",
  hoy: "bg-accent/15 text-accent",
  pronto: "bg-brand/15 text-brand",
  lejos: "bg-surface-muted text-on-surface-muted",
  "sin-fecha": "bg-surface-muted text-on-surface-muted",
};

export function PantryClient() {
  const t = useTranslations("pantry");
  const locale = useLocale() as Locale;

  const [productos, setProductos] = useState<PantryItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  const [caduca, setCaduca] = useState("");
  const [guardando, setGuardando] = useState(false);

  // Se calcula una vez por render y se pasa a todo: si cada tarjeta llamara a
  // `new Date()` por su cuenta, una despensa abierta a medianoche podría
  // pintar unas filas con el día de hoy y otras con el de mañana.
  const hoy = new Date();

  const cargar = useCallback(async () => {
    try {
      setProductos(await fetchPantry());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setProductos([]);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  async function anadir(evento: React.FormEvent) {
    evento.preventDefault();
    const limpio = texto.trim();
    if (!limpio || guardando) return;

    setGuardando(true);
    setError(null);
    try {
      // El mismo parser que la barra de añadir de una lista: «2 litros de
      // leche» entra con cantidad y unidad, no como un nombre largo.
      const [parseado] = parseVoiceTranscript(limpio, locale);
      const name = parseado?.name ?? limpio;

      await addToPantry({
        name,
        qty: parseado?.qty ?? null,
        unit: parseado?.unit ?? null,
        categoryId: categorize(name, locale),
        expiresOn: caduca || null,
      });
      setTexto("");
      setCaduca("");
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setGuardando(false);
    }
  }

  async function borrar(item: PantryItem) {
    setProductos((actuales) => (actuales ?? []).filter((fila) => fila.id !== item.id));
    try {
      await removeFromPantry(item.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      await cargar();
    }
  }

  async function cambiarCaducidad(item: PantryItem, valor: string) {
    const expiresOn = valor || null;
    setProductos((actuales) =>
      (actuales ?? []).map((fila) => (fila.id === item.id ? { ...fila, expiresOn } : fila)),
    );
    try {
      await updatePantryItem(item.id, { expiresOn });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      await cargar();
    }
  }

  if (productos === null) return <p className="text-on-surface-muted">{t("loading")}</p>;

  const ordenados = ordenarPorCaducidad(productos, hoy);
  const urgentes = ordenados.filter((item) => urge(estadoCaducidad(item.expiresOn, hoy)));

  return (
    <div className="flex flex-col gap-5">
      <form onSubmit={anadir} className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            value={texto}
            onChange={(evento) => setTexto(evento.target.value)}
            placeholder={t("addPlaceholder")}
            aria-label={t("addLabel")}
            className="min-h-12 flex-1 rounded-card border border-border bg-surface px-4 text-on-surface outline-none focus:border-brand"
          />
          <button
            type="submit"
            disabled={!texto.trim() || guardando}
            className="min-h-12 shrink-0 rounded-full bg-brand px-5 font-semibold text-brand-contrast disabled:opacity-50"
          >
            {guardando ? t("adding") : t("add")}
          </button>
        </div>
        <label className="flex items-center gap-2 text-sm text-on-surface-muted">
          {t("expiresLabel")}
          <input
            type="date"
            value={caduca}
            onChange={(evento) => setCaduca(evento.target.value)}
            className="min-h-10 rounded-card border border-border bg-surface px-3 text-on-surface outline-none focus:border-brand"
          />
        </label>
      </form>

      {error && (
        <p role="alert" className="rounded-card bg-accent/10 p-3 text-sm text-on-surface">
          {error}
        </p>
      )}

      {urgentes.length > 0 && (
        <p className="rounded-card bg-accent/10 p-3 text-sm font-medium text-on-surface">
          {t("urgent", { count: urgentes.length })}
        </p>
      )}

      {ordenados.length === 0 ? (
        <div className="flex flex-col gap-2 rounded-card border border-dashed border-border p-6 text-center">
          <p className="font-medium text-on-surface">{t("emptyTitle")}</p>
          <p className="text-sm text-on-surface-muted">{t("emptyBody")}</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {ordenados.map((item) => {
            const estado = estadoCaducidad(item.expiresOn, hoy);
            return (
              <li
                key={item.id}
                className="flex flex-wrap items-center gap-2 rounded-card border border-border bg-surface p-3"
              >
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium text-on-surface first-letter:uppercase">
                    {item.name}
                    {item.qty !== null && (
                      <span className="ml-2 text-sm text-on-surface-muted">
                        {item.qty}
                        {item.unit ? ` ${item.unit}` : ""}
                      </span>
                    )}
                  </span>
                  <span
                    className={`mt-1 w-fit rounded-full px-2 py-0.5 text-xs font-medium ${COLOR[estado]}`}
                  >
                    {t(`estado.${estado}`)}
                  </span>
                </div>

                <input
                  type="date"
                  value={item.expiresOn ?? ""}
                  onChange={(evento) => cambiarCaducidad(item, evento.target.value)}
                  aria-label={t("expiresFor", { name: item.name })}
                  className="min-h-10 rounded-card border border-border bg-surface px-2 text-sm text-on-surface outline-none focus:border-brand"
                />
                <button
                  type="button"
                  onClick={() => borrar(item)}
                  aria-label={t("removeFor", { name: item.name })}
                  className="min-h-10 rounded-full border border-border px-3 text-sm text-on-surface-muted"
                >
                  {t("remove")}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

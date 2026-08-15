"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { leerRecetaAction, type MotivoRechazo } from "@/app/[locale]/recetas/actions";
import { createListFromTemplate } from "@/features/list/api";
import { categorize } from "@/features/list/categorize";
import {
  escalarIngredientes,
  type ParsedRecipe,
  type RecipeIngredient,
} from "@/features/recipes/parse-recipe";
import type { Locale } from "@/lib/supabase/types";

export function RecipeClient() {
  const t = useTranslations("recipes");
  const locale = useLocale() as Locale;
  const router = useRouter();

  const [texto, setTexto] = useState("");
  const [receta, setReceta] = useState<ParsedRecipe | null>(null);
  const [fuera, setFuera] = useState<Set<string>>(new Set());
  const [comensales, setComensales] = useState<number | null>(null);
  const [titulo, setTitulo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [leyendo, setLeyendo] = useState(false);
  const [creando, setCreando] = useState(false);

  // Lo que se enseña sale de reescalar lo leído y quitar lo desmarcado. Se
  // calcula aquí, antes de los manejadores, para que crear la lista use
  // exactamente lo mismo que se está viendo. Con el campo de comensales
  // vacío el factor es 1: se mantienen las cantidades de la receta.
  const factor =
    receta?.servings && comensales && comensales > 0 ? comensales / receta.servings : 1;
  const escalados: RecipeIngredient[] = receta
    ? escalarIngredientes(receta.ingredients, factor)
    : [];
  const elegidos = escalados.filter((ingrediente) => !fuera.has(ingrediente.name));

  function mensajeDe(motivo: MotivoRechazo): string {
    // `apagado` y `error` no tienen mensaje propio: el primero no puede pasar
    // con la pantalla delante, y el segundo no le dice nada a nadie.
    if (motivo === "vacio" || motivo === "demasiado_largo" || motivo === "no_premium") {
      return t(`error.${motivo}`);
    }
    if (motivo === "sin_sesion") return t("error.sin_sesion");
    return t("error.generico");
  }

  async function leer(evento: React.FormEvent) {
    evento.preventDefault();
    if (!texto.trim() || leyendo) return;

    setLeyendo(true);
    setError(null);
    try {
      const resultado = await leerRecetaAction(texto, locale);
      if (!resultado.ok) {
        setError(mensajeDe(resultado.motivo));
        return;
      }

      setReceta(resultado.receta);
      setFuera(new Set());
      setComensales(resultado.receta.servings);
      setTitulo(resultado.receta.title ?? t("defaultTitle"));
    } catch {
      setError(t("error.generico"));
    } finally {
      setLeyendo(false);
    }
  }

  function alternar(nombre: string) {
    setFuera((actuales) => {
      const siguiente = new Set(actuales);
      if (siguiente.has(nombre)) siguiente.delete(nombre);
      else siguiente.add(nombre);
      return siguiente;
    });
  }

  async function crear() {
    if (!receta || creando || elegidos.length === 0) return;

    setCreando(true);
    setError(null);
    try {
      const lista = await createListFromTemplate(
        titulo.trim() || t("defaultTitle"),
        elegidos.map((ingrediente) => ({
          name: ingrediente.name,
          qty: ingrediente.qty ?? undefined,
          unit: ingrediente.unit ?? undefined,
          // La categoría se deduce del nombre, igual que al escribir a mano:
          // así una lista nacida de una receta se ordena por pasillos como
          // cualquier otra.
          categoryId: categorize(ingrediente.name, locale),
        })),
        locale,
      );
      router.push(`/l/${lista.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setCreando(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <form onSubmit={leer} className="flex flex-col gap-2">
        <label className="flex flex-col gap-1 text-sm text-on-surface-muted">
          {t("pasteLabel")}
          <textarea
            value={texto}
            onChange={(evento) => setTexto(evento.target.value)}
            placeholder={t("pastePlaceholder")}
            rows={8}
            className="rounded-card border border-border bg-surface p-3 text-on-surface outline-none focus:border-brand"
          />
        </label>
        <button
          type="submit"
          disabled={!texto.trim() || leyendo}
          className="h-tap rounded-full bg-brand font-semibold text-brand-contrast disabled:opacity-50"
        >
          {leyendo ? t("reading") : t("read")}
        </button>
      </form>

      {error && (
        <p role="alert" className="rounded-card bg-accent/10 p-3 text-sm text-on-surface">
          {error}
        </p>
      )}

      {receta && (
        <section className="flex flex-col gap-4">
          <h2 className="font-semibold text-on-surface">
            {t("found", { count: receta.ingredients.length })}
          </h2>

          {receta.ingredients.length === 0 ? (
            <p className="rounded-card border border-dashed border-border p-4 text-sm text-on-surface-muted">
              {t("nothingFound")}
            </p>
          ) : (
            <>
              {receta.servings !== null && (
                <label className="flex flex-wrap items-center gap-2 text-sm text-on-surface-muted">
                  {t("servingsLabel", { original: receta.servings })}
                  <input
                    type="number"
                    min={1}
                    max={50}
                    // Vacío es vacío: si al borrarlo volviera a aparecer el
                    // número original, no habría forma de teclear otro.
                    value={comensales ?? ""}
                    onChange={(evento) => setComensales(Number(evento.target.value) || null)}
                    aria-label={t("servingsAria")}
                    className="min-h-10 w-20 rounded-card border border-border bg-surface px-3 text-on-surface outline-none focus:border-brand"
                  />
                </label>
              )}

              <ul className="flex flex-col gap-1">
                {escalados.map((ingrediente) => (
                  <li key={ingrediente.name}>
                    <label className="flex items-center gap-3 rounded-card border border-border bg-surface p-3">
                      <input
                        type="checkbox"
                        checked={!fuera.has(ingrediente.name)}
                        onChange={() => alternar(ingrediente.name)}
                        className="size-5 accent-[var(--color-brand)]"
                      />
                      <span className="flex-1 text-on-surface">{ingrediente.name}</span>
                      {ingrediente.qty !== null && (
                        <span className="text-sm text-on-surface-muted">
                          {ingrediente.unit
                            ? `${ingrediente.qty} ${ingrediente.unit}`
                            : String(ingrediente.qty)}
                        </span>
                      )}
                    </label>
                  </li>
                ))}
              </ul>

              {/* Lo que se compra ya está en casa la mitad de las veces: la
                  sal y el aceite salen en todas las recetas. Poder quitarlo
                  antes de crear la lista es la diferencia entre usar esto y
                  no usarlo. */}
              <p className="text-sm text-on-surface-muted">{t("uncheckHint")}</p>

              <label className="flex flex-col gap-1 text-sm text-on-surface-muted">
                {t("nameLabel")}
                <input
                  value={titulo}
                  onChange={(evento) => setTitulo(evento.target.value)}
                  maxLength={80}
                  className="min-h-12 rounded-card border border-border bg-surface px-3 text-on-surface outline-none focus:border-brand"
                />
              </label>

              <button
                type="button"
                onClick={crear}
                disabled={elegidos.length === 0 || creando}
                className="h-tap rounded-full bg-brand font-semibold text-brand-contrast disabled:opacity-50"
              >
                {creando ? t("creating") : t("create", { count: elegidos.length })}
              </button>
            </>
          )}
        </section>
      )}
    </div>
  );
}

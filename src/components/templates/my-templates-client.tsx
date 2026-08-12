"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import {
  createListFromMyTemplate,
  deleteTemplate,
  fetchMyTemplates,
  type MyTemplate,
  renameTemplate,
} from "@/features/templates/api";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/lib/supabase/types";

export function MyTemplatesClient() {
  const t = useTranslations("templatesMine");
  const locale = useLocale() as Locale;
  const router = useRouter();

  const [templates, setTemplates] = useState<MyTemplate[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ocupada, setOcupada] = useState<string | null>(null);
  const [renombrando, setRenombrando] = useState<string | null>(null);
  const [borrando, setBorrando] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      setTemplates(await fetchMyTemplates());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setTemplates([]);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  async function usar(template: MyTemplate) {
    if (ocupada) return;
    setOcupada(template.id);
    setError(null);
    try {
      const list = await createListFromMyTemplate(template.id, template.title, locale);
      router.push(`/l/${list.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setOcupada(null);
    }
  }

  async function renombrar(template: MyTemplate, titulo: string) {
    const limpio = titulo.trim();
    setRenombrando(null);
    if (!limpio || limpio === template.title) return;

    // Optimista: el nombre es suyo y no hay nada que pueda rechazarlo.
    setTemplates((actuales) =>
      (actuales ?? []).map((fila) => (fila.id === template.id ? { ...fila, title: limpio } : fila)),
    );
    try {
      await renameTemplate(template.id, limpio);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      void cargar();
    }
  }

  async function borrar(template: MyTemplate) {
    setBorrando(null);
    setTemplates((actuales) => (actuales ?? []).filter((fila) => fila.id !== template.id));
    try {
      await deleteTemplate(template.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      void cargar();
    }
  }

  if (templates === null) {
    return <p className="text-on-surface-muted">{t("loading")}</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p role="alert" className="rounded-card bg-accent/10 p-3 text-sm text-on-surface">
          {error}
        </p>
      )}

      {templates.length === 0 ? (
        <div className="flex flex-col gap-3 rounded-card border border-border border-dashed p-6 text-center">
          <p className="font-medium text-on-surface">{t("emptyTitle")}</p>
          <p className="text-sm text-on-surface-muted">{t("emptyBody")}</p>
          <Link href="/mis-listas" className="font-medium text-brand underline">
            {t("emptyCta")}
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {templates.map((template) => (
            <li
              key={template.id}
              className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                {renombrando === template.id ? (
                  <input
                    // biome-ignore lint/a11y/noAutofocus: el campo aparece porque se ha pulsado «Renombrar»; no enfocarlo obligaría a un segundo toque para hacer justo lo que se ha pedido.
                    autoFocus
                    defaultValue={template.title}
                    aria-label={t("nameLabel")}
                    maxLength={80}
                    onBlur={(evento) => renombrar(template, evento.target.value)}
                    onKeyDown={(evento) => {
                      if (evento.key === "Enter") evento.currentTarget.blur();
                      if (evento.key === "Escape") setRenombrando(null);
                    }}
                    className="min-h-10 flex-1 rounded-card border border-brand bg-surface px-3 font-semibold text-on-surface outline-none"
                  />
                ) : (
                  <h2 className="font-semibold text-on-surface">{template.title}</h2>
                )}
                <span className="text-sm text-on-surface-muted">
                  {t("itemCount", { count: template.itemCount })}
                </span>
              </div>

              {borrando === template.id ? (
                <div className="flex flex-col gap-2 rounded-card bg-surface-muted p-3">
                  <p className="text-sm text-on-surface">{t("deleteConfirm")}</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setBorrando(null)}
                      className="h-10 flex-1 rounded-full border border-border text-sm font-medium text-on-surface"
                    >
                      {t("cancel")}
                    </button>
                    <button
                      type="button"
                      onClick={() => borrar(template)}
                      className="h-10 flex-1 rounded-full bg-accent text-sm font-semibold text-white"
                    >
                      {t("delete")}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => usar(template)}
                    disabled={ocupada !== null}
                    className="h-10 flex-1 rounded-full bg-brand px-4 text-sm font-semibold text-brand-contrast disabled:opacity-50"
                  >
                    {ocupada === template.id ? t("using") : t("use")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRenombrando(template.id)}
                    className="h-10 rounded-full border border-border px-4 text-sm font-medium text-on-surface"
                  >
                    {t("rename")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setBorrando(template.id)}
                    className="h-10 rounded-full border border-border px-4 text-sm font-medium text-on-surface-muted"
                  >
                    {t("delete")}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

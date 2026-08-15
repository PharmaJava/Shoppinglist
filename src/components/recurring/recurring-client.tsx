"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import {
  createRecurringList,
  deleteRecurringList,
  fetchRecurringLists,
  type RecurringList,
  runRecurringNow,
  setRecurringActive,
} from "@/features/recurring/api";
import {
  CADENCIAS,
  DIA_MES_MAXIMO,
  DIAS_SEMANA,
  diasHasta,
  fechaLarga,
  nombreDia,
  valoresPorDefecto,
} from "@/features/recurring/schedule";
import { fetchMyTemplates, type MyTemplate } from "@/features/templates/api";
import { Link } from "@/i18n/navigation";
import type { Cadence, Locale } from "@/lib/supabase/types";

export function RecurringClient() {
  const t = useTranslations("recurring");
  const locale = useLocale() as Locale;
  const router = useRouter();

  const [programadas, setProgramadas] = useState<RecurringList[] | null>(null);
  const [plantillas, setPlantillas] = useState<MyTemplate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ocupada, setOcupada] = useState<string | null>(null);
  const [borrando, setBorrando] = useState<string | null>(null);

  // Se calcula una vez por render y se pasa a todo, como en la despensa: si
  // cada tarjeta llamara a `new Date()` por su cuenta, una pantalla abierta a
  // medianoche podría decir «mañana» en una fila y «hoy» en la de al lado.
  const hoy = new Date();
  const porDefecto = valoresPorDefecto(hoy);

  const [templateId, setTemplateId] = useState("");
  const [titulo, setTitulo] = useState("");
  const [cadence, setCadence] = useState<Cadence>("weekly");
  const [weekday, setWeekday] = useState(porDefecto.weekday);
  const [dayOfMonth, setDayOfMonth] = useState(porDefecto.dayOfMonth);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const [filas, misPlantillas] = await Promise.all([fetchRecurringLists(), fetchMyTemplates()]);
      setProgramadas(filas);
      setPlantillas(misPlantillas);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setProgramadas([]);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  function elegirPlantilla(id: string) {
    setTemplateId(id);
    // El nombre de la plantilla es el que casi siempre se quiere para la
    // lista; se rellena solo y se puede cambiar.
    const plantilla = plantillas.find((fila) => fila.id === id);
    if (plantilla && !titulo.trim()) setTitulo(plantilla.title);
  }

  async function programar(evento: React.FormEvent) {
    evento.preventDefault();
    if (!templateId || !titulo.trim() || guardando) return;

    setGuardando(true);
    setError(null);
    try {
      await createRecurringList({ templateId, title: titulo, cadence, weekday, dayOfMonth });
      setTemplateId("");
      setTitulo("");
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setGuardando(false);
    }
  }

  async function crearAhora(fila: RecurringList) {
    if (ocupada) return;
    setOcupada(fila.id);
    setError(null);
    try {
      const listId = await runRecurringNow(fila.id);
      router.push(`/l/${listId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setOcupada(null);
    }
  }

  async function cambiarActiva(fila: RecurringList) {
    const active = !fila.active;
    setProgramadas((actuales) =>
      (actuales ?? []).map((otra) => (otra.id === fila.id ? { ...otra, active } : otra)),
    );
    try {
      await setRecurringActive(fila.id, active);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      await cargar();
    }
  }

  async function borrar(fila: RecurringList) {
    setBorrando(null);
    setProgramadas((actuales) => (actuales ?? []).filter((otra) => otra.id !== fila.id));
    try {
      await deleteRecurringList(fila.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      await cargar();
    }
  }

  function describir(fila: RecurringList): string {
    if (fila.cadence === "monthly") return t("everyMonth", { day: fila.dayOfMonth ?? 1 });
    const dia = nombreDia(fila.weekday ?? 1, locale);
    return fila.cadence === "biweekly"
      ? t("everyTwoWeeks", { day: dia })
      : t("everyWeek", { day: dia });
  }

  if (programadas === null) return <p className="text-on-surface-muted">{t("loading")}</p>;

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <p role="alert" className="rounded-card bg-accent/10 p-3 text-sm text-on-surface">
          {error}
        </p>
      )}

      {plantillas.length === 0 ? (
        <div className="flex flex-col items-start gap-2 rounded-card border border-dashed border-border p-6">
          <p className="text-on-surface">{t("noTemplates")}</p>
          <Link href="/mis-plantillas" className="font-medium text-brand underline">
            {t("noTemplatesCta")}
          </Link>
        </div>
      ) : (
        <form
          onSubmit={programar}
          className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4"
        >
          <h2 className="font-semibold text-on-surface">{t("newTitle")}</h2>

          <label className="flex flex-col gap-1 text-sm text-on-surface-muted">
            {t("templateLabel")}
            <select
              value={templateId}
              onChange={(evento) => elegirPlantilla(evento.target.value)}
              className="min-h-12 rounded-card border border-border bg-surface px-3 text-on-surface outline-none focus:border-brand"
            >
              <option value="">—</option>
              {plantillas.map((plantilla) => (
                <option key={plantilla.id} value={plantilla.id}>
                  {plantilla.title}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm text-on-surface-muted">
            {t("nameLabel")}
            <input
              value={titulo}
              onChange={(evento) => setTitulo(evento.target.value)}
              placeholder={t("namePlaceholder")}
              maxLength={80}
              className="min-h-12 rounded-card border border-border bg-surface px-3 text-on-surface outline-none focus:border-brand"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-on-surface-muted">
            {t("cadenceLabel")}
            <select
              value={cadence}
              onChange={(evento) => setCadence(evento.target.value as Cadence)}
              className="min-h-12 rounded-card border border-border bg-surface px-3 text-on-surface outline-none focus:border-brand"
            >
              {CADENCIAS.map((valor) => (
                <option key={valor} value={valor}>
                  {t(`cadence.${valor}`)}
                </option>
              ))}
            </select>
          </label>

          {cadence === "monthly" ? (
            /* La pista va fuera de la etiqueta: dentro, el nombre accesible
               del campo pasaría a ser «Día del mes Hasta el 28: …». */
            <div className="flex flex-col gap-1 text-sm text-on-surface-muted">
              <label className="flex flex-col gap-1">
                {t("dayOfMonthLabel")}
                <input
                  type="number"
                  min={1}
                  max={DIA_MES_MAXIMO}
                  value={dayOfMonth}
                  aria-describedby="pista-dia-mes"
                  onChange={(evento) =>
                    setDayOfMonth(
                      Math.min(DIA_MES_MAXIMO, Math.max(1, Number(evento.target.value) || 1)),
                    )
                  }
                  className="min-h-12 rounded-card border border-border bg-surface px-3 text-on-surface outline-none focus:border-brand"
                />
              </label>
              <span id="pista-dia-mes" className="text-xs">
                {t("dayOfMonthHint")}
              </span>
            </div>
          ) : (
            <label className="flex flex-col gap-1 text-sm text-on-surface-muted">
              {t("weekdayLabel")}
              <select
                value={weekday}
                onChange={(evento) => setWeekday(Number(evento.target.value))}
                className="min-h-12 rounded-card border border-border bg-surface px-3 text-on-surface outline-none focus:border-brand"
              >
                {DIAS_SEMANA.map((dia) => (
                  <option key={dia} value={dia}>
                    {nombreDia(dia, locale)}
                  </option>
                ))}
              </select>
            </label>
          )}

          <button
            type="submit"
            disabled={!templateId || !titulo.trim() || guardando}
            className="h-tap rounded-full bg-brand font-semibold text-brand-contrast disabled:opacity-50"
          >
            {guardando ? t("creating") : t("create")}
          </button>
        </form>
      )}

      {programadas.length === 0 ? (
        <div className="flex flex-col gap-2 rounded-card border border-dashed border-border p-6 text-center">
          <p className="font-medium text-on-surface">{t("emptyTitle")}</p>
          <p className="text-sm text-on-surface-muted">{t("emptyBody")}</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {programadas.map((fila) => (
            <li
              key={fila.id}
              className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-semibold text-on-surface">{fila.title}</h3>
                {!fila.active && (
                  <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-on-surface-muted">
                    {t("paused")}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-0.5 text-sm text-on-surface-muted">
                <span>{describir(fila)}</span>
                <span>{t("fromTemplate", { name: fila.templateTitle })}</span>
                {fila.active && (
                  <span className="text-on-surface">
                    {t("next", { date: fechaLarga(fila.nextRunOn, locale) })} (
                    {t("inDays", { days: diasHasta(fila.nextRunOn, hoy) })})
                  </span>
                )}
                <span>
                  {fila.lastRunOn
                    ? t("lastRun", { date: fechaLarga(fila.lastRunOn, locale) })
                    : t("lastNever")}
                </span>
              </div>

              {borrando === fila.id ? (
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
                      onClick={() => borrar(fila)}
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
                    onClick={() => crearAhora(fila)}
                    disabled={ocupada !== null}
                    className="h-10 flex-1 rounded-full bg-brand px-4 text-sm font-semibold text-brand-contrast disabled:opacity-50"
                  >
                    {ocupada === fila.id ? t("running") : t("runNow")}
                  </button>
                  <button
                    type="button"
                    onClick={() => cambiarActiva(fila)}
                    className="h-10 rounded-full border border-border px-4 text-sm font-medium text-on-surface"
                  >
                    {fila.active ? t("pause") : t("resume")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setBorrando(fila.id)}
                    className="h-10 rounded-full border border-border px-4 text-sm font-medium text-on-surface-muted"
                  >
                    {t("delete")}
                  </button>
                </div>
              )}

              {fila.lastListId && (
                <a
                  href={`/l/${fila.lastListId}`}
                  className="text-sm font-medium text-brand underline"
                >
                  {t("openLast")}
                </a>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="text-sm text-on-surface-muted">{t("howItWorks")}</p>
    </div>
  );
}

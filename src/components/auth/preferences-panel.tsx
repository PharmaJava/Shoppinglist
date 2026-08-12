"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import {
  CURRENCIES,
  type CurrencyCode,
  DEFAULT_PREFERENCES,
  fetchPreferences,
  isCurrencyCode,
  type Preferences,
  updatePreferences,
} from "@/features/account/preferences";
import { useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import type { Locale } from "@/lib/supabase/types";

/**
 * Idioma y moneda.
 *
 * El idioma cambia la interfaz **y** se guarda: las notificaciones push las
 * compone el servidor, que no tiene otra forma de saber en qué idioma escribir
 * (docs/07-PUSH.md). La moneda se aplica a las listas nuevas.
 */
export function PreferencesPanel() {
  const t = useTranslations("preferences");
  const localeActual = useLocale() as Locale;
  const router = useRouter();
  const [navegando, startTransition] = useTransition();

  const [prefs, setPrefs] = useState<Preferences>({
    ...DEFAULT_PREFERENCES,
    locale: localeActual,
  });
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPreferences()
      .then(setPrefs)
      .catch(() => {
        // Sin perfil legible se enseñan los valores por defecto: es preferible
        // a una sección que no aparece y deja la página con un hueco.
      });
  }, []);

  async function guardar(cambios: Partial<Preferences>) {
    setPrefs((actuales) => ({ ...actuales, ...cambios }));
    setError(null);
    try {
      await updatePreferences(cambios);
      setGuardado(true);
      setTimeout(() => setGuardado(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  function cambiarIdioma(locale: Locale) {
    void guardar({ locale });
    // Y además se navega, que es lo que se espera ver al instante. Destino
    // fijo `/cuenta` porque este panel sólo se enseña ahí: pasar el pathname
    // actual obligaría a arrastrar los parámetros de las rutas dinámicas.
    startTransition(() => router.replace("/cuenta", { locale }));
  }

  return (
    <section className="flex w-full flex-col gap-4 rounded-card border border-border p-5">
      <div>
        <h2 className="font-semibold text-on-surface">{t("title")}</h2>
        <p className="text-sm text-on-surface-muted">{t("body")}</p>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-on-surface">{t("languageLabel")}</span>
        <div className="flex gap-2">
          {routing.locales.map((locale) => (
            <button
              key={locale}
              type="button"
              onClick={() => cambiarIdioma(locale)}
              disabled={navegando}
              aria-pressed={locale === localeActual}
              className={`h-tap flex-1 rounded-full border text-sm font-semibold disabled:opacity-60 ${
                locale === localeActual
                  ? "border-brand bg-brand text-brand-contrast"
                  : "border-border text-on-surface"
              }`}
            >
              {t(locale === "es" ? "languageEs" : "languageEn")}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="moneda" className="text-sm font-medium text-on-surface">
          {t("currencyLabel")}
        </label>
        <select
          id="moneda"
          value={prefs.currency}
          onChange={(evento) => {
            const valor = evento.target.value;
            if (isCurrencyCode(valor)) void guardar({ currency: valor as CurrencyCode });
          }}
          className="min-h-12 rounded-card border border-border bg-surface px-3 text-on-surface outline-none focus:border-brand"
        >
          {CURRENCIES.map((moneda) => (
            <option key={moneda.code} value={moneda.code}>
              {moneda.label} ({moneda.code})
            </option>
          ))}
        </select>
        {/* Si no se dijera, cambiar la moneda parecería roto: las listas que ya
            existen se quedan como estaban, y con razón. */}
        <p className="text-xs text-on-surface-muted">{t("currencyHint")}</p>
      </div>

      {guardado && <p className="text-sm font-medium text-brand">{t("saved")}</p>}
      {error && (
        <p role="alert" className="text-sm font-medium text-accent">
          {error}
        </p>
      )}
    </section>
  );
}

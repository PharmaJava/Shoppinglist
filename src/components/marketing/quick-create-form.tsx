"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { createListFromInput } from "@/features/list/api";
import type { Locale } from "@/lib/supabase/types";

export function QuickCreateForm() {
  const t = useTranslations("landing");
  const tList = useTranslations("list");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [value, setValue] = useState("");
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const name = value.trim();
    if (!name || pending) return;

    setPending(true);
    setErrorMessage(null);
    try {
      const list = await createListFromInput(name, locale, tList("untitled"));
      router.push(`/l/${list.id}`);
    } catch (err) {
      console.error("No se pudo crear la lista:", err);
      setErrorMessage(err instanceof Error ? err.message : String(err));
      setPending(false);
    }
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={t("quickAddPlaceholder")}
          autoComplete="off"
          className="h-tap flex-1 rounded-full border border-border bg-surface px-5 text-base text-on-surface outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
        />
        <button
          type="submit"
          disabled={!value.trim() || pending}
          className="h-tap shrink-0 rounded-full bg-brand px-6 font-semibold text-brand-contrast disabled:opacity-50"
        >
          {pending ? t("creating") : t("createButton")}
        </button>
      </form>
      {errorMessage && (
        <p role="alert" className="text-sm text-red-600">
          {t("createError")} <span className="text-red-500/80">({errorMessage})</span>
        </p>
      )}
    </div>
  );
}

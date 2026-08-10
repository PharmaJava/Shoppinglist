"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { createListFromTemplate, type TemplateListItem } from "@/features/list/api";
import type { Locale } from "@/lib/supabase/types";

interface UseTemplateButtonProps {
  title: string;
  items: TemplateListItem[];
}

export function UseTemplateButton({ title, items }: UseTemplateButtonProps) {
  const t = useTranslations("templatesPage");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleClick() {
    if (pending) return;

    setPending(true);
    setErrorMessage(null);
    try {
      const list = await createListFromTemplate(title, items, locale);
      router.push(`/l/${list.id}`);
    } catch (err) {
      console.error("No se pudo crear la lista desde la plantilla:", err);
      setErrorMessage(err instanceof Error ? err.message : String(err));
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="h-tap rounded-full bg-brand px-6 font-semibold text-brand-contrast disabled:opacity-50"
      >
        {pending ? t("using") : t("use")}
      </button>
      <p className="text-sm text-on-surface-muted">{t("useHelp")}</p>
      {errorMessage && (
        <p role="alert" className="text-sm text-red-600">
          {t("useError")} <span className="text-red-500/80">({errorMessage})</span>
        </p>
      )}
    </div>
  );
}

"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useSession } from "@/features/auth/use-session";
import { createList, fetchMyLists, type ListSummary } from "@/features/list/api";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/lib/supabase/types";

export function MyListsClient() {
  const t = useTranslations("myLists");
  const session = useSession();

  const query = useQuery({ queryKey: ["my-lists"], queryFn: fetchMyLists });

  return (
    <div className="flex w-full flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-on-surface sm:text-4xl">
          {t("title")}
        </h1>
        <p className="text-on-surface-muted">{t("subtitle")}</p>
      </header>

      {/* A un invitado le importa saber que esto no sobrevive a cambiar de
          móvil; a quien ya tiene cuenta, decírselo sólo sería ruido. */}
      {session.status === "guest" && (
        <div className="flex flex-col items-start gap-2 rounded-card bg-brand/10 p-4">
          <p className="text-sm text-on-surface">{t("guestWarning")}</p>
          <Link href="/cuenta" className="text-sm font-semibold text-brand underline">
            {t("guestWarningCta")}
          </Link>
        </div>
      )}

      <NewListForm />

      {query.isPending && <p className="text-on-surface-muted">{t("loading")}</p>}

      {query.isError && (
        <div className="flex flex-col items-start gap-2">
          <p role="alert" className="text-sm text-red-600">
            {t("error")}
          </p>
          <button
            type="button"
            onClick={() => query.refetch()}
            className="text-sm font-semibold text-brand underline"
          >
            {t("retry")}
          </button>
        </div>
      )}

      {query.data && query.data.length === 0 && (
        <div className="flex flex-col gap-1 rounded-card bg-surface-muted p-6 text-center">
          <p className="font-medium text-on-surface">{t("empty")}</p>
          <p className="text-sm text-on-surface-muted">{t("emptyCta")}</p>
        </div>
      )}

      {query.data && query.data.length > 0 && (
        <ul className="flex flex-col gap-3">
          {query.data.map((summary) => (
            <ListCard key={summary.list.id} summary={summary} />
          ))}
        </ul>
      )}
    </div>
  );
}

function ListCard({ summary }: { summary: ListSummary }) {
  const t = useTranslations("myLists");
  const format = useFormatter();
  const { list, totalItems, checkedItems } = summary;
  const percent = totalItems === 0 ? 0 : Math.round((checkedItems / totalItems) * 100);

  return (
    <li>
      <a
        href={`/l/${list.id}`}
        className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4 transition-colors hover:bg-surface-muted"
      >
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-semibold text-on-surface">{list.title}</span>
          <span className="shrink-0 text-sm text-on-surface-muted">
            {totalItems === 0
              ? t("emptyList")
              : t("progress", { checked: checkedItems, total: totalItems })}
          </span>
        </div>

        {totalItems > 0 && (
          <div
            className="h-1.5 w-full overflow-hidden rounded-full bg-surface-muted"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="h-full rounded-full bg-brand" style={{ width: `${percent}%` }} />
          </div>
        )}

        <span className="text-xs text-on-surface-muted">
          {t("updated", { date: format.relativeTime(new Date(list.updated_at)) })}
        </span>
      </a>
    </li>
  );
}

function NewListForm() {
  const t = useTranslations("myLists");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const value = title.trim();
    if (!value || pending) return;

    setPending(true);
    setErrorMessage(null);
    try {
      const list = await createList(value);
      // La caché queda obsoleta en cuanto se crea; invalidar aquí evita que al
      // volver atrás desde la lista nueva aparezca la relación sin ella.
      await queryClient.invalidateQueries({ queryKey: ["my-lists"] });
      router.push(`/l/${list.id}`);
    } catch (err) {
      console.error("No se pudo crear la lista:", err);
      setErrorMessage(err instanceof Error ? err.message : String(err));
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="new-list-title" className="sr-only">
          {t("newList")}
        </label>
        <input
          id="new-list-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={t("newListPlaceholder")}
          autoComplete="off"
          lang={locale}
          className="h-tap flex-1 rounded-full border border-border bg-surface px-5 text-base text-on-surface outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
        />
        <button
          type="submit"
          disabled={!title.trim() || pending}
          className="h-tap shrink-0 rounded-full bg-brand px-6 font-semibold text-brand-contrast disabled:opacity-50"
        >
          {pending ? t("creating") : t("create")}
        </button>
      </div>
      {errorMessage && (
        <p role="alert" className="text-sm text-red-600">
          {t("createError")} <span className="text-red-500/80">({errorMessage})</span>
        </p>
      )}
    </form>
  );
}

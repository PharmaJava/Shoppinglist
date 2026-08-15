"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useSession } from "@/features/auth/use-session";
import {
  createList,
  duplicateList,
  fetchMyLists,
  type ListSummary,
  setListArchived,
} from "@/features/list/api";
import { estadoFinal, horasRestantes } from "@/features/list/auto-finish";
import { normalizeProductName } from "@/features/list/categorize";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/lib/supabase/types";

export function MyListsClient() {
  const t = useTranslations("myLists");
  const session = useSession();
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const query = useQuery({ queryKey: ["my-lists"], queryFn: fetchMyLists });

  const { active, archived } = useMemo(() => {
    const term = normalizeProductName(search);
    const matches = (summary: ListSummary) =>
      term === "" || normalizeProductName(summary.list.title).includes(term);

    const all = (query.data ?? []).filter(matches);
    return {
      active: all.filter((summary) => !summary.list.archived_at),
      archived: all.filter((summary) => summary.list.archived_at),
    };
  }, [query.data, search]);

  // El buscador sólo aparece cuando hay listas suficientes para perderse.
  const showSearch = (query.data?.length ?? 0) > 4;

  return (
    <div className="flex w-full flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-on-surface sm:text-4xl">
          {t("title")}
        </h1>
        <p className="text-on-surface-muted">{t("subtitle")}</p>
        <Link href="/mis-plantillas" className="text-sm font-medium text-brand underline">
          {t("myTemplatesLink")}
        </Link>
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

      {showSearch && (
        <div className="flex flex-col gap-1">
          <label htmlFor="list-search" className="sr-only">
            {t("searchLabel")}
          </label>
          <input
            id="list-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("searchPlaceholder")}
            className="h-tap w-full rounded-full border border-border bg-surface px-5 text-base text-on-surface outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
          />
        </div>
      )}

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

      {query.data && query.data.length > 0 && active.length === 0 && archived.length === 0 && (
        <p className="text-on-surface-muted">{t("noResults")}</p>
      )}

      {active.length > 0 && (
        <ul className="flex flex-col gap-3">
          {active.map((summary) => (
            <ListCard key={summary.list.id} summary={summary} />
          ))}
        </ul>
      )}

      {archived.length > 0 && (
        <section className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setShowArchived((current) => !current)}
            aria-expanded={showArchived}
            className="self-start text-sm font-semibold text-on-surface-muted underline"
          >
            {t("archivedSection", { count: archived.length })}
          </button>
          {showArchived && (
            <ul className="flex flex-col gap-3">
              {archived.map((summary) => (
                <ListCard key={summary.list.id} summary={summary} />
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

function ListCard({ summary }: { summary: ListSummary }) {
  const t = useTranslations("myLists");
  const tFin = useTranslations("autoFinish");
  const format = useFormatter();
  const locale = useLocale() as Locale;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { list, totalItems, checkedItems } = summary;
  const percent = totalItems === 0 ? 0 : Math.round((checkedItems / totalItems) * 100);
  const isArchived = Boolean(list.archived_at);

  const archive = useMutation({
    mutationFn: () => setListArchived(list, !isArchived),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-lists"] }),
  });

  const duplicate = useMutation({
    mutationFn: () => duplicateList(list.id, t("copyTitle", { title: list.title }), locale),
    onSuccess: async (copy) => {
      await queryClient.invalidateQueries({ queryKey: ["my-lists"] });
      router.push(`/l/${copy.id}`);
    },
  });

  const busy = archive.isPending || duplicate.isPending;

  return (
    <li className="flex flex-col rounded-card border border-border bg-surface">
      <a href={`/l/${list.id}`} className="flex flex-col gap-3 p-4 hover:bg-surface-muted">
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
          {/* La cuenta atrás también aquí: el panel es donde se ve cuál de las
              listas se cierra hoy, y da tiempo a hacer algo al respecto. */}
          {estadoFinal(list, new Date()) === "pronto" &&
            ` · ${tFin("cardSoon", { hours: horasRestantes(list, new Date()) })}`}
        </span>
      </a>

      {/* Fuera del enlace: un botón dentro de un `<a>` no es HTML válido y el
          lector de pantalla no sabría qué está activando. */}
      <div className="flex flex-wrap gap-4 border-t border-border px-4 py-2.5">
        <button
          type="button"
          disabled={busy}
          onClick={() => duplicate.mutate()}
          className="text-sm font-semibold text-brand underline disabled:opacity-50"
        >
          {duplicate.isPending ? t("duplicating") : t("duplicate")}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => archive.mutate()}
          className="text-sm font-semibold text-on-surface-muted underline disabled:opacity-50"
        >
          {isArchived ? t("unarchive") : t("archive")}
        </button>
        {(archive.isError || duplicate.isError) && (
          <p role="alert" className="w-full text-sm text-red-600">
            {t("actionError")}
          </p>
        )}
      </div>
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
          className="h-tap w-full rounded-full border border-border bg-surface px-5 sm:flex-1 text-base text-on-surface outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
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

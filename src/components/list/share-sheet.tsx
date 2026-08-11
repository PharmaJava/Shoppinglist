"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import type { ListMember } from "@/features/list/api";
import { fetchListMembers, getOrCreateActiveInvite } from "@/features/list/api";
import { listToText } from "@/features/list/to-text";
import { useCategories } from "@/features/list/use-categories";
import { useList } from "@/features/list/use-list";
import { SITE_URL } from "@/lib/seo/site";
import type { Locale } from "@/lib/supabase/types";

export function ShareSheet({ listId, onClose }: { listId: string; onClose: () => void }) {
  const t = useTranslations("list");
  const locale = useLocale() as Locale;
  const [url, setUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [textCopied, setTextCopied] = useState(false);
  const [members, setMembers] = useState<ListMember[]>([]);

  // Ambas ya están en caché: es la misma consulta que pinta la lista de fondo.
  const { data } = useList(listId);
  const { data: categories } = useCategories();

  useEffect(() => {
    let cancelled = false;
    getOrCreateActiveInvite(listId).then((token) => {
      if (!cancelled) setUrl(`${SITE_URL}/i/${token}`);
    });
    // Los miembros no bloquean el compartir: si fallan, la hoja sigue siendo
    // útil para lo que se ha abierto.
    fetchListMembers(listId)
      .then((list) => {
        if (!cancelled) setMembers(list);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [listId]);

  async function handleCopy() {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  /**
   * Copia el contenido, no el enlace. Es lo que la gente hace igualmente
   * —reescribir la lista en el chat del grupo— y a veces es lo que toca: el
   * enlace invita a editar, y hay quien sólo necesita leerla.
   */
  async function handleCopyText() {
    const text = buildText();
    if (!text) return;

    // Si hay compartir nativo, mejor: sale el selector del sistema y va
    // directo al chat sin pasar por el portapapeles.
    if (navigator.share) {
      await navigator.share({ text, title: data?.list.title });
      return;
    }
    await navigator.clipboard.writeText(text);
    setTextCopied(true);
    setTimeout(() => setTextCopied(false), 2000);
  }

  function buildText(): string | null {
    if (!data || !categories) return null;
    return listToText({
      title: data.list.title,
      items: data.items,
      categories,
      locale,
      checkedLabel: t("checkedSection"),
      otherLabel: t("otherCategory"),
    });
  }

  function handlePrint() {
    // Cerrar antes de imprimir: aunque la hoja no se imprime, el diálogo del
    // sistema aparecería sobre ella y al volver seguiría abierta encima de lo
    // que se acaba de mandar al papel.
    onClose();
    requestAnimationFrame(() => window.print());
  }

  async function handleNativeShare() {
    if (!url) return;
    if (navigator.share) {
      await navigator.share({ url, title: t("shareTitle") });
    } else {
      handleCopy();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center print:hidden">
      <button
        type="button"
        aria-label={t("shareTitle")}
        className="absolute inset-0"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-t-2xl bg-surface-raised p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-xl sm:rounded-2xl">
        <h2 className="mb-1 text-lg font-semibold">{t("shareTitle")}</h2>
        <p className="mb-4 text-sm text-on-surface-muted">{t("shareHelp")}</p>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={handleNativeShare}
            disabled={!url}
            className="flex h-tap items-center justify-center rounded-xl bg-brand px-4 font-medium text-brand-contrast disabled:opacity-50"
          >
            {t("shareNative")}
          </button>

          {url && (
            <a
              href={`https://wa.me/?text=${encodeURIComponent(url)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-tap items-center justify-center rounded-xl bg-[#25D366] px-4 font-medium text-white"
            >
              {t("shareWhatsapp")}
            </a>
          )}

          <button
            type="button"
            onClick={handleCopy}
            disabled={!url}
            className="flex h-tap items-center justify-center rounded-xl border border-border px-4 font-medium text-on-surface disabled:opacity-50"
          >
            {copied ? t("shareCopied") : t("shareCopy")}
          </button>
        </div>

        {/* Sacar la lista de la aplicación, no invitar a nadie: por eso van
            separadas del bloque de arriba. */}
        <div className="mt-4 flex gap-2 border-border border-t pt-4">
          <button
            type="button"
            onClick={handleCopyText}
            disabled={!data || !categories}
            className="flex h-tap flex-1 items-center justify-center rounded-xl border border-border px-3 text-sm font-medium text-on-surface disabled:opacity-50"
          >
            {textCopied ? t("shareCopied") : t("shareAsText")}
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex h-tap flex-1 items-center justify-center rounded-xl border border-border px-3 text-sm font-medium text-on-surface"
          >
            {t("print")}
          </button>
        </div>

        {members.length > 1 && (
          <section className="mt-5 border-border border-t pt-4">
            <h3 className="mb-2 font-semibold text-sm text-on-surface">{t("members")}</h3>
            <ul className="flex flex-wrap gap-2">
              {members.map((member) => (
                <li
                  key={member.userId}
                  className="rounded-full bg-surface-muted px-3 py-1 text-sm text-on-surface"
                >
                  {member.isMe ? t("memberYou") : member.displayName || t("memberUnnamed")}
                  {member.role === "owner" && (
                    <span className="ml-1 text-on-surface-muted text-xs">{t("memberOwner")}</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

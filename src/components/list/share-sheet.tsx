"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import type { ListMember } from "@/features/list/api";
import { fetchListMembers, getOrCreateActiveInvite } from "@/features/list/api";
import { listToText } from "@/features/list/to-text";
import { useCategories } from "@/features/list/use-categories";
import { useList } from "@/features/list/use-list";
import { SITE_URL } from "@/lib/seo/site";
import type { ListRole, Locale } from "@/lib/supabase/types";
import { MembersPanel } from "./members-panel";
import { PushToggle } from "./push-toggle";

/**
 * Dirección del enlace de invitación.
 *
 * Manda el dominio canónico. Se intentó armarlo con el origen del navegador
 * para que una previsualización compartiera enlaces de sí misma, y es un mal
 * negocio: basta con abrir la aplicación desde `*.vercel.app`, desde `www.` o
 * desde cualquier alias para repartir enlaces a un dominio que quizá no
 * resuelve para quien los recibe. El origen sólo se usa cuando no hay dominio
 * configurado, que es el caso de desarrollo.
 */
function inviteUrl(token: string): string {
  const base = SITE_URL.includes("localhost") ? window.location.origin : SITE_URL;
  return `${base}/i/${token}`;
}

export function ShareSheet({ listId, onClose }: { listId: string; onClose: () => void }) {
  const t = useTranslations("list");
  const locale = useLocale() as Locale;
  const [url, setUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [textCopied, setTextCopied] = useState(false);
  const [members, setMembers] = useState<ListMember[]>([]);
  const [inviteRole, setInviteRole] = useState<ListRole>("editor");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [retries, setRetries] = useState(0);

  // Ambas ya están en caché: es la misma consulta que pinta la lista de fondo.
  const { data } = useList(listId);
  const { data: categories } = useCategories();

  // `undefined` mientras no se sepa: sólo se afirma que alguien no es
  // propietario cuando los miembros han llegado de verdad.
  const iAmOwner =
    members.length === 0 ? undefined : members.some((m) => m.isMe && m.role === "owner");

  const loadMembers = useCallback(() => {
    // Los miembros no bloquean el compartir: si fallan, la hoja sigue siendo
    // útil para lo que se ha abierto.
    fetchListMembers(listId)
      .then(setMembers)
      .catch(() => {});
  }, [listId]);

  useEffect(() => {
    let cancelled = false;
    // El enlace se pide cada vez que cambia el rol: el de lectura y el de
    // edición son dos invitaciones distintas, no la misma con una etiqueta.
    setUrl(null);
    setInviteError(null);

    getOrCreateActiveInvite(listId, inviteRole)
      .then((token) => {
        if (!cancelled) setUrl(inviteUrl(token));
      })
      .catch((err: unknown) => {
        // Sin este `catch`, un fallo dejaba los botones en gris para siempre y
        // sin una sola pista: indistinguible de «está cargando». Quien lo
        // sufría sólo podía decir «al compartir falla».
        if (!cancelled) setInviteError(err instanceof Error ? err.message : String(err));
      });

    return () => {
      cancelled = true;
    };
  }, [listId, inviteRole, retries]);

  useEffect(loadMembers, [loadMembers]);

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

        {/* Quien recibe el enlace entra con este rol. Un lector ve la lista y
            no puede tocarla, que es lo que hace falta para enseñarla. */}
        <fieldset className="mb-3 flex items-center gap-2">
          <legend className="sr-only">{t("inviteRole")}</legend>
          {(["editor", "viewer"] as const).map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setInviteRole(role)}
              aria-pressed={inviteRole === role}
              className="rounded-full border border-border px-3 py-1.5 text-sm text-on-surface aria-pressed:border-brand aria-pressed:bg-brand/10 aria-pressed:font-semibold"
            >
              {role === "editor" ? t("roleEditor") : t("roleViewer")}
            </button>
          ))}
        </fieldset>

        {inviteError && (
          <div className="mb-3 flex flex-col items-start gap-2 rounded-card bg-red-50 p-3">
            <p role="alert" className="text-red-700 text-sm">
              {iAmOwner === false ? t("shareOnlyOwner") : t("shareError")}
            </p>
            {iAmOwner !== false && (
              <button
                type="button"
                onClick={() => setRetries((count) => count + 1)}
                className="font-semibold text-red-700 text-sm underline"
              >
                {t("retry")}
              </button>
            )}
            <p className="text-red-600/80 text-xs">{inviteError}</p>
          </div>
        )}

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

        {members.length > 0 && (
          <MembersPanel listId={listId} members={members} onChanged={loadMembers} />
        )}

        <PushToggle />
      </div>
    </div>
  );
}

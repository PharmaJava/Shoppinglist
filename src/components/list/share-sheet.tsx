"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { getOrCreateActiveInvite } from "@/features/list/api";
import { SITE_URL } from "@/lib/seo/site";

export function ShareSheet({ listId, onClose }: { listId: string; onClose: () => void }) {
  const t = useTranslations("list");
  const [url, setUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getOrCreateActiveInvite(listId).then((token) => {
      if (!cancelled) setUrl(`${SITE_URL}/i/${token}`);
    });
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

  async function handleNativeShare() {
    if (!url) return;
    if (navigator.share) {
      await navigator.share({ url, title: t("shareTitle") });
    } else {
      handleCopy();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
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
      </div>
    </div>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { usePendingSync } from "@/features/list/use-pending-sync";

export function SyncStatusBanner() {
  const t = useTranslations("list");
  const { isOffline, pendingCount } = usePendingSync();

  if (!isOffline && pendingCount === 0) return null;

  return (
    <div
      role="status"
      className="border-b border-border bg-surface-muted px-4 py-1.5 text-center text-xs text-on-surface-muted print:hidden"
    >
      {isOffline ? t("offline") : t("pendingChanges", { count: pendingCount })}
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { joinListByToken } from "@/features/list/api";

export function InviteClient({ token }: { token: string }) {
  const t = useTranslations("invite");
  const router = useRouter();
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    joinListByToken(token)
      .then((listId) => {
        if (!cancelled) router.replace(`/l/${listId}`);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [token, router]);

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-on-surface-muted">{t("invalid")}</p>
        <a href="/" className="font-medium text-brand underline">
          {t("backHome")}
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center p-6 text-on-surface-muted">
      {t("joining")}
    </div>
  );
}

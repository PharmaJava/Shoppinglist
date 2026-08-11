"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  type ListMember,
  removeMember,
  setMemberRole,
  transferOwnership,
} from "@/features/list/api";
import type { ListRole } from "@/lib/supabase/types";

interface MembersPanelProps {
  listId: string;
  members: ListMember[];
  onChanged: () => void;
}

/**
 * Quién está en la lista y qué puede hacer.
 *
 * Sólo el propietario ve los controles; el resto ve los nombres y su propia
 * puerta de salida. Traspasar pide confirmación porque es la única acción
 * aquí que no se puede deshacer desde este mismo panel: después del traspaso,
 * quien la ejecuta ya no manda.
 */
export function MembersPanel({ listId, members, onChanged }: MembersPanelProps) {
  const t = useTranslations("list");
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmTransfer, setConfirmTransfer] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const me = members.find((member) => member.isMe);
  const iAmOwner = me?.role === "owner";

  async function run(userId: string, action: () => Promise<void>) {
    if (busy) return;
    setBusy(userId);
    setErrorMessage(null);
    try {
      await action();
      onChanged();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
      setConfirmTransfer(null);
    }
  }

  function label(member: ListMember): string {
    if (member.isMe) return t("memberYou");
    return member.displayName || t("memberUnnamed");
  }

  return (
    <section className="mt-5 border-border border-t pt-4">
      <h3 className="mb-2 font-semibold text-on-surface text-sm">{t("members")}</h3>

      <ul className="flex flex-col gap-2">
        {members.map((member) => (
          <li key={member.userId} className="flex flex-wrap items-center gap-2">
            <span className="min-w-0 flex-1 truncate text-on-surface text-sm">
              {label(member)}
              {member.role === "owner" && (
                <span className="ml-1 text-on-surface-muted text-xs">{t("memberOwner")}</span>
              )}
            </span>

            {iAmOwner && member.role !== "owner" && (
              <>
                <label className="sr-only" htmlFor={`role-${member.userId}`}>
                  {t("memberRole")}
                </label>
                <select
                  id={`role-${member.userId}`}
                  value={member.role}
                  disabled={busy !== null}
                  onChange={(event) =>
                    run(member.userId, () =>
                      setMemberRole(listId, member.userId, event.target.value as ListRole),
                    )
                  }
                  className="h-9 rounded-lg border border-border bg-surface px-2 text-sm text-on-surface"
                >
                  <option value="editor">{t("roleEditor")}</option>
                  <option value="viewer">{t("roleViewer")}</option>
                </select>

                {confirmTransfer === member.userId ? (
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() =>
                      run(member.userId, () => transferOwnership(listId, member.userId))
                    }
                    className="text-sm font-semibold text-red-600 underline disabled:opacity-50"
                  >
                    {t("memberTransferConfirm")}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => setConfirmTransfer(member.userId)}
                    className="text-on-surface-muted text-sm underline disabled:opacity-50"
                  >
                    {t("memberTransfer")}
                  </button>
                )}

                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => run(member.userId, () => removeMember(listId, member.userId))}
                  aria-label={t("memberRemove", { name: label(member) })}
                  className="text-red-600 text-sm underline disabled:opacity-50"
                >
                  {t("memberRemoveShort")}
                </button>
              </>
            )}

            {member.isMe && !iAmOwner && (
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => run(member.userId, () => removeMember(listId, member.userId))}
                className="text-red-600 text-sm underline disabled:opacity-50"
              >
                {t("memberLeave")}
              </button>
            )}
          </li>
        ))}
      </ul>

      {confirmTransfer && (
        <p className="mt-2 text-on-surface-muted text-xs">{t("memberTransferWarning")}</p>
      )}

      {errorMessage && (
        <p role="alert" className="mt-2 text-red-600 text-sm">
          {t("memberError")}
        </p>
      )}
    </section>
  );
}

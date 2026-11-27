"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type { ListItem, ListSection } from "@/features/list/types";
import { useDeleteSection, useRenameSection } from "@/features/list/use-list-mutations";
import { ItemRow } from "./item-row";

/**
 * El cuerpo de una lista de equipaje: una sección tras otra, cada una con lo
 * suyo.
 *
 * A diferencia de la compra, lo marcado **se queda en su sección**: en el súper
 * lo comprado deja de importar y se va abajo, pero al hacer una maleta lo que
 * importa es ver de un vistazo que «Mochila niños» está completa.
 */
export function PackingSections({
  listId,
  sections,
  items,
  onDeleted,
  onAddHere,
}: {
  listId: string;
  sections: ListSection[];
  items: ListItem[];
  onDeleted: (item: ListItem) => void;
  onAddHere: (sectionId: string) => void;
}) {
  const t = useTranslations("packing");
  const known = new Set(sections.map((section) => section.id));

  // Lo que no tiene sección —o la tiene borrada por otra persona mientras
  // tanto— no se esconde: se agrupa aparte, arriba, donde se ve.
  const loose = items.filter((item) => !item.section_id || !known.has(item.section_id));

  if (sections.length === 0 && items.length === 0) {
    return <p className="p-6 text-center text-on-surface-muted">{t("emptyIntro")}</p>;
  }

  return (
    <>
      {loose.length > 0 && (
        <section aria-label={t("noSection")}>
          <h2 className="sticky top-0 flex items-center bg-surface-muted px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-on-surface-muted">
            {t("noSection")}
            <span className="ml-auto tabular-nums">{countLabel(loose)}</span>
          </h2>
          <ItemList listId={listId} items={loose} onDeleted={onDeleted} />
        </section>
      )}

      {sections.map((section) => (
        <SectionBlock
          key={section.id}
          listId={listId}
          section={section}
          items={items.filter((item) => item.section_id === section.id)}
          onDeleted={onDeleted}
          onAddHere={() => onAddHere(section.id)}
        />
      ))}
    </>
  );
}

function SectionBlock({
  listId,
  section,
  items,
  onDeleted,
  onAddHere,
}: {
  listId: string;
  section: ListSection;
  items: ListItem[];
  onDeleted: (item: ListItem) => void;
  onAddHere: () => void;
}) {
  const t = useTranslations("packing");
  const rename = useRenameSection(listId);
  const remove = useDeleteSection(listId);
  const [name, setName] = useState(section.name);
  const [confirming, setConfirming] = useState(false);

  function handleBlur() {
    const trimmed = name.trim();
    // Un nombre vacío no es un nombre: se vuelve al que tenía, que la base de
    // datos también rechazaría.
    if (!trimmed) {
      setName(section.name);
      return;
    }
    if (trimmed !== section.name) rename.mutate({ section, name: trimmed });
  }

  return (
    <section aria-label={section.name}>
      <div className="sticky top-0 z-[1] flex items-center gap-1 bg-surface-muted py-1 pr-2 pl-4">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          onBlur={handleBlur}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
          }}
          aria-label={t("renameSection", { name: section.name })}
          maxLength={80}
          className="min-w-0 flex-1 truncate bg-transparent text-xs font-semibold uppercase tracking-wide text-on-surface outline-none"
        />
        <span className="shrink-0 px-1 text-xs tabular-nums text-on-surface-muted">
          {countLabel(items)}
        </span>
        <button
          type="button"
          onClick={onAddHere}
          aria-label={t("addHere", { name: section.name })}
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-xl leading-none text-brand print:hidden"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => setConfirming(true)}
          aria-label={t("deleteSection", { name: section.name })}
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-on-surface-muted print:hidden"
        >
          <TrashIcon />
        </button>
      </div>

      {confirming && (
        <div
          role="alertdialog"
          aria-label={t("deleteSectionConfirm", { name: section.name })}
          className="flex flex-wrap items-center gap-2 border-b border-border bg-red-50 px-4 py-2 text-sm text-red-800"
        >
          <span className="flex-1">{t("deleteSectionConfirm", { name: section.name })}</span>
          <button
            type="button"
            onClick={() => remove.mutate(section)}
            className="rounded-full bg-red-600 px-4 py-1.5 font-semibold text-white"
          >
            {t("deleteSectionYes")}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="rounded-full border border-red-300 px-4 py-1.5 font-semibold"
          >
            {t("restartNo")}
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <p className="px-4 py-3 text-sm text-on-surface-muted">{t("sectionEmpty")}</p>
      ) : (
        <ItemList listId={listId} items={items} onDeleted={onDeleted} />
      )}
    </section>
  );
}

/** Lo pendiente primero y lo ya metido debajo, pero sin salir de la sección. */
function ItemList({
  listId,
  items,
  onDeleted,
}: {
  listId: string;
  items: ListItem[];
  onDeleted: (item: ListItem) => void;
}) {
  const ordered = [
    ...items.filter((item) => !item.is_checked),
    ...items.filter((item) => item.is_checked),
  ];

  return (
    <ul>
      {ordered.map((item) => (
        <ItemRow
          key={item.id}
          listId={listId}
          item={item}
          showPrice={false}
          onDeleted={onDeleted}
        />
      ))}
    </ul>
  );
}

function countLabel(items: ListItem[]): string {
  const checked = items.filter((item) => item.is_checked).length;
  return `${checked}/${items.length}`;
}

/**
 * La barra de abajo de una lista de equipaje.
 *
 * No hay «terminar»: una maleta no se cierra, se vuelve a hacer. Lo que hay es
 * **empezar de nuevo**, que desmarca todo y deja la lista lista para la
 * próxima vez. Se confirma antes, porque deshacer veinte marcas a mano en
 * mitad de hacer la maleta es justo lo que nadie quiere.
 */
export function PackingBar({
  checked,
  total,
  onRestart,
}: {
  checked: number;
  total: number;
  onRestart: () => void;
}) {
  const t = useTranslations("packing");
  const [confirming, setConfirming] = useState(false);

  if (total === 0) return null;

  return (
    <div className="flex items-center gap-3 border-t border-border bg-brand/10 px-4 py-2 print:hidden">
      <span className="min-w-0 flex-1 text-sm font-semibold text-on-surface">
        {confirming
          ? t("restartConfirm")
          : checked === total
            ? t("allPacked")
            : t("progress", { checked, total })}
      </span>

      {confirming ? (
        <>
          <button
            type="button"
            onClick={() => {
              onRestart();
              setConfirming(false);
            }}
            className="h-11 shrink-0 rounded-full bg-brand px-4 font-semibold text-brand-contrast"
          >
            {t("restartYes")}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="h-11 shrink-0 rounded-full border border-border px-4 font-semibold text-on-surface"
          >
            {t("restartNo")}
          </button>
        </>
      ) : (
        checked > 0 && (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="h-11 shrink-0 rounded-full bg-brand px-5 font-semibold text-brand-contrast"
          >
            {t("restart")}
          </button>
        )
      )}
    </div>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="size-5" aria-hidden="true">
      <path d="M7.5 2h5l.5 1.5H17V5H3V3.5h4L7.5 2ZM4.5 6.5h11l-.8 10.1A1.5 1.5 0 0 1 13.2 18H6.8a1.5 1.5 0 0 1-1.5-1.4L4.5 6.5Z" />
    </svg>
  );
}

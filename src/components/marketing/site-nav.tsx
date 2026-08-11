"use client";

import { useTranslations } from "next-intl";
import { useEffect, useId, useState } from "react";
import { Link } from "@/i18n/navigation";

const SECTIONS = [
  { href: "/plantillas", key: "templates" },
  { href: "/guias", key: "guides" },
  { href: "/blog", key: "blog" },
  { href: "/precios", key: "pricing" },
  { href: "/quienes-somos", key: "about" },
  { href: "/mis-listas", key: "myLists" },
] as const;

/**
 * Navegación de secciones del header.
 *
 * En pantalla ancha son enlaces sueltos; en móvil no caben junto al botón de
 * sesión, así que van detrás de un menú. Estaban sólo en el pie de página, que
 * en móvil queda a una pantalla larga de distancia: el blog y las plantillas
 * son el motor de captación, esconderlos ahí era tirar el trabajo.
 */
export function SiteNav() {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);
  const panelId = useId();

  // Escape cierra: es lo que espera cualquiera que abra un menú.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <nav className="hidden items-center gap-4 text-sm sm:flex" aria-label={t("sections")}>
        {SECTIONS.slice(0, 3).map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="text-on-surface-muted hover:text-on-surface"
          >
            {t(section.key)}
          </Link>
        ))}
      </nav>

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={t("menu")}
        // `order-last` lo manda al extremo derecho del header: junto al logo
        // parecía parte de la marca, no un control.
        className="order-last flex size-9 shrink-0 items-center justify-center rounded-full text-on-surface hover:bg-surface-muted sm:hidden"
      >
        {open ? <CloseIcon /> : <MenuIcon />}
      </button>

      {open && (
        <nav
          id={panelId}
          aria-label={t("sections")}
          // El header es `relative`: el panel cuelga de él a todo lo ancho, por
          // encima del contenido y sin desplazarlo.
          className="absolute inset-x-0 top-full z-20 flex flex-col border-b border-border bg-surface shadow-lg sm:hidden"
        >
          {SECTIONS.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              onClick={() => setOpen(false)}
              className="border-b border-border px-4 py-3 text-on-surface last:border-b-0 hover:bg-surface-muted"
            >
              {t(section.key)}
            </Link>
          ))}
        </nav>
      )}
    </>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="size-6" aria-hidden="true">
      <path d="M3 5h14v1.6H3V5Zm0 4.2h14v1.6H3V9.2ZM3 13.4h14V15H3v-1.6Z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="size-6" aria-hidden="true">
      <path d="m10 8.8 4.2-4.2 1.2 1.2L11.2 10l4.2 4.2-1.2 1.2L10 11.2l-4.2 4.2-1.2-1.2L8.8 10 4.6 5.8l1.2-1.2L10 8.8Z" />
    </svg>
  );
}

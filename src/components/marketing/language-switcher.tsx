"use client";

import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { routing } from "@/i18n/routing";

const LABELS: Record<string, string> = { es: "ES", en: "EN" };

/** Sustituye el segmento de idioma en la URL actual, preservando el resto de la ruta. */
function withLocale(pathname: string, locale: string): string {
  const segments = pathname.split("/");
  segments[1] = locale;
  return segments.join("/") || "/";
}

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1 text-sm font-medium">
      {routing.locales.map((loc) => (
        <a
          key={loc}
          href={withLocale(pathname, loc)}
          aria-current={loc === locale ? "true" : undefined}
          className="rounded-full px-2 py-1 text-on-surface-muted aria-current:text-on-surface aria-current:underline"
        >
          {LABELS[loc]}
        </a>
      ))}
    </div>
  );
}

import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/logo";
import { Link } from "@/i18n/navigation";

/**
 * 404 dentro del segmento de idioma, para que la página conserve cabecera,
 * pie e idioma en lugar del `not-found` genérico de la raíz.
 *
 * Sin `generateMetadata`: Next.js ya responde con 404, y un `noindex` explícito
 * es redundante — un buscador no indexa lo que no encuentra.
 */
export default async function LocaleNotFound() {
  const t = await getTranslations("notFound");

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 px-4 py-20 text-center sm:px-6">
      <Logo size={56} />
      <h1 className="text-3xl font-bold tracking-tight text-on-surface">{t("title")}</h1>
      <p className="text-on-surface-muted leading-relaxed">{t("body")}</p>

      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="h-tap flex items-center rounded-full bg-brand px-6 font-semibold text-brand-contrast"
        >
          {t("home")}
        </Link>
        <Link
          href="/plantillas"
          className="h-tap flex items-center rounded-full border border-border px-6 font-semibold text-on-surface"
        >
          {t("templates")}
        </Link>
      </div>
    </div>
  );
}

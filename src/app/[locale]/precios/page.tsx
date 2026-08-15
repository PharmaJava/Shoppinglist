import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { CheckoutButton } from "@/components/billing/checkout-button";
import { JsonLd } from "@/components/content/prose";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { PREMIUM_VISIBLE } from "@/lib/flags";
import { sectionUrl } from "@/lib/seo/urls";
import { precioPremium, stripeConfigurado } from "@/lib/stripe/server";

type Props = { params: Promise<{ locale: string }> };

const INCLUDED = [
  "included1",
  "included2",
  "included3",
  "included4",
  "included5",
  "included6",
] as const;
const PLANNED = ["planned1", "planned2", "planned3"] as const;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const t = await getTranslations({ locale, namespace: "pricing" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: sectionUrl("pricing", locale),
      languages: {
        "es-ES": sectionUrl("pricing", "es"),
        "en-US": sectionUrl("pricing", "en"),
        "x-default": sectionUrl("pricing", "en"),
      },
    },
    openGraph: {
      type: "website",
      locale: locale === "es" ? "es_ES" : "en_US",
      url: sectionUrl("pricing", locale),
      title: t("metaTitle"),
      description: t("metaDescription"),
    },
    twitter: {
      card: "summary_large_image",
      title: t("metaTitle"),
      description: t("metaDescription"),
    },
  };
}

export default async function PricingPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const t = await getTranslations({ locale, namespace: "pricing" });
  const tMeta = await getTranslations({ locale, namespace: "metadata" });

  /**
   * El precio se le pregunta a Stripe, que es donde de verdad manda. Sin
   * claves devuelve `null` y la página sigue diciendo «sin precio todavía»,
   * que es la verdad mientras no haya forma de pagar.
   *
   * Esta página es estática, así que la consulta ocurre al construirla: subir
   * el precio en Stripe exige un redespliegue para que se vea aquí. Es lo
   * correcto para una página de marketing —cero llamadas por visita— y está
   * anotado en docs/16-STRIPE.md.
   */
  const precio = await precioPremium(locale);

  // Sólo se declara la oferta que existe de verdad. Marcar premium como
  // `Offer` sin precio ni disponibilidad sería declarar un producto que no se
  // puede comprar, y eso es exactamente lo que penalizan los datos
  // estructurados engañosos (docs/02-SEO.md §2.2).
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: tMeta("siteName"),
      applicationCategory: "ShoppingApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: locale === "es" ? "EUR" : "USD",
        availability: "https://schema.org/InStock",
      },
      url: sectionUrl("pricing", locale),
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-12 px-4 py-12 sm:px-6">
      <JsonLd blocks={jsonLd} />

      <header className="flex flex-col gap-3 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-on-surface sm:text-4xl">
          {t("title")}
        </h1>
        <p className="text-lg text-on-surface-muted">{t("subtitle")}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="flex flex-col gap-4 rounded-card border-2 border-brand bg-surface p-6">
          <div className="flex flex-col gap-1">
            <h2 className="font-semibold text-on-surface">{t("freeTitle")}</h2>
            <p className="text-3xl font-bold text-on-surface">{t("freePrice")}</p>
            <p className="text-sm text-on-surface-muted">{t("freeNote")}</p>
          </div>

          <h3 className="font-semibold text-on-surface text-sm">{t("includedTitle")}</h3>
          <ul className="flex flex-col gap-2">
            {INCLUDED.map((key) => (
              <li key={key} className="flex gap-2 text-sm text-on-surface-muted">
                <span aria-hidden="true" className="text-brand">
                  ✓
                </span>
                {t(key)}
              </li>
            ))}
          </ul>

          <Link
            href="/"
            className="h-tap mt-auto flex items-center justify-center rounded-full bg-brand px-6 font-semibold text-brand-contrast"
          >
            {t("cta")}
          </Link>
        </section>

        <section className="flex flex-col gap-4 rounded-card border border-border bg-surface-muted p-6">
          <div className="flex flex-col gap-1">
            <h2 className="font-semibold text-on-surface">{t("premiumTitle")}</h2>
            <p className="text-3xl font-bold text-on-surface-muted">
              {precio
                ? precio.intervalo === "year"
                  ? t("perYear", { precio: precio.importe })
                  : t("perMonth", { precio: precio.importe })
                : t("premiumPrice")}
            </p>
            <p className="text-sm text-on-surface-muted">
              {precio ? t("premiumNoteLive") : t("premiumNote")}
            </p>
          </div>

          <h3 className="font-semibold text-on-surface text-sm">{t("plannedTitle")}</h3>
          <ul className="flex flex-col gap-2">
            {PLANNED.map((key) => (
              <li key={key} className="flex gap-2 text-sm text-on-surface-muted">
                <span aria-hidden="true">·</span>
                {t(key)}
              </li>
            ))}
          </ul>

          {/* Sólo hay botón si de verdad se puede pagar: con la Fase 3
              apagada o sin las claves de Stripe, esto no devuelve nada. */}
          <div className="mt-auto">
            <CheckoutButton disponible={PREMIUM_VISIBLE && stripeConfigurado()} />
          </div>
        </section>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-2xl font-bold tracking-tight text-on-surface">{t("whyTitle")}</h2>
        <p className="text-on-surface-muted leading-relaxed">{t("whyBody1")}</p>
        <p className="text-on-surface-muted leading-relaxed">{t("whyBody2")}</p>
      </section>
    </div>
  );
}

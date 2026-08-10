import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { JsonLd } from "@/components/content/prose";
import { ListMockup } from "@/components/marketing/list-mockup";
import { QuickCreateForm } from "@/components/marketing/quick-create-form";
import { getTemplates } from "@/content";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/seo/site";

const FAQ_KEYS = ["faq1", "faq2", "faq3", "faq4", "faq5"] as const;
const FEATURE_KEYS = [
  "feature1",
  "feature2",
  "feature3",
  "feature4",
  "feature5",
  "feature6",
] as const;
const FEATURE_ICONS = ["🔓", "⚡", "📶", "🛒", "🎙️", "📱"] as const;

export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const t = await getTranslations({ locale, namespace: "landing" });
  const tMeta = await getTranslations({ locale, namespace: "metadata" });

  const faq = FAQ_KEYS.map((key) => ({ question: t(`${key}Q`), answer: t(`${key}A`) }));

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: tMeta("siteName"),
      applicationCategory: "ShoppingApplication",
      operatingSystem: "Web",
      offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
      url: `${SITE_URL}/${locale}`,
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((entry) => ({
        "@type": "Question",
        name: entry.question,
        acceptedAnswer: { "@type": "Answer", text: entry.answer },
      })),
    },
  ];

  const steps = [
    { title: t("step1Title"), body: t("step1Body") },
    { title: t("step2Title"), body: t("step2Body") },
    { title: t("step3Title"), body: t("step3Body") },
  ];

  const features = FEATURE_KEYS.map((key, index) => ({
    icon: FEATURE_ICONS[index],
    title: t(`${key}Title`),
    body: t(`${key}Body`),
  }));

  return (
    <>
      <JsonLd blocks={jsonLd} />

      {/* Hero: texto + alta a la izquierda, maqueta del producto a la derecha. */}
      <section className="bg-gradient-to-b from-brand/10 to-transparent">
        <div className="mx-auto grid w-full max-w-5xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-20">
          <div className="flex flex-col items-start gap-6">
            <p className="text-sm font-medium uppercase tracking-wide text-brand">{t("eyebrow")}</p>
            <h1 className="text-4xl font-bold tracking-tight text-on-surface sm:text-5xl">
              {t("title")}
            </h1>
            <p className="text-lg text-on-surface-muted">{t("subtitle")}</p>
            <QuickCreateForm />
          </div>

          <div className="hidden justify-center lg:flex">
            <ListMockup locale={locale} title={t("demoListTitle")} badge={t("demoBadge")} />
          </div>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-5xl flex-col">
        {/* Características, en el orden en que duelen: registro, duplicados, cobertura. */}
        <section className="flex flex-col gap-6 px-4 py-12 sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight text-on-surface sm:text-3xl">
            {t("featuresTitle")}
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <li
                key={feature.title}
                className="flex flex-col gap-2 rounded-card border border-border bg-surface p-5"
              >
                <span aria-hidden="true" className="text-2xl">
                  {feature.icon}
                </span>
                <h3 className="font-semibold text-on-surface">{feature.title}</h3>
                <p className="text-sm text-on-surface-muted">{feature.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="flex flex-col gap-6 px-4 py-12 sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight text-on-surface sm:text-3xl">
            {t("howItWorksTitle")}
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="flex flex-col gap-2 rounded-card bg-surface-muted p-5"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-bold text-brand-contrast">
                  {index + 1}
                </span>
                <h3 className="font-semibold text-on-surface">{step.title}</h3>
                <p className="text-sm text-on-surface-muted">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-5 px-4 py-12 sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight text-on-surface sm:text-3xl">
            {t("templatesTitle")}
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {getTemplates(locale).map((template) => (
              <li key={template.slug}>
                <Link
                  href={{ pathname: "/plantillas/[slug]", params: { slug: template.slug } }}
                  className="flex h-full flex-col gap-1 rounded-card bg-surface-muted p-4 transition-colors hover:bg-surface-raised"
                >
                  <span className="font-semibold text-on-surface">{template.title}</span>
                  <span className="text-sm text-on-surface-muted">{template.serves}</span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/plantillas" className="font-medium text-brand underline">
            {t("templatesCta")}
          </Link>
        </section>

        {/* FAQ visible; el bloque FAQPage de arriba lleva el mismo contenido. */}
        <section className="flex flex-col gap-6 px-4 py-12 sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight text-on-surface sm:text-3xl">
            {t("faqTitle")}
          </h2>
          <div className="flex flex-col gap-3">
            {faq.map((entry) => (
              <details
                key={entry.question}
                className="group rounded-card border border-border bg-surface p-5"
              >
                <summary className="cursor-pointer list-none font-semibold text-on-surface [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center justify-between gap-3">
                    {entry.question}
                    <span
                      aria-hidden="true"
                      className="text-brand transition-transform group-open:rotate-45"
                    >
                      +
                    </span>
                  </span>
                </summary>
                <p className="pt-3 text-on-surface-muted leading-relaxed">{entry.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

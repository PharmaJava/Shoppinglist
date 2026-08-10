import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { QuickCreateForm } from "@/components/marketing/quick-create-form";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/seo/site";

export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const t = await getTranslations({ locale, namespace: "landing" });
  const tMeta = await getTranslations({ locale, namespace: "metadata" });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tMeta("siteName"),
    applicationCategory: "ShoppingApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    url: `${SITE_URL}/${locale}`,
  };

  const steps = [
    { title: t("step1Title"), body: t("step1Body") },
    { title: t("step2Title"), body: t("step2Body") },
    { title: t("step3Title"), body: t("step3Body") },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD estático generado por nosotros, sin datos de usuario.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="flex flex-col items-center gap-6 px-4 py-16 text-center sm:px-6">
        <p className="text-sm font-medium uppercase tracking-wide text-brand">{t("eyebrow")}</p>
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-on-surface sm:text-5xl">
          {t("title")}
        </h1>
        <p className="max-w-xl text-lg text-on-surface-muted">{t("subtitle")}</p>
        <QuickCreateForm />
      </section>

      <section className="grid gap-6 px-4 py-12 sm:grid-cols-3 sm:px-6">
        {steps.map((step, index) => (
          <div key={step.title} className="flex flex-col gap-2 rounded-card bg-surface-muted p-5">
            <span className="text-sm font-bold text-brand">{index + 1}</span>
            <h3 className="font-semibold text-on-surface">{step.title}</h3>
            <p className="text-sm text-on-surface-muted">{step.body}</p>
          </div>
        ))}
      </section>
    </>
  );
}

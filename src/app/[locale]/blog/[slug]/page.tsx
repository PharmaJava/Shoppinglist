import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { FaqSection, JsonLd, ProseBlocks } from "@/components/content/prose";
import { getGuideByKey, getPost, getPostByKey, getPosts, getTemplateByKey } from "@/content";
import { Link } from "@/i18n/navigation";
import { type AppLocale, routing } from "@/i18n/routing";
import { postJsonLd } from "@/lib/seo/json-ld";
import { contentUrl } from "@/lib/seo/urls";

type Props = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    getPosts(locale).map((post) => ({ locale, slug: post.slug })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const post = getPost(locale, slug);
  if (!post) notFound();

  const languages: Record<string, string> = {};
  for (const alternate of routing.locales) {
    const twin = getPostByKey(alternate, post.key);
    if (twin) {
      languages[alternate === "es" ? "es-ES" : "en-US"] = contentUrl("blog", alternate, twin.slug);
    }
  }
  const englishTwin = getPostByKey("en", post.key);
  if (englishTwin) languages["x-default"] = contentUrl("blog", "en", englishTwin.slug);

  const url = contentUrl("blog", locale, post.slug);

  return {
    title: post.metaTitle,
    description: post.metaDescription,
    alternates: { canonical: url, languages },
    openGraph: {
      type: "article",
      locale: locale === "es" ? "es_ES" : "en_US",
      url,
      title: post.metaTitle,
      description: post.metaDescription,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
    },
    twitter: {
      card: "summary_large_image",
      title: post.metaTitle,
      description: post.metaDescription,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const post = getPost(locale, slug);
  if (!post) notFound();

  const t = await getTranslations({ locale, namespace: "blogPage" });
  const tCrumb = await getTranslations({ locale, namespace: "breadcrumb" });
  const tMeta = await getTranslations({ locale, namespace: "metadata" });

  const jsonLd = postJsonLd(post, locale as AppLocale, {
    home: tCrumb("home"),
    blog: tCrumb("blog"),
    siteName: tMeta("siteName"),
  });

  const relatedTemplates = post.relatedTemplates
    .map((key) => getTemplateByKey(locale, key))
    .filter((entry) => entry !== undefined);
  const relatedGuides = post.relatedGuides
    .map((key) => getGuideByKey(locale, key))
    .filter((entry) => entry !== undefined);
  const relatedPosts = post.relatedPosts
    .map((key) => getPostByKey(locale, key))
    .filter((entry) => entry !== undefined);

  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-4 py-12 sm:px-6">
      <JsonLd blocks={jsonLd} />

      <nav aria-label="breadcrumb" className="text-sm text-on-surface-muted">
        <Link href="/blog" className="underline">
          {tCrumb("blog")}
        </Link>
      </nav>

      <header className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-on-surface sm:text-4xl">
          {post.title}
        </h1>
        <p className="text-lg text-on-surface-muted">{post.excerpt}</p>
        <p className="text-sm text-on-surface-muted">
          {t("published", { date: post.publishedAt })}
        </p>
      </header>

      <ProseBlocks blocks={post.body} />

      <FaqSection title={t("faqTitle")} faq={post.faq} />

      {relatedPosts.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-bold text-on-surface">{t("related")}</h2>
          <ul className="flex flex-col gap-2">
            {relatedPosts.map((entry) => (
              <li key={entry.slug}>
                <Link
                  href={{ pathname: "/blog/[slug]", params: { slug: entry.slug } }}
                  className="text-brand underline"
                >
                  {entry.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {relatedTemplates.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-bold text-on-surface">{t("relatedTemplates")}</h2>
          <ul className="flex flex-col gap-2">
            {relatedTemplates.map((entry) => (
              <li key={entry.slug}>
                <Link
                  href={{ pathname: "/plantillas/[slug]", params: { slug: entry.slug } }}
                  className="text-brand underline"
                >
                  {entry.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {relatedGuides.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-bold text-on-surface">{t("relatedGuides")}</h2>
          <ul className="flex flex-col gap-2">
            {relatedGuides.map((entry) => (
              <li key={entry.slug}>
                <Link
                  href={{ pathname: "/guias/[slug]", params: { slug: entry.slug } }}
                  className="text-brand underline"
                >
                  {entry.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}

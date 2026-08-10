import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { InviteClient } from "./invite-client";

/** Genérica a propósito: el rastreador no tiene sesión y el token no debe filtrarse. */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");

  return {
    title: t("inviteTitle"),
    description: t("inviteDescription"),
    robots: { index: false, follow: false },
    openGraph: {
      type: "website",
      siteName: t("siteName"),
      title: t("inviteTitle"),
      description: t("inviteDescription"),
    },
    twitter: {
      card: "summary_large_image",
      title: t("inviteTitle"),
      description: t("inviteDescription"),
    },
  };
}

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <InviteClient token={token} />;
}

import type { Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import type { ReactNode } from "react";
import { InstallPromptBanner } from "@/components/providers/install-prompt-banner";
import { QueryProvider } from "@/components/providers/query-provider";
import { ServiceWorkerRegistration } from "@/components/providers/service-worker-registration";
import { SyncBoot } from "@/components/providers/sync-boot";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#1fa971",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className="h-full antialiased" suppressHydrationWarning>
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <QueryProvider>
            <SyncBoot />
            <ServiceWorkerRegistration />
            {children}
            <InstallPromptBanner />
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

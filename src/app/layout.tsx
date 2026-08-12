import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import type { ReactNode } from "react";
import { CatalogBoot } from "@/components/providers/catalog-boot";
import { InstallPromptBanner } from "@/components/providers/install-prompt-banner";
import { QueryProvider } from "@/components/providers/query-provider";
import { ServiceWorkerRegistration } from "@/components/providers/service-worker-registration";
import { SyncBoot } from "@/components/providers/sync-boot";
import { iosStartupImages } from "@/lib/pwa/ios-splash";
import { SITE_URL } from "@/lib/seo/site";
import "./globals.css";

/**
 * Se declara en la raíz, no sólo en `[locale]`, porque las rutas que más se
 * comparten (`/l/[listId]` e `/i/[token]`) cuelgan fuera de ese segmento y
 * WhatsApp y Facebook descartan cualquier `og:image` que no sea absoluta.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: "ListaSupermercado",
  /**
   * Lo que hace que en iPhone y iPad la app abierta desde la pantalla de
   * inicio salga sin la barra de Safari. El manifest por sí solo no basta:
   * Safari sigue mirando estos `meta`.
   *
   * `statusBarStyle: "default"` deja la hora y la batería encima del contenido
   * con fondo propio, en vez de meterlas dentro de la página como haría
   * `black-translucent` —que obligaría a rehacer todas las cabeceras con
   * `safe-area-inset-top` para que el título no quedara debajo del notch—.
   */
  appleWebApp: {
    capable: true,
    title: "ListaSupermercado",
    statusBarStyle: "default",
    startupImage: iosStartupImages(),
  },
  // Sin esto, iOS convierte en enlace de teléfono cualquier cosa que parezca
  // un número: cantidades, precios y códigos de la lista incluidos.
  formatDetection: { telephone: false },
  /**
   * Next ya emite el `mobile-web-app-capable` estándar por `appleWebApp`, que
   * es el que entiende Safari desde la 15.4. El de Apple, con prefijo, sigue
   * aquí a mano para los iPhone que se quedaron en iOS 14 y que son
   * exactamente los que no se van a cambiar por una app.
   */
  other: { "apple-mobile-web-app-capable": "yes" },
};

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
            <CatalogBoot />
            {children}
            <InstallPromptBanner />
          </QueryProvider>
        </NextIntlClientProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

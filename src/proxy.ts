import { type NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { refreshSupabaseSession } from "@/lib/supabase/middleware";

const intlMiddleware = createIntlMiddleware(routing);

// Rutas de la app (no de marketing): no llevan prefijo de idioma y no deben
// pasar por la negociación/redirección de next-intl. `/auth` incluida: la URL
// de redirección está registrada en Supabase y debe resolver tal cual, sin que
// un redirect a `/es/auth/...` invalide el enlace del correo.
const APP_ROUTE = /^\/(l|i|share-target|auth)(\/|$)/;

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const response = APP_ROUTE.test(pathname) ? appRouteResponse(request) : intlMiddleware(request);

  return refreshSupabaseSession(request, response);
}

/**
 * Las rutas de la app (lista compartida, invitación) no tienen prefijo de
 * idioma, pero igualmente necesitan un idioma de interfaz: se detecta una
 * vez por `Accept-Language` y se fija en cookie, como hace next-intl para
 * las rutas de marketing.
 */
function appRouteResponse(request: NextRequest) {
  const response = NextResponse.next({ request });

  if (!request.cookies.get("NEXT_LOCALE")) {
    const acceptLanguage = request.headers.get("accept-language")?.toLowerCase() ?? "";
    const preferred =
      routing.locales.find((locale) => acceptLanguage.includes(locale)) ?? routing.defaultLocale;
    response.cookies.set("NEXT_LOCALE", preferred, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return response;
}

export const config = {
  matcher: [
    // Todo excepto assets estáticos, imágenes, API, rutas internas de Next.js
    // y los archivos de metadatos de raíz (robots.txt, sitemap.xml, manifest,
    // service worker…), que deben servirse en su ruta exacta sin pasar por
    // la negociación de idioma — un redirect ahí rompe robots, crawlers y el
    // registro del service worker.
    "/((?!_next/static|_next/image|api|favicon\\.ico|robots\\.txt|sitemap\\.xml|manifest\\.webmanifest|sw\\.js|offline\\.html|icons/|.*\\.(?:svg|png|jpg|jpeg|webp|avif|ico)$).*)",
  ],
};

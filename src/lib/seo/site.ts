/**
 * Dirección pública del sitio, sin barra final.
 *
 * De aquí salen el canonical, el hreflang, el sitemap y los `og:image`, así
 * que equivocarse aquí no se nota navegando pero sí en Google: un sitemap con
 * URLs de `localhost` lo rechaza Search Console **entero**, porque ninguna
 * pertenece al dominio verificado.
 *
 * Y es un peligro real, no teórico: `NEXT_PUBLIC_*` se incrusta **al
 * compilar**, no se lee al arrancar. Si el build sale sin la variable, el
 * valor queda congelado y ponerla después en el panel no cambia nada hasta el
 * siguiente despliegue.
 *
 * De ahí la cadena de reservas: en Vercel, `VERCEL_PROJECT_PRODUCTION_URL`
 * lleva el dominio de producción y `VERCEL_URL` el de la previsualización, y
 * las dos están disponibles durante el build sin configurar nada.
 */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return withoutTrailingSlash(explicit);

  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (production) return `https://${withoutTrailingSlash(production)}`;

  // Previsualizaciones: cada despliegue tiene su propio dominio. No es el
  // definitivo, pero es mejor que localhost para revisar una PR.
  const preview = process.env.VERCEL_URL;
  if (preview) return `https://${withoutTrailingSlash(preview)}`;

  return "http://localhost:3000";
}

function withoutTrailingSlash(value: string): string {
  return value.replace(/\/$/, "");
}

export const SITE_URL = resolveSiteUrl();

/**
 * Quién hay detrás. Vive aquí y no en los textos traducidos porque es el mismo
 * dato en los dos idiomas, y porque lo consumen tres sitios a la vez: la
 * página de «quiénes somos», su JSON-LD y los documentos legales.
 *
 * La URL va sin los parámetros `utm_*` con los que LinkedIn comparte los
 * perfiles: son de su analítica, no de la dirección, y ensucian el `sameAs`
 * con el que Google une esta web con una persona real.
 */
export const AUTHOR_NAME = "Antonio";
export const AUTHOR_LINKEDIN = "https://www.linkedin.com/in/farmaiant";

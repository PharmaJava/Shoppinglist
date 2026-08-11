export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
  /\/$/,
  "",
);

/**
 * Quién hay detrás. Vive aquí y no en los textos traducidos porque es el mismo
 * dato en los dos idiomas, y porque lo consumen tres sitios a la vez: la
 * página de «quiénes somos», su JSON-LD y la política de privacidad.
 *
 * La URL va sin los parámetros `utm_*` con los que LinkedIn comparte los
 * perfiles: son de su analítica, no de la dirección, y ensucian el `sameAs`
 * con el que Google une esta web con una persona real.
 */
export const AUTHOR_LINKEDIN = "https://www.linkedin.com/in/farmaiant";

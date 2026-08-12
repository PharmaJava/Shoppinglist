export type Platform = "ios" | "android" | "other";

/**
 * De qué móvil se trata, a efectos de instalación.
 *
 * `maxTouchPoints` no sobra: desde iPadOS 13 el iPad se anuncia como
 * «Macintosh» en el user agent y sin ese dato es indistinguible de un Mac de
 * escritorio, que no instala nada desde el menú de compartir.
 */
export function detectPlatform(userAgent: string, maxTouchPoints = 0): Platform {
  if (/android/i.test(userAgent)) return "android";
  if (/iphone|ipod|ipad/i.test(userAgent)) return "ios";
  if (/macintosh/i.test(userAgent) && maxTouchPoints > 1) return "ios";
  return "other";
}

/**
 * ¿La app ya está abierta como app y no como pestaña?
 *
 * Dos comprobaciones porque Safari sólo implementó `display-mode` tardíamente;
 * `navigator.standalone` es la propiedad propietaria de siempre en iOS.
 */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches === true ||
    window.matchMedia?.("(display-mode: minimal-ui)").matches === true ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/**
 * Navegadores incrustados —el de Instagram, Facebook, TikTok— donde «añadir a
 * pantalla de inicio» no existe: enseñarle ahí las instrucciones a alguien es
 * mandarle a buscar un botón que no está.
 */
export function isInAppBrowser(userAgent: string): boolean {
  return /FBAN|FBAV|Instagram|Line\/|Twitter|TikTok|MicroMessenger/i.test(userAgent);
}

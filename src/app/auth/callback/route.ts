import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Destino de los enlaces que Supabase manda por correo, tanto para el alta con
 * enlace mágico como para la confirmación del email que convierte a un
 * invitado en usuario permanente.
 *
 * Acepta las dos formas en que puede llegar, porque cubren escenarios
 * distintos y ninguna sirve para los dos:
 *
 * - `code`: flujo PKCE, el de por defecto de @supabase/ssr. Requiere el *code
 *   verifier*, que vive en una cookie del navegador que pidió el enlace, así
 *   que **falla si el correo se abre en otro dispositivo** — algo muy habitual:
 *   se pide en el portátil y se abre en el móvil.
 * - `token_hash`: verificación directa del token del enlace. Funciona en
 *   cualquier dispositivo. Exige personalizar las plantillas de correo en
 *   Supabase para que apunten aquí (ver docs/05-AUTH.md).
 *
 * Fuera de `[locale]` a propósito: la URL está registrada en Supabase como
 * redirección permitida y debe resolver exactamente, sin negociación de idioma.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = safeNext(url.searchParams.get("next"));

  // Supabase informa de enlaces caducados o ya usados por querystring.
  const errorDescription = url.searchParams.get("error_description");
  if (errorDescription) {
    return redirectTo(url, next, { authError: errorDescription });
  }

  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;

  const supabase = await getSupabaseServerClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    return error
      ? redirectTo(url, next, { authError: error.message })
      : redirectTo(url, next, { authOk: "1" });
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    return error
      ? redirectTo(url, next, { authError: error.message })
      : redirectTo(url, next, { authOk: "1" });
  }

  return redirectTo(url, next, { authError: "missing_token" });
}

/**
 * Sólo se acepta una ruta interna. `next` llega por querystring desde un enlace
 * de correo, así que sin esta comprobación sería un *open redirect* con el que
 * enviar a un usuario recién autenticado a un dominio ajeno.
 */
function safeNext(candidate: string | null): string {
  if (!candidate?.startsWith("/") || candidate.startsWith("//")) return "/";
  return candidate;
}

function redirectTo(base: URL, next: string, params: Record<string, string>) {
  const destination = new URL(next, base.origin);
  for (const [key, value] of Object.entries(params)) {
    destination.searchParams.set(key, value);
  }
  return NextResponse.redirect(destination);
}

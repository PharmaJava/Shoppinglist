import { getSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Autenticación por email sin contraseña (docs/00-PLAN.md §9, Fase 2).
 *
 * Sólo se usa desde componentes cliente: el cliente de navegador guarda el
 * *code verifier* de PKCE, y sin él el intercambio del callback falla.
 */

/** URL absoluta a la que Supabase devuelve al usuario tras pulsar el enlace.
 *  Se toma del origen real y no de NEXT_PUBLIC_SITE_URL para que las preview
 *  de Vercel funcionen sin reconfigurar nada. */
function callbackUrl(next: string): string {
  const url = new URL("/auth/callback", window.location.origin);
  url.searchParams.set("next", next);
  return url.toString();
}

/**
 * Enlace mágico para quien ya tiene cuenta o quiere crear una desde cero.
 *
 * `shouldCreateUser: true` permite el alta directa: para el usuario no hay
 * diferencia entre registrarse e iniciar sesión, que es justo lo que evita
 * la pantalla de «¿ya tienes cuenta?».
 */
export async function sendMagicLink(email: string, next: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: callbackUrl(next), shouldCreateUser: true },
  });

  if (error) throw new Error(error.message);
}

/**
 * Convierte al invitado actual en usuario permanente **conservando su UUID**.
 *
 * Es el motivo por el que la identidad de invitado se hizo con anonymous
 * sign-in (docs/00-PLAN.md §2.2): al añadirle un email al mismo `auth.uid()`,
 * sus listas le siguen sin migrar un solo registro. Requiere confirmación por
 * correo, así que hasta que el usuario pulse el enlace sigue siendo anónimo.
 */
export async function linkEmailToGuestSession(email: string, next: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();

  const { error } = await supabase.auth.updateUser(
    { email },
    { emailRedirectTo: callbackUrl(next) },
  );

  if (error) throw new Error(error.message);
}

export async function signOut(): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

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

/**
 * Alta con contraseña elegida por la persona. También requiere confirmar el
 * correo, así que hasta entonces no hay sesión: el mensaje de la interfaz es
 * el mismo que con enlace mágico.
 */
export async function signUpWithPassword(
  email: string,
  password: string,
  next: string,
): Promise<void> {
  const supabase = getSupabaseBrowserClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: callbackUrl(next) },
  });

  if (error) throw new Error(error.message);
}

export async function signInWithPassword(email: string, password: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
}

/**
 * Convierte al invitado en usuario permanente con correo **y** contraseña en
 * una sola operación, conservando su UUID igual que la variante sin contraseña.
 */
export async function linkPasswordToGuestSession(
  email: string,
  password: string,
  next: string,
): Promise<void> {
  const supabase = getSupabaseBrowserClient();

  const { error } = await supabase.auth.updateUser(
    { email, password },
    { emailRedirectTo: callbackUrl(next) },
  );

  if (error) throw new Error(error.message);
}

/**
 * Recuperación de contraseña. El destino lleva ya `?recovery=1` para que la
 * página de cuenta sepa que debe pedir una contraseña nueva: con el flujo PKCE
 * el callback recibe un `code` indistinguible del de cualquier otro enlace.
 */
export async function sendPasswordReset(email: string, next: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: callbackUrl(next),
  });

  if (error) throw new Error(error.message);
}

/** Fija la contraseña nueva. Requiere sesión, que es lo que deja el enlace de
 *  recuperación al canjearse. */
export async function updatePassword(password: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw new Error(error.message);
}

export async function signOut(): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

/**
 * Nombre con el que te ven quienes comparten lista contigo. Vive en
 * `profiles`, no en los metadatos de `auth.users`, porque tiene que poder
 * leerlo otra persona — y para eso hay una política de RLS que lo permite
 * entre miembros de una misma lista.
 */
export async function updateDisplayName(displayName: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();

  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("auth_required");

  const trimmed = displayName.trim();
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: trimmed.length > 0 ? trimmed : null })
    .eq("id", data.user.id);

  if (error) throw new Error(error.message);
}

export async function fetchDisplayName(): Promise<string> {
  const supabase = getSupabaseBrowserClient();

  const { data } = await supabase.auth.getUser();
  if (!data.user) return "";

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", data.user.id)
    .maybeSingle();

  return profile?.display_name ?? "";
}

/**
 * Borrado de cuenta (RGPD). La función de base de datos no acepta parámetros y
 * actúa sobre `auth.uid()`, así que nadie puede borrar a otro. Tras borrar se
 * cierra sesión para no dejar en el navegador un token que ya no vale.
 */
export async function deleteAccount(): Promise<void> {
  const supabase = getSupabaseBrowserClient();

  const { error } = await supabase.rpc("delete_own_account");
  if (error) throw new Error(error.message);

  await supabase.auth.signOut();
}

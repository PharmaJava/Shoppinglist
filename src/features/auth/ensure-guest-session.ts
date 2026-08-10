import { getSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Garantiza que hay una sesión de Supabase antes de cualquier mutación.
 * Si el visitante no tiene sesión, se da de alta como usuario anónimo
 * (mismo modelo de RLS que un usuario registrado; ver docs/00-PLAN.md §2.2).
 */
export async function ensureGuestSession(): Promise<string> {
  const supabase = getSupabaseBrowserClient();

  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData.session) {
    return sessionData.session.user.id;
  }

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.user) {
    throw new Error(error?.message ?? "No se pudo iniciar sesión de invitado.");
  }

  return data.user.id;
}

/**
 * Fuerza una sesión anónima nueva, descartando la que hubiera en caché.
 * Se usa como recuperación cuando el servidor rechaza una escritura por RLS
 * a pesar de que el cliente creía tener sesión — normalmente una sesión
 * cacheada (localStorage/cookies) que quedó obsoleta o inválida.
 */
export async function ensureFreshGuestSession(): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  await supabase.auth.signOut();

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.user) {
    throw new Error(error?.message ?? "No se pudo iniciar sesión de invitado.");
  }

  return data.user.id;
}

/** ¿El mensaje de error corresponde a un rechazo de RLS (sesión inválida/obsoleta)? */
export function isRowLevelSecurityError(message: string | undefined): boolean {
  return Boolean(message?.toLowerCase().includes("row-level security policy"));
}

/**
 * Diagnóstico de la sesión actual para adjuntar al mensaje de error cuando
 * un rechazo de RLS persiste incluso con sesión recién creada. No expone
 * secretos: sólo claims del JWT (sub/role/exp), no el token en sí.
 */
export async function describeSessionForError(): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (error) return `sin sesión (error: ${error.message})`;
  if (!token) return "sin sesión (sin token de acceso)";

  try {
    const payload = token.split(".")[1] ?? "";
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return `token sub=${json.sub} role=${json.role} is_anonymous=${json.is_anonymous ?? "?"} exp=${json.exp}`;
  } catch {
    return "token presente pero no se pudo decodificar";
  }
}

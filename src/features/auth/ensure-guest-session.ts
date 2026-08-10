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

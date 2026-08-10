import { getSupabaseBrowserClient } from "./client";

/**
 * Lee el usuario de la sesión en almacenamiento local, sin llamada de red.
 * A diferencia de `auth.getUser()` (que siempre revalida contra el servidor),
 * esto funciona sin conexión — imprescindible para construir mutaciones
 * mientras el dispositivo está offline.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user.id ?? null;
}

"use client";

import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type SessionState =
  | { status: "loading"; user: null }
  /** Sin sesión: ni siquiera invitado. Ocurre antes de la primera lista. */
  | { status: "anonymous"; user: null }
  /** Invitado: identidad real con RLS, pero sin email. Convertible. */
  | { status: "guest"; user: User }
  | { status: "registered"; user: User };

/**
 * Estado de sesión para la interfaz.
 *
 * Usa `getUser()`, no `getSession()`: valida contra el servidor. Aquí sí
 * compensa el viaje de red — decide qué formulario se enseña, y equivocarse
 * significaría ofrecer «guardar tus listas» a quien ya las tiene guardadas.
 */
export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({ status: "loading", user: null });

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let active = true;

    supabase.auth.getUser().then(({ data }) => {
      if (active) setState(toState(data.user));
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setState(toState(session?.user ?? null));
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  return state;
}

function toState(user: User | null): SessionState {
  if (!user) return { status: "anonymous", user: null };
  // `is_anonymous` deja de ser cierto en cuanto el email queda confirmado, que
  // es exactamente el momento en que el invitado pasa a tener cuenta.
  return user.is_anonymous ? { status: "guest", user } : { status: "registered", user };
}

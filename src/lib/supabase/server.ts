import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAnonKey, supabaseUrl } from "./env";
import type { Database } from "./types";

/**
 * Cliente para Server Components, Server Actions y Route Handlers.
 * Se crea uno nuevo por petición: lee y escribe las cookies de sesión del
 * request/response actuales, así que no puede ser un singleton.
 */
export async function getSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Un Server Component no puede escribir cookies; el middleware
          // se encarga de refrescar la sesión en ese caso.
        }
      },
    },
  });
}

import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";
import { supabaseAnonKey, supabaseUrl } from "./env";
import type { Database } from "./types";

/**
 * Refresca la sesión de Supabase y adjunta la cookie actualizada a la
 * respuesta que le pases (normalmente la ya generada por el middleware de
 * next-intl, para no perder su redirect/rewrite).
 */
export async function refreshSupabaseSession(request: NextRequest, response: NextResponse) {
  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  await supabase.auth.getUser();

  return response;
}

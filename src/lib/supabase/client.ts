"use client";

import { createBrowserClient } from "@supabase/ssr";
import { supabaseAnonKey, supabaseUrl } from "./env";
import type { Database } from "./types";

let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined;

/**
 * Cliente singleton para componentes cliente. supabase-js ya gestiona su
 * propia caché interna; un singleton evita recrear el WebSocket de Realtime
 * en cada render.
 */
export function getSupabaseBrowserClient() {
  browserClient ??= createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
  return browserClient;
}

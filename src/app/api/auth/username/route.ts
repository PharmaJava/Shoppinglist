import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { isValidUsername, normalizeUsername } from "@/features/auth/username";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

/**
 * Entrar con nombre de usuario y contraseña.
 *
 * Existe por una sola razón: **traducir «usuario → correo» exige leer el
 * correo**, y eso no puede pasar en el navegador. Si el cliente pudiera hacer
 * esa consulta, cualquiera tendría un buscador de correos ajenos a partir de
 * nombres de usuario. Aquí se hace con la clave de servicio, y lo único que
 * sale de vuelta es la sesión, en cookies.
 *
 * Node y no borde: la clave de servicio no puede vivir en el borde con el
 * resto de este proyecto, y `cookies()` necesita el entorno de Node.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Una sola respuesta para «ese usuario no existe» y «esa contraseña no es».
 *
 * Distinguirlas convertiría esta ruta en un comprobador de qué nombres están
 * registrados, que es exactamente lo que se quiere evitar.
 *
 * Una función y no una constante: el cuerpo de una `Response` se puede leer
 * una sola vez, así que una compartida entre peticiones se rompería a partir
 * de la segunda.
 */
function credencialesInvalidas() {
  return NextResponse.json({ error: "credenciales_invalidas" }, { status: 401 });
}

export async function POST(request: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceKey || !supabaseUrl) {
    // Sin configurar, esto no existe — mismo criterio que el cron y el pago.
    return NextResponse.json({ error: "no_configurado" }, { status: 404 });
  }

  let cuerpo: { username?: unknown; password?: unknown };
  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json({ error: "peticion_invalida" }, { status: 400 });
  }

  const username = typeof cuerpo.username === "string" ? normalizeUsername(cuerpo.username) : "";
  const password = typeof cuerpo.password === "string" ? cuerpo.password : "";

  // Un nombre con formato imposible no llega a consultarse: no hay nada que
  // buscar y sí una consulta que ahorrarse.
  if (!isValidUsername(username) || !password) return credencialesInvalidas();

  const servidor = createClient<Database>(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const { data: email, error } = await servidor.rpc("email_for_username", {
    p_username: username,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!email) return credencialesInvalidas();

  // Con el correo ya resuelto, la autenticación es la de siempre — y va por
  // el cliente de servidor con cookies, que es quien deja la sesión puesta.
  const sesion = await getSupabaseServerClient();
  const { error: fallo } = await sesion.auth.signInWithPassword({ email, password });

  if (fallo) return credencialesInvalidas();

  return NextResponse.json({ ok: true });
}

import { type NextRequest, NextResponse } from "next/server";
import { esCodigoValido, normalizarCodigo } from "@/features/barcode/code";
import { CAMPOS_OFF, type FichaOFF, productoDeFicha } from "@/features/barcode/product-name";
import { PREMIUM_VISIBLE } from "@/lib/flags";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Locale } from "@/lib/supabase/types";

/**
 * Qué producto es este código de barras.
 *
 * Pregunta a **Open Food Facts**, una base de datos abierta y colaborativa de
 * productos de alimentación (ODbL). No es el catálogo de ningún supermercado
 * —eso ya se descartó en docs/06-PRECIOS.md— sino una base pública que
 * cualquiera puede consultar y corregir.
 *
 * Por qué pasa por el servidor y no lo llama el navegador:
 *
 * 1. **Open Food Facts pide identificarse** con un `User-Agent` propio, y un
 *    navegador no puede ponerlo.
 * 2. **Privacidad**: así lo que escanea cada persona no se asocia a su IP en
 *    un tercero. Sólo ve las peticiones de este servidor.
 * 3. **Se puede cerrar la puerta**: la consulta es de pago (Fase 3), y aquí se
 *    comprueba con `require_premium()`.
 *
 * Node y no borde: no hay razón para el borde y sí para compartir el mismo
 * cliente de Supabase que el resto del servidor.
 */
export const runtime = "nodejs";

const OPEN_FOOD_FACTS = "https://world.openfoodfacts.org/api/v2/product";
const AGENTE = "ListaSupermercado/1.0 (https://listasupermercado.com)";

/**
 * Cinco segundos y se abandona. Esto se usa **de pie en un pasillo**: si Open
 * Food Facts va lento, es mejor decir «no lo conozco, escribe el nombre» que
 * dejar la cámara pensando.
 */
const ESPERA_MAXIMA = 5_000;

export async function GET(request: NextRequest, contexto: { params: Promise<{ code: string }> }) {
  if (!PREMIUM_VISIBLE) return NextResponse.json({ error: "no_disponible" }, { status: 404 });

  const { code } = await contexto.params;
  const codigo = normalizarCodigo(code);

  // Se valida antes de salir a la red: un código con el dígito de control mal
  // es una lectura fallida de la cámara, y preguntar por él es un viaje
  // seguro a ninguna parte.
  if (!esCodigoValido(codigo)) {
    return NextResponse.json({ error: "codigo_invalido" }, { status: 400 });
  }

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "sin_sesion" }, { status: 401 });

  const { error: sinPlan } = await supabase.rpc("require_premium");
  if (sinPlan) return NextResponse.json({ error: "no_premium" }, { status: 402 });

  const locale = (request.nextUrl.searchParams.get("locale") === "en" ? "en" : "es") as Locale;

  let ficha: { status?: number; product?: FichaOFF };
  try {
    const respuesta = await fetch(
      `${OPEN_FOOD_FACTS}/${codigo}.json?fields=${CAMPOS_OFF.join(",")}`,
      { headers: { "User-Agent": AGENTE }, signal: AbortSignal.timeout(ESPERA_MAXIMA) },
    );

    // Un 404 de Open Food Facts es «no lo tengo», no un fallo: se responde lo
    // mismo que cuando la ficha no trae nombre.
    if (!respuesta.ok && respuesta.status !== 404) {
      return NextResponse.json({ error: "fuente_caida" }, { status: 502 });
    }
    ficha = respuesta.status === 404 ? {} : await respuesta.json();
  } catch {
    return NextResponse.json({ error: "fuente_caida" }, { status: 502 });
  }

  const producto =
    ficha.status === 1 && ficha.product ? productoDeFicha(codigo, ficha.product, locale) : null;

  if (!producto) {
    return NextResponse.json({ found: false, code: codigo }, { status: 404 });
  }

  return NextResponse.json(
    { found: true, ...producto },
    {
      headers: {
        // `private`: la respuesta depende de quién pregunta —hay que ser
        // premium—, así que no puede acabar en una caché compartida. Un
        // código de barras no cambia de producto, de ahí el día entero.
        "Cache-Control": "private, max-age=86400",
      },
    },
  );
}

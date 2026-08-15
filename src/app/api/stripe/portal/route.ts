import { NextResponse } from "next/server";
import { PREMIUM_VISIBLE } from "@/lib/flags";
import { getStripe } from "@/lib/stripe/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Gestionar la suscripción: cambiar de tarjeta, ver facturas, darse de baja.
 *
 * Todo eso lo hace el portal de Stripe, y se usa **a propósito** en vez de
 * construir pantallas propias: son datos de pago, y cuantos menos pasen por
 * aquí, mejor. Además, darse de baja tiene que ser tan fácil como pagar; el
 * portal ya lo pone a un clic.
 */
export const runtime = "nodejs";

export async function POST() {
  if (!PREMIUM_VISIBLE) return NextResponse.json({ error: "no_disponible" }, { status: 404 });

  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: "pago_no_configurado" }, { status: 404 });

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "sin_sesion" }, { status: 401 });

  const { data: suscripcion } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!suscripcion?.stripe_customer_id) {
    return NextResponse.json({ error: "sin_suscripcion" }, { status: 404 });
  }

  const sitio = process.env.NEXT_PUBLIC_SITE_URL ?? "https://listasupermercado.com";

  try {
    const sesion = await stripe.billingPortal.sessions.create({
      customer: suscripcion.stripe_customer_id,
      return_url: `${sitio}/es/cuenta`,
    });

    return NextResponse.json({ url: sesion.url });
  } catch {
    return NextResponse.json({ error: "stripe_no_responde" }, { status: 502 });
  }
}

import { NextResponse } from "next/server";
import { PREMIUM_VISIBLE } from "@/lib/flags";
import { getPriceId, getStripe } from "@/lib/stripe/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Empezar a pagar: crea una sesión de Stripe Checkout y devuelve su URL.
 *
 * No se cobra aquí ni se toca el plan: el plan lo pone **el webhook** cuando
 * Stripe confirma el cobro (`/api/stripe/webhook`). Dar premium al volver de
 * Checkout sería regalarlo a cualquiera que se sepa la URL de vuelta.
 */
export const runtime = "nodejs";

export async function POST() {
  if (!PREMIUM_VISIBLE) return NextResponse.json({ error: "no_disponible" }, { status: 404 });

  const stripe = getStripe();
  const priceId = getPriceId();
  if (!stripe || !priceId) {
    return NextResponse.json({ error: "pago_no_configurado" }, { status: 404 });
  }

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "sin_sesion" }, { status: 401 });

  // Si ya es cliente se reutiliza: sin esto, cada intento de pago crearía un
  // cliente nuevo en Stripe y el historial de esa persona quedaría partido.
  const { data: suscripcion } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const sitio = process.env.NEXT_PUBLIC_SITE_URL ?? "https://listasupermercado.com";

  try {
    const sesion = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      ...(suscripcion?.stripe_customer_id
        ? { customer: suscripcion.stripe_customer_id }
        : { customer_email: user.email ?? undefined }),
      // Las dos vías para saber de quién es el pago cuando vuelva el aviso:
      // la sesión trae `client_reference_id`, y los eventos posteriores de la
      // suscripción traen sus metadatos.
      client_reference_id: user.id,
      subscription_data: { metadata: { user_id: user.id } },
      metadata: { user_id: user.id },
      // Vuelve a la cuenta, que es donde se ve el estado de la suscripción.
      success_url: `${sitio}/es/cuenta?pago=ok`,
      cancel_url: `${sitio}/es/precios`,
      allow_promotion_codes: true,
    });

    if (!sesion.url) return NextResponse.json({ error: "sin_url" }, { status: 502 });
    return NextResponse.json({ url: sesion.url });
  } catch {
    return NextResponse.json({ error: "stripe_no_responde" }, { status: 502 });
  }
}

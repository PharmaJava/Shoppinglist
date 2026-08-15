import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { finDePeriodo, getStripe } from "@/lib/stripe/server";
import type { Database } from "@/lib/supabase/types";

/**
 * Lo que Stripe cuenta sobre las suscripciones.
 *
 * **Esta ruta es la única que da y quita premium.** Ni el botón de pagar ni la
 * vuelta de Checkout tocan el plan: quien vuelve de pagar puede haber cerrado
 * la pestaña antes, y la URL de vuelta se la sabe cualquiera.
 *
 * Tres cosas que la sostienen:
 *
 * 1. **La firma.** Sin `stripe-signature` válida no se lee ni el cuerpo. Es
 *    una URL pública: sin esto, cualquiera se regalaría el plan mandando un
 *    JSON.
 * 2. **El cuerpo en crudo.** La firma se calcula sobre los bytes tal cual, así
 *    que hay que leer el texto sin parsear. Por eso `request.text()` y no
 *    `request.json()`.
 * 3. **Idempotencia.** Stripe reintenta los avisos que no reciben un 200. El
 *    segundo intento del mismo evento no puede volver a aplicar nada, y de eso
 *    se encarga `apply_subscription` (migración 0014).
 *
 * Se responde 200 a lo que no se entiende: un 500 hace que Stripe reintente
 * durante días un evento que nunca vamos a saber tratar, y acaba desactivando
 * el endpoint.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Sólo estos cambian una suscripción. El resto se acusa recibo y se ignora. */
const EVENTOS = new Set([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
]);

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const secreto = process.env.STRIPE_WEBHOOK_SECRET;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!stripe || !secreto || !serviceKey || !supabaseUrl) {
    return NextResponse.json({ error: "pago_no_configurado" }, { status: 404 });
  }

  const firma = request.headers.get("stripe-signature");
  if (!firma) return NextResponse.json({ error: "sin_firma" }, { status: 400 });

  const cuerpo = await request.text();

  let evento: Stripe.Event;
  try {
    evento = stripe.webhooks.constructEvent(cuerpo, firma, secreto);
  } catch {
    return NextResponse.json({ error: "firma_invalida" }, { status: 400 });
  }

  if (!EVENTOS.has(evento.type)) return NextResponse.json({ ignorado: evento.type });

  // Clave de servicio: escribir el plan de otra persona no lo puede hacer
  // ninguna sesión, y esta petición no tiene ninguna.
  const supabase = createClient<Database>(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const cambio = await leerCambio(stripe, supabase, evento);
  if (!cambio) return NextResponse.json({ ignorado: evento.type, motivo: "sin_usuario" });

  const { error } = await supabase.rpc("apply_subscription", {
    p_event: evento.id,
    p_event_type: evento.type,
    p_user: cambio.userId,
    p_customer: cambio.customerId,
    p_subscription: cambio.subscriptionId,
    p_status: cambio.status,
    p_period_end: cambio.periodEnd,
  });

  // Aquí sí conviene fallar: si la base de datos no ha podido guardarlo, el
  // reintento de Stripe es justo lo que hace falta.
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

type Supabase = ReturnType<typeof createClient<Database>>;

interface Cambio {
  userId: string;
  customerId: string | null;
  subscriptionId: string | null;
  status: string;
  periodEnd: string | null;
}

/**
 * De un evento de Stripe a «esta persona pasa a este estado».
 *
 * El usuario se busca por tres caminos, en orden de fiabilidad: lo que
 * mandamos nosotros al crear la sesión (`client_reference_id`), los metadatos
 * de la suscripción, y por último el cliente, buscándolo en nuestra tabla.
 * Con uno solo, cualquier evento que llegara por otro camino —una baja hecha
 * desde el panel de Stripe, por ejemplo— se quedaría sin aplicar.
 */
async function leerCambio(
  stripe: Stripe,
  supabase: Supabase,
  evento: Stripe.Event,
): Promise<Cambio | null> {
  if (evento.type === "checkout.session.completed") {
    const sesion = evento.data.object;
    const userId = sesion.client_reference_id ?? sesion.metadata?.user_id ?? null;
    const subscriptionId = idDe(sesion.subscription);
    if (!userId || !subscriptionId) return null;

    // La sesión no dice en qué estado queda la suscripción ni hasta cuándo
    // está pagada: hay que preguntarlo.
    const suscripcion = await stripe.subscriptions.retrieve(subscriptionId);

    return {
      userId,
      customerId: idDe(sesion.customer),
      subscriptionId,
      status: suscripcion.status,
      periodEnd: finDePeriodo(suscripcion),
    };
  }

  const suscripcion = evento.data.object as Stripe.Subscription;
  const customerId = idDe(suscripcion.customer);
  const userId = suscripcion.metadata?.user_id ?? (await usuarioDeCliente(supabase, customerId));
  if (!userId) return null;

  return {
    userId,
    customerId,
    subscriptionId: suscripcion.id,
    status: suscripcion.status,
    periodEnd: finDePeriodo(suscripcion),
  };
}

async function usuarioDeCliente(supabase: Supabase, customerId: string | null) {
  if (!customerId) return null;

  const { data } = await supabase.rpc("user_for_stripe_customer", { p_customer: customerId });
  return data ?? null;
}

/** Stripe devuelve o el identificador o el objeto entero, según el evento. */
function idDe(valor: string | { id: string } | null | undefined): string | null {
  if (!valor) return null;
  return typeof valor === "string" ? valor : valor.id;
}

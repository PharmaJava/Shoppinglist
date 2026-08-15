import Stripe from "stripe";
import type { Locale } from "@/lib/supabase/types";
import { type Intervalo, type PrecioPremium, precioDeStripe } from "./price";

/**
 * Stripe, en el servidor y sólo en el servidor.
 *
 * Sin `STRIPE_SECRET_KEY` **esto no existe**: las rutas de pago responden 404
 * y la página de precios sigue diciendo la verdad, que es que todavía no hay
 * forma de pagar. Es el mismo criterio que el push o la tarea programada:
 * media configuración es peor que ninguna, porque parece que funciona.
 */

let cliente: Stripe | null = null;

export function getStripe(): Stripe | null {
  const clave = process.env.STRIPE_SECRET_KEY;
  if (!clave) return null;

  // Sin `apiVersion`: la que trae el SDK es la que casan sus tipos, y fijar
  // aquí una cadena a mano es la forma de que un día dejen de coincidir.
  cliente ??= new Stripe(clave);
  return cliente;
}

/** El precio que se vende. Sin él no hay nada que cobrar. */
export function getPriceId(): string | null {
  return process.env.STRIPE_PRICE_ID || null;
}

export function stripeConfigurado(): boolean {
  return getStripe() !== null && getPriceId() !== null;
}

/**
 * Cuánto cuesta premium, preguntándoselo a Stripe.
 *
 * El precio no se escribe en el código: se lee de donde de verdad manda. Si
 * un día se sube o se hace una promoción, la página lo dice sin tocar el
 * repositorio (hace falta un redespliegue, ver docs/16-STRIPE.md).
 *
 * Devuelve `null` si Stripe no está configurado o no contesta, y entonces la
 * página enseña «sin precio todavía», que sigue siendo verdad.
 */
export async function precioPremium(locale: Locale): Promise<PrecioPremium | null> {
  const stripe = getStripe();
  const priceId = getPriceId();
  if (!stripe || !priceId) return null;

  try {
    const precio = await stripe.prices.retrieve(priceId);
    return precioDeStripe(
      precio.unit_amount,
      precio.currency,
      (precio.recurring?.interval as Intervalo | undefined) ?? null,
      locale,
    );
  } catch {
    // Un fallo de Stripe no puede tumbar la página de precios: se enseña sin
    // precio, que es como estaba antes de que existiera el cobro.
    return null;
  }
}

/**
 * Cuándo acaba el periodo pagado.
 *
 * En la versión de la API que trae este SDK, `current_period_end` **ya no
 * está en la suscripción**: está en cada línea de la suscripción. Aquí sólo
 * hay una línea (un plan), así que se coge la primera.
 */
export function finDePeriodo(suscripcion: Stripe.Subscription): string | null {
  const segundos = suscripcion.items?.data?.[0]?.current_period_end;
  return segundos ? new Date(segundos * 1000).toISOString() : null;
}

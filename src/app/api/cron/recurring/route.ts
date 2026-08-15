import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import type { Database } from "@/lib/supabase/types";

/**
 * La pasada de cada mañana: crea las listas recurrentes que tocan hoy.
 *
 * La dispara el cron de Vercel (`vercel.json`) una vez al día con un `GET` y
 * la cabecera `Authorization: Bearer $CRON_SECRET`, que Vercel pone solo
 * cuando esa variable existe. Cualquiera puede *llamar* a esta URL; sin ese
 * secreto no hace nada.
 *
 * Todo el trabajo lo hace la base de datos en una sola llamada
 * (`run_due_recurring_lists`, migración 0012): así una pasada es una
 * transacción por lista y no N viajes que se pueden quedar a medias. Aquí sólo
 * queda avisar a quien le toca, que es lo que un `pg_cron` no puede hacer.
 *
 * Node y no borde: la firma VAPID necesita criptografía de Node, igual que en
 * `/api/push/notify`.
 */
export const runtime = "nodejs";
// Una tarea programada no se cachea: cada pasada tiene que ejecutarse.
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!cronSecret || !serviceKey || !supabaseUrl) {
    // Sin configurar, esto no existe. 404 y no 500: un 500 haría que Vercel
    // marcara como fallida una tarea que sencillamente no está montada.
    return NextResponse.json({ error: "cron_not_configured" }, { status: 404 });
  }

  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Clave de servicio: crear listas a nombre de otras personas no lo puede
  // hacer ninguna sesión de usuario (ni debe).
  const supabase = createClient<Database>(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const { data: creadas, error } = await supabase.rpc("run_due_recurring_lists", {});

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  /**
   * Y de paso, la limpieza: dar por terminadas las listas de invitado a las
   * que se les ha pasado el día (migración 0015). Va después de crear las
   * recurrentes y aparte: que falle una no puede impedir la otra, porque son
   * dos trabajos distintos que comparten pasada.
   */
  const { data: terminadas } = await supabase.rpc("finish_stale_guest_lists", {});

  if (!creadas || creadas.length === 0) {
    return NextResponse.json({ created: 0, sent: 0, finished: terminadas ?? 0 });
  }

  const enviados = await avisar(supabase, creadas);

  return NextResponse.json({
    created: creadas.length,
    sent: enviados,
    finished: terminadas ?? 0,
  });
}

type Supabase = ReturnType<typeof createClient<Database>>;
type ListaCreada = Database["public"]["Functions"]["run_due_recurring_lists"]["Returns"][number];

/**
 * Avisa a cada dueño de que su lista ya está hecha.
 *
 * Sin esto la función existe pero no se nota: una lista que aparece sola en
 * una pantalla que no se está mirando es una lista que nadie usa. Si el push
 * no está configurado, se salta sin ruido — la lista está creada igual, que
 * es lo importante.
 */
async function avisar(supabase: Supabase, creadas: ListaCreada[]): Promise<number> {
  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  if (!vapidPublic || !vapidPrivate) return 0;

  webpush.setVapidDetails("mailto:hola@listasupermercado.com", vapidPublic, vapidPrivate);

  const envios = await Promise.allSettled(
    creadas.map(async (creada) => {
      const { data: destinos } = await supabase.rpc("push_targets_for_user", {
        p_user: creada.owner_id,
      });

      return Promise.allSettled(
        (destinos ?? []).map((destino) =>
          webpush
            .sendNotification(
              {
                endpoint: destino.endpoint,
                keys: { p256dh: destino.p256dh, auth: destino.auth },
              },
              JSON.stringify({
                title: creada.title,
                body:
                  destino.locale === "en" ? "Your list is ready" : "Ya tienes la lista preparada",
                url: `/l/${creada.list_id}`,
                // Una notificación por lista creada, no una por dispositivo.
                tag: `recurring-${creada.recurring_id}`,
              }),
            )
            .catch(async (fallo: { statusCode?: number }) => {
              // 404 y 410: esa instalación ya no existe. Mismo criterio que en
              // `/api/push/notify`.
              if (fallo.statusCode === 404 || fallo.statusCode === 410) {
                await supabase.from("push_subscriptions").delete().eq("endpoint", destino.endpoint);
              }
              throw fallo;
            }),
        ),
      );
    }),
  );

  return envios
    .flatMap((envio) => (envio.status === "fulfilled" ? envio.value : []))
    .filter((resultado) => resultado.status === "fulfilled").length;
}

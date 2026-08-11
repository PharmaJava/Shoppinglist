import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import type { Database } from "@/lib/supabase/types";

/**
 * Avisa a los demás miembros de una lista de que alguien ha añadido algo.
 *
 * Lo llama un *Database Webhook* de Supabase al insertarse en `list_items`
 * (configuración en docs/07-PUSH.md). No es un endpoint público: exige un
 * secreto compartido en la cabecera, porque cualquiera que pudiera invocarlo
 * podría hacer sonar el móvil de otra persona.
 *
 * Corre en Node y no en el borde: la firma VAPID necesita criptografía que
 * `web-push` implementa contra las APIs de Node.
 */
export const runtime = "nodejs";

interface WebhookPayload {
  type?: string;
  table?: string;
  record?: {
    list_id?: string;
    name?: string;
    created_by?: string | null;
  };
}

export async function POST(request: NextRequest) {
  const secret = process.env.PUSH_WEBHOOK_SECRET;
  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!secret || !vapidPublic || !vapidPrivate || !serviceKey || !supabaseUrl) {
    // Sin configurar, esto no existe. 404 y no 500: un 500 haría que Supabase
    // reintentase un webhook que nunca va a funcionar.
    return NextResponse.json({ error: "push_not_configured" }, { status: 404 });
  }

  if (request.headers.get("x-webhook-secret") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const payload = (await request.json()) as WebhookPayload;
  const record = payload.record;
  if (payload.type !== "INSERT" || payload.table !== "list_items" || !record?.list_id) {
    return NextResponse.json({ skipped: true });
  }

  // Clave de servicio: el envío tiene que ver las suscripciones de todos los
  // miembros, y ninguna sesión de usuario puede hacerlo (ni debe).
  const supabase = createClient<Database>(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const [{ data: targets }, { data: list }] = await Promise.all([
    supabase.rpc("push_targets_for_list", {
      p_list: record.list_id,
      p_actor: record.created_by ?? null,
    }),
    supabase.from("lists").select("title").eq("id", record.list_id).maybeSingle(),
  ]);

  if (!targets || targets.length === 0) return NextResponse.json({ sent: 0 });

  webpush.setVapidDetails("mailto:hola@listasupermercado.com", vapidPublic, vapidPrivate);

  const url = `/l/${record.list_id}`;
  const results = await Promise.allSettled(
    targets.map((target) =>
      webpush
        .sendNotification(
          {
            endpoint: target.endpoint,
            keys: { p256dh: target.p256dh, auth: target.auth },
          },
          JSON.stringify({
            title: list?.title ?? "ListaSupermercado",
            body:
              target.locale === "en"
                ? `${record.name} was added to the list`
                : `Se ha añadido ${record.name} a la lista`,
            url,
            // Una notificación por lista: cinco productos seguidos son un
            // aviso que se actualiza, no cinco que se apilan.
            tag: `list-${record.list_id}`,
          }),
        )
        .catch(async (error: { statusCode?: number }) => {
          // 404 y 410 significan que esa instalación ya no existe: desinstaló
          // la app o limpió el navegador. Guardar la fila para siempre sólo
          // sirve para reintentar contra un endpoint muerto en cada cambio.
          if (error.statusCode === 404 || error.statusCode === 410) {
            await supabase.from("push_subscriptions").delete().eq("endpoint", target.endpoint);
          }
          throw error;
        }),
    ),
  );

  return NextResponse.json({
    sent: results.filter((result) => result.status === "fulfilled").length,
    failed: results.filter((result) => result.status === "rejected").length,
  });
}

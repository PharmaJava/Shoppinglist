import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getCurrentUserId } from "@/lib/supabase/get-current-user-id";
import type { Locale } from "@/lib/supabase/types";

export const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

/** ¿Puede este navegador recibir notificaciones? En iOS, sólo si la aplicación
 *  está instalada en la pantalla de inicio; ahí `PushManager` no existe en
 *  Safari normal, así que la comprobación vale para los dos casos. */
export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    VAPID_PUBLIC_KEY !== ""
  );
}

export function pushPermission(): NotificationPermission | "unsupported" {
  if (!pushSupported()) return "unsupported";
  return Notification.permission;
}

/**
 * Pide permiso, se suscribe y guarda la suscripción.
 *
 * Devuelve `false` si la persona dice que no: es una respuesta legítima, no un
 * error, y quien llama sólo necesita saber si hay que seguir enseñando el
 * botón.
 */
export async function enablePush(locale: Locale): Promise<boolean> {
  if (!pushSupported()) return false;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;

  const registration = await navigator.serviceWorker.ready;

  // Si ya había una suscripción de otra clave VAPID, sirve de poco: el
  // servidor no podría firmar para ella. Se descarta y se crea otra.
  const existing = await registration.pushManager.getSubscription();
  if (existing) await existing.unsubscribe();

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });

  const userId = await getCurrentUserId();
  if (!userId) return false;

  const raw = subscription.toJSON();
  const { error } = await getSupabaseBrowserClient()
    .from("push_subscriptions")
    .upsert({
      endpoint: subscription.endpoint,
      user_id: userId,
      p256dh: raw.keys?.p256dh ?? "",
      auth: raw.keys?.auth ?? "",
      locale,
    });

  if (error) throw new Error(error.message);
  return true;
}

/** Se da de baja en este navegador. El permiso del sistema no se puede
 *  retirar por código: eso sólo lo hace la persona desde el navegador. */
export async function disablePush(): Promise<void> {
  if (!pushSupported()) return;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;

  await getSupabaseBrowserClient()
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", subscription.endpoint);
  await subscription.unsubscribe();
}

export async function hasPushSubscription(): Promise<boolean> {
  if (!pushSupported() || Notification.permission !== "granted") return false;
  const registration = await navigator.serviceWorker.ready;
  return (await registration.pushManager.getSubscription()) !== null;
}

/**
 * La clave VAPID viaja en base64url y `subscribe()` exige bytes. No hay atajo
 * en la plataforma: `atob` no entiende `-` ni `_`.
 */
function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padded = `${base64}${"=".repeat((4 - (base64.length % 4)) % 4)}`
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const raw = atob(padded);

  // El tipo explícito no es adorno: `Uint8Array.from` devuelve
  // `Uint8Array<ArrayBufferLike>`, que podría respaldarse en un
  // SharedArrayBuffer, y `applicationServerKey` no lo acepta.
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

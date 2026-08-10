import posthog from "posthog-js";

let initialized = false;

/**
 * Inicializa PostHog (EU Cloud por defecto). No-op si no hay clave — el resto
 * de funciones de este módulo son seguras de llamar igualmente, simplemente
 * no hacen nada hasta que haya clave configurada.
 */
export function initPostHog(): void {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key || initialized) return;

  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com",
    // No crea un perfil de persona (ni las cookies asociadas) hasta que se
    // llame a identify(): reduce la huella del uso anónimo sin necesidad de
    // banner de consentimiento para esa parte. Al registrarse (Fase 2) sí
    // haría falta revisar esto con más detalle.
    person_profiles: "identified_only",
    capture_pageview: false, // se dispara a mano desde instrumentation-client.ts
  });
  initialized = true;
}

export function track(event: string, properties?: Record<string, unknown>): void {
  if (!initialized) return;
  posthog.capture(event, properties);
}

export function identifyUser(userId: string): void {
  if (!initialized) return;
  posthog.identify(userId);
}

export function trackPageview(url: string): void {
  if (!initialized) return;
  posthog.capture("$pageview", { $current_url: url });
}

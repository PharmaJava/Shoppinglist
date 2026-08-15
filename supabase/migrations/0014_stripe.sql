-- ══════════════════════════════════════════════════════════════════
-- 0014 · Suscripciones de Stripe (F3-1)
--
-- La tabla `subscriptions` ya está en el esquema base y su política de
-- lectura también: cada cual ve la suya y **nadie la escribe desde el
-- cliente**. Lo que faltaba es quién la escribe y con qué garantías.
--
-- La escribe el webhook de Stripe con la clave de servicio, y todo lo que
-- hace pasa por la función de aquí abajo. Dos cosas que tienen que ser
-- verdad para que esto no dé disgustos:
--
-- 1. **Un aviso repetido no puede cobrar dos veces ni descolocar nada.**
--    Stripe reintenta los webhooks: si su servidor no recibe un 200 a la
--    primera —un despliegue a medias, un pico de latencia— manda el mismo
--    evento otra vez. Por eso se apunta cada evento y el segundo no hace nada.
-- 2. **El plan y la suscripción se escriben juntos o no se escriben.** Si se
--    guardara la suscripción y fallara el `update` del perfil, alguien estaría
--    pagando sin tener premium. Una función, una transacción.
-- ══════════════════════════════════════════════════════════════════

/*
 * Los eventos ya procesados. El identificador es el de Stripe (`evt_...`), así
 * que la clave primaria es la que hace el trabajo: el segundo intento choca y
 * no entra.
 *
 * Sin ninguna política de RLS **a propósito**: con RLS activada y cero
 * políticas, nadie que no sea la clave de servicio ve ni escribe una fila.
 */
create table if not exists public.stripe_events (
  id          text primary key,
  type        text not null,
  received_at timestamptz not null default now()
);

alter table public.stripe_events enable row level security;

/*
 * Cuánto se guarda: lo justo para reconocer un repetido. Los eventos de hace
 * meses no sirven para nada —Stripe no reintenta tanto tiempo— y esta tabla no
 * tiene por qué crecer para siempre.
 */
create index if not exists stripe_events_received_idx on public.stripe_events (received_at);

-- ─────────────── Aplicar lo que dice Stripe, una sola vez ──────────

/**
 * Guarda el estado de la suscripción y ajusta el plan del perfil.
 *
 * Devuelve `true` si ha hecho algo y `false` si el evento ya estaba
 * procesado. El webhook responde 200 en los dos casos: para Stripe, un
 * repetido bien ignorado es un éxito.
 *
 * SECURITY DEFINER porque escribe `profiles.plan`, que ninguna sesión puede
 * tocar (política `profiles_update_own`, migración 0010). Y sólo la puede
 * llamar el servidor: quien pudiera invocarla desde el navegador se regalaría
 * el plan premium.
 */
create or replace function public.apply_subscription(
  p_event        text,
  p_event_type   text,
  p_user         uuid,
  p_customer     text,
  p_subscription text,
  p_status       text,
  p_period_end   timestamptz
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rol  text;
  v_plan text;
begin
  v_rol := coalesce(
    current_setting('request.jwt.claim.role', true),
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'
  );
  if v_rol is not null and v_rol <> 'service_role' then
    raise exception 'apply_subscription sólo la puede llamar el servidor.';
  end if;

  -- La barrera contra los repetidos. Va **antes** de tocar nada: si el evento
  -- ya estaba, aquí se acaba la función.
  insert into public.stripe_events (id, type) values (p_event, p_event_type)
  on conflict (id) do nothing;
  if not found then
    return false;
  end if;

  /*
   * Qué estados dan premium. `past_due` sí, y es una decisión: significa que
   * un cobro ha fallado y Stripe va a reintentarlo durante días. Cortar el
   * acceso al primer reintento castiga a quien se le ha caducado la tarjeta y
   * ni se ha enterado —Stripe ya le escribe—. Cuando se agotan los reintentos
   * el estado pasa a `unpaid` o `canceled`, y ahí sí.
   */
  v_plan := case
    when p_status in ('active', 'trialing', 'past_due') then 'premium'
    else 'free'
  end;

  insert into public.subscriptions (
    user_id, stripe_customer_id, stripe_subscription_id, status, current_period_end
  )
  values (p_user, p_customer, p_subscription, p_status, p_period_end)
  on conflict (user_id) do update set
    -- `coalesce`: un evento de suscripción no siempre trae el cliente, y no
    -- puede borrar el que ya había.
    stripe_customer_id     = coalesce(excluded.stripe_customer_id, public.subscriptions.stripe_customer_id),
    stripe_subscription_id = coalesce(excluded.stripe_subscription_id, public.subscriptions.stripe_subscription_id),
    status                 = excluded.status,
    current_period_end     = coalesce(excluded.current_period_end, public.subscriptions.current_period_end);

  update public.profiles set plan = v_plan where id = p_user;

  return true;
end;
$$;

-- Ver la migración 0012 sobre por qué se nombran `anon` y `authenticated`:
-- Supabase concede EXECUTE a esos roles sobre todo lo que se cree en `public`.
revoke all on function public.apply_subscription(text, text, uuid, text, text, text, timestamptz)
  from public, anon, authenticated;

/**
 * De quién es este cliente de Stripe.
 *
 * El webhook de una suscripción no trae el usuario, sólo el cliente. Esto lo
 * resuelve en un viaje. Server-only por lo mismo que todo lo de arriba.
 */
create or replace function public.user_for_stripe_customer(p_customer text)
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select s.user_id from public.subscriptions s where s.stripe_customer_id = p_customer;
$$;

revoke all on function public.user_for_stripe_customer(text) from public, anon, authenticated;

insert into public.schema_migrations (version) values ('0014_stripe')
on conflict (version) do nothing;

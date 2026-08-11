-- ══════════════════════════════════════════════════════════════════
-- 0006 · Suscripciones de notificaciones push
--
-- Una fila por navegador, no por persona: la misma cuenta puede tener el móvil
-- y el portátil suscritos, y cada uno tiene su propio endpoint y sus claves.
-- ══════════════════════════════════════════════════════════════════

create table if not exists public.push_subscriptions (
  -- La URL que da el navegador. Es única por instalación y es lo que hay que
  -- borrar cuando el servicio de push responde 404 o 410 (suscripción muerta).
  endpoint   text primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  p256dh     text not null,
  auth       text not null,
  -- En qué idioma escribirle. La notificación se compone en el servidor, que
  -- no tiene forma de saberlo si no se guarda aquí.
  locale     text not null default 'es' check (locale in ('es', 'en')),
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

-- Cada cual gestiona las suyas. El envío no pasa por aquí: lo hace el servidor
-- con la clave de servicio, que se salta RLS.
drop policy if exists push_own on public.push_subscriptions;
create policy push_own on public.push_subscriptions for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

/**
 * A quién avisar de un cambio en una lista, sin exponer nada.
 *
 * Devuelve las suscripciones de los miembros **menos las de quien hizo el
 * cambio**: nadie necesita que le avisen de lo que acaba de escribir él.
 *
 * SECURITY DEFINER y sin `grant` a `authenticated`: sólo la llama el servidor
 * con la clave de servicio. Si se pudiera invocar desde el navegador, sería
 * una forma de leer los endpoints de push de otras personas.
 */
create or replace function public.push_targets_for_list(p_list uuid, p_actor uuid)
returns table (endpoint text, p256dh text, auth text, locale text)
language sql
security definer
stable
set search_path = public
as $$
  select s.endpoint, s.p256dh, s.auth, s.locale
  from public.push_subscriptions s
  join public.list_members m on m.user_id = s.user_id
  where m.list_id = p_list
    and (p_actor is null or s.user_id <> p_actor);
$$;

revoke all on function public.push_targets_for_list(uuid, uuid) from public;
revoke all on function public.push_targets_for_list(uuid, uuid) from authenticated;

insert into public.schema_migrations (version) values ('0006_push_subscriptions')
on conflict (version) do nothing;

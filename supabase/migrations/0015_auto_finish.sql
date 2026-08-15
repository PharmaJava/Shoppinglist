-- ══════════════════════════════════════════════════════════════════
-- 0015 · Dar por terminadas las listas de invitado
--
-- Una lista de la compra tiene un final natural: se compra y se acaba. Quien
-- tiene cuenta la archiva cuando quiere, o la deja abierta si le sirve de
-- lista fija. Un invitado sin cuenta, en cambio, la deja abierta para
-- siempre: cierra la pestaña, no vuelve, y esa lista se queda ahí como si la
-- compra siguiera en marcha.
--
-- A las 24 horas de crearla se da por terminada: es tiempo de sobra para
-- haber ido al súper. «Terminada» es **archivada**, no borrada — sigue ahí,
-- se puede volver a abrir de un toque, y sus productos no se tocan. Lo que se
-- pierde es la ficción de que la compra sigue abierta.
--
-- Dos excepciones, y no son un capricho:
--
-- 1. **Si el invitado se registra, su lista deja de caducar.** Es justo lo que
--    se le ofrece a cambio de crear la cuenta.
-- 2. **Si alguien con cuenta entra en la lista compartida, tampoco.** La lista
--    de la casa donde uno de los dos está registrado no es «la lista de un
--    invitado» ya, y dársela por terminada por debajo sería quitársela a quien
--    sí tiene cuenta.
-- ══════════════════════════════════════════════════════════════════

/*
 * Cuándo se da por terminada. Nula = nunca, que es lo que tienen todas las
 * listas de quien tiene cuenta.
 */
alter table public.lists add column if not exists auto_finish_at timestamptz;

-- El índice que usa la pasada diaria: sólo mira lo que sigue abierto.
create index if not exists lists_auto_finish_idx on public.lists (auto_finish_at)
  where auto_finish_at is not null and archived_at is null;

/** Cuánto dura abierta la lista de un invitado. */
create or replace function public.guest_list_window()
returns interval
language sql
immutable
as $$ select interval '24 hours'; $$;

-- ────────────────────── ¿Quién es un invitado? ─────────────────────

/**
 * Un invitado es una sesión anónima de Supabase.
 *
 * SECURITY DEFINER porque `auth.users` no la puede leer ni la clave de
 * servicio: es de `supabase_auth_admin` (la misma razón por la que
 * `admin_kpis` es DEFINER desde la migración 0009).
 *
 * Sin `grant`: sólo la llaman los disparadores y funciones de aquí abajo, que
 * al ser DEFINER corren como el dueño. Desde el navegador sería una forma de
 * preguntar quién tiene cuenta y quién no.
 */
create or replace function public.is_guest(p_user uuid)
returns boolean
language sql
security definer
stable
set search_path = public, auth
as $$
  select coalesce((select u.is_anonymous from auth.users u where u.id = p_user), false);
$$;

revoke all on function public.is_guest(uuid) from public, anon, authenticated;

-- ───────────────── Ponerle fecha al crear la lista ─────────────────

create or replace function public.lists_set_auto_finish()
returns trigger
language plpgsql
-- DEFINER para poder llamar a `is_guest`, que lee `auth.users`.
security definer
set search_path = public
as $$
begin
  if public.is_guest(new.owner_id) then
    new.auto_finish_at := now() + public.guest_list_window();
  end if;
  return new;
end;
$$;

drop trigger if exists lists_set_auto_finish on public.lists;
create trigger lists_set_auto_finish
before insert on public.lists
for each row execute function public.lists_set_auto_finish();

-- ─────────────────── Y quitársela cuando toca ──────────────────────

/**
 * Alguien con cuenta entra en la lista: deja de caducar.
 *
 * La lista de la casa donde uno de los dos está registrado no es la lista de
 * un invitado. Sin esto, la compra de la familia se archivaría sola a las 24
 * horas por culpa de quién la creó.
 */
create or replace function public.lists_clear_auto_finish_on_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_guest(new.user_id) then
    update public.lists set auto_finish_at = null
    where id = new.list_id and auto_finish_at is not null;
  end if;
  return new;
end;
$$;

drop trigger if exists on_list_member_registered on public.list_members;
create trigger on_list_member_registered
after insert on public.list_members
for each row execute function public.lists_clear_auto_finish_on_member();

/**
 * El invitado se registra: sus listas dejan de caducar.
 *
 * Es exactamente lo que se le ofrece a cambio de crear la cuenta, así que
 * tiene que pasar solo y en el momento, sin esperar a ninguna pasada.
 */
create or replace function public.handle_user_registered()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(old.is_anonymous, false) and not coalesce(new.is_anonymous, false) then
    update public.lists set auto_finish_at = null
    where owner_id = new.id and auto_finish_at is not null;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_registered on auth.users;
create trigger on_auth_user_registered
after update on auth.users
for each row execute function public.handle_user_registered();

-- ──────────── La fecha no se toca desde el navegador ───────────────

/*
 * Igual que `profiles.plan` (migración 0010): la política de actualización
 * dejaba escribir cualquier columna de la lista, y con la columna nueva eso
 * significa que cualquiera podría ponerse `auto_finish_at = null` en la
 * consola y saltarse la regla entera.
 *
 * Se sigue pudiendo cambiar el título, la moneda, el presupuesto y archivar.
 * Para volver a abrir una lista terminada está `reopen_list()`, aquí abajo.
 */
drop policy if exists lists_update on public.lists;
create policy lists_update on public.lists for update
  using (public.can_edit_list(id))
  with check (
    public.can_edit_list(id)
    and auto_finish_at is not distinct from (select l.auto_finish_at from public.lists l where l.id = id)
  );

-- ─────────────────────── Volver a abrirla ──────────────────────────

/**
 * «Sigo con esta lista»: la desarchiva y le da otras 24 horas.
 *
 * Va en una función porque toca `auto_finish_at`, que el cliente no puede
 * escribir. Y da 24 horas más en vez de quitar la fecha: quien sigue sin
 * cuenta sigue con la regla, sólo que contando desde ahora.
 */
create or replace function public.reopen_list(p_list uuid)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nueva timestamptz;
begin
  if not public.can_edit_list(p_list) then
    raise exception 'Esa lista no es tuya.';
  end if;

  update public.lists
    set archived_at = null,
        auto_finish_at = case
          when auto_finish_at is null then null
          else now() + public.guest_list_window()
        end
  where id = p_list
  returning auto_finish_at into v_nueva;

  return v_nueva;
end;
$$;

revoke all on function public.reopen_list(uuid) from public, anon;
grant execute on function public.reopen_list(uuid) to authenticated;

-- ──────────────────── La pasada de cada día ────────────────────────

/**
 * Archiva las listas de invitado a las que se les ha pasado la hora.
 *
 * La llama la tarea diaria (`/api/cron/recurring`). No es la única vía: la
 * propia pantalla de la lista la archiva en cuanto se abre pasada la hora, de
 * modo que quien la mire ve la verdad al instante y esta pasada se encarga de
 * las que nadie abre.
 *
 * El `is_guest` del final es un cinturón además de los tirantes: si por lo que
 * sea un disparador no llegó a limpiar la fecha al registrarse alguien, aquí
 * no se archiva la lista de quien ya tiene cuenta.
 */
create or replace function public.finish_stale_guest_lists()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rol      text;
  v_cuantas  integer;
begin
  v_rol := coalesce(
    current_setting('request.jwt.claim.role', true),
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'
  );
  if v_rol is not null and v_rol <> 'service_role' then
    raise exception 'finish_stale_guest_lists sólo la puede llamar el servidor.';
  end if;

  update public.lists
    set archived_at = now()
  where auto_finish_at is not null
    and auto_finish_at < now()
    and archived_at is null
    and public.is_guest(owner_id);

  get diagnostics v_cuantas = row_count;
  return v_cuantas;
end;
$$;

revoke all on function public.finish_stale_guest_lists() from public, anon, authenticated;

insert into public.schema_migrations (version) values ('0015_auto_finish')
on conflict (version) do nothing;

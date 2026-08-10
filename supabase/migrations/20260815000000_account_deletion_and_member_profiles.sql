-- 1) Borrado de cuenta por la propia persona (RGPD, derecho de supresión).
-- 2) Nombre visible entre quienes comparten lista.

-- ── Borrado de cuenta ───────────────────────────────────────────────
--
-- Un cliente con la clave anónima no puede tocar `auth.users`, así que el
-- borrado pasa por una función SECURITY DEFINER que sólo puede borrarse a uno
-- mismo: no acepta parámetros y actúa siempre sobre `auth.uid()`.
--
-- El borrado cascadea a todo lo demás por las claves foráneas de la migración
-- inicial: perfil, listas propias, membresías, invitaciones, historial y
-- suscripción. Ojo con la consecuencia: **las listas de las que es propietario
-- desaparecen también para quienes las compartían**. La interfaz lo advierte
-- antes de confirmar.

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'auth_required' using errcode = '28000';
  end if;

  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;

-- ── Nombre visible entre miembros ───────────────────────────────────
--
-- `profiles_select_own` sólo dejaba leer el perfil propio, así que una lista
-- compartida no podía mostrar de quién era cada cosa: sólo UUIDs. Se amplía a
-- los perfiles de quienes comparten alguna lista contigo, que es exactamente
-- la gente que ya ve tus productos.
--
-- La comprobación va en una función SECURITY DEFINER por la misma razón que
-- `is_list_member`: consultar `list_members` desde una política de `profiles`
-- volvería a evaluar las políticas de `list_members` y entraría en recursión.

create or replace function public.shares_list_with(p_user uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.list_members mine
    join public.list_members theirs on theirs.list_id = mine.list_id
    where mine.user_id = auth.uid() and theirs.user_id = p_user
  );
$$;

drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_select_visible on public.profiles;
create policy profiles_select_visible on public.profiles for select
  using (id = auth.uid() or public.shares_list_with(id));

-- ── Verificación ────────────────────────────────────────────────────

select policyname, cmd
from pg_policies
where schemaname = 'public' and tablename = 'profiles'
order by policyname;

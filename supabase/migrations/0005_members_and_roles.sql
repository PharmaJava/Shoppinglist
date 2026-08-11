-- ══════════════════════════════════════════════════════════════════
-- 0005 · Gestión de miembros: rol, expulsión, salida y traspaso
--
-- El esquema base ya distingue owner / editor / viewer y `can_edit_list`
-- respeta esa distinción, pero no había forma de cambiar el rol de nadie ni
-- de traspasar una lista. Esto lo completa.
--
-- Todo pasa por funciones y no por políticas de UPDATE sobre `list_members`
-- porque las reglas son de negocio, no de fila: que no haya dos propietarios,
-- que nadie se degrade a sí mismo y se quede la lista sin dueño, que el
-- propietario no pueda salir sin traspasar antes. Una política no puede
-- expresar eso sin volverse ilegible.
-- ══════════════════════════════════════════════════════════════════

-- ─────────────────────── Cambiar el rol de alguien ───────────────

create or replace function public.set_member_role(
  p_list uuid,
  p_user uuid,
  p_role public.list_role
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
begin
  select owner_id into v_owner from public.lists where id = p_list;

  if v_owner is null or v_owner <> auth.uid() then
    raise exception 'not_owner' using errcode = '42501';
  end if;

  -- El propietario no se cambia el rol a sí mismo: para eso está el traspaso,
  -- que es explícito y deja siempre a alguien al mando.
  if p_user = v_owner then
    raise exception 'use_transfer_ownership' using errcode = '22023';
  end if;

  if p_role = 'owner' then
    raise exception 'use_transfer_ownership' using errcode = '22023';
  end if;

  update public.list_members
  set role = p_role
  where list_id = p_list and user_id = p_user;

  if not found then
    raise exception 'not_a_member' using errcode = 'P0002';
  end if;
end;
$$;

-- ──────────────────────────── Traspasar ──────────────────────────

create or replace function public.transfer_list_ownership(p_list uuid, p_to uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
begin
  select owner_id into v_owner from public.lists where id = p_list;

  if v_owner is null or v_owner <> auth.uid() then
    raise exception 'not_owner' using errcode = '42501';
  end if;

  if p_to = v_owner then
    return;
  end if;

  if not exists (
    select 1 from public.list_members m where m.list_id = p_list and m.user_id = p_to
  ) then
    raise exception 'not_a_member' using errcode = 'P0002';
  end if;

  -- Los tres pasos van juntos o no van: una lista con dos propietarios, o con
  -- ninguno, es un estado del que no se sale desde la interfaz.
  update public.lists set owner_id = p_to, updated_at = now() where id = p_list;
  update public.list_members set role = 'owner' where list_id = p_list and user_id = p_to;
  update public.list_members set role = 'editor' where list_id = p_list and user_id = v_owner;
end;
$$;

-- ─────────────────── Expulsar y salir por voluntad propia ────────

create or replace function public.remove_list_member(p_list uuid, p_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
begin
  select owner_id into v_owner from public.lists where id = p_list;
  if v_owner is null then
    raise exception 'not_a_member' using errcode = 'P0002';
  end if;

  -- Expulsa el propietario; salir puede cualquiera.
  if auth.uid() <> v_owner and auth.uid() <> p_user then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  -- Al propietario no se le echa ni se puede ir dejando la lista huérfana:
  -- primero traspasa, o borra la lista entera.
  if p_user = v_owner then
    raise exception 'owner_must_transfer_first' using errcode = '22023';
  end if;

  delete from public.list_members where list_id = p_list and user_id = p_user;
end;
$$;

revoke all on function public.set_member_role(uuid, uuid, public.list_role) from public;
revoke all on function public.transfer_list_ownership(uuid, uuid) from public;
revoke all on function public.remove_list_member(uuid, uuid) from public;
grant execute on function public.set_member_role(uuid, uuid, public.list_role) to authenticated;
grant execute on function public.transfer_list_ownership(uuid, uuid) to authenticated;
grant execute on function public.remove_list_member(uuid, uuid) to authenticated;

-- No hacen falta políticas nuevas: `can_edit_list` ya excluye al rol `viewer`
-- y la usan tanto `list_items` como `lists_update`, así que un lector no puede
-- ni añadir productos ni renombrar la lista. Lo que faltaba era poder asignar
-- ese rol, que es lo que añade esta migración.

insert into public.schema_migrations (version) values ('0005_members_and_roles')
on conflict (version) do nothing;

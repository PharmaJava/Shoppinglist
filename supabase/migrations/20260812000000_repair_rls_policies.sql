-- Reparación idempotente de RLS — a ejecutar si "crear lista" falla con
-- "new row violates row-level security policy for table lists" incluso con
-- una sesión anónima recién creada.
--
-- Diagnóstico: ese mensaje de Postgres es el mismo tanto si una política
-- existe pero su condición no se cumple, como si NO existe ninguna política
-- aplicable para esa operación (RLS deniega por defecto sin políticas). Dado
-- que el error persiste incluso con sesión nueva, lo más probable es que al
-- pegar la migración original en el SQL Editor sólo se aplicara parte del
-- archivo (algunas herramientas de pegado truncan sentencias muy largas, o
-- un solo error a mitad de archivo detiene el resto).
--
-- Este script vuelve a crear las funciones auxiliares y TODAS las políticas
-- de RLS de la migración inicial, sin fallar si ya existen (drop policy if
-- exists + create policy; create or replace function). Seguro de ejecutar
-- las veces que haga falta.

-- ── Funciones auxiliares ────────────────────────────────────────────

create or replace function public.is_list_member(p_list uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.list_members m
    where m.list_id = p_list and m.user_id = auth.uid()
  );
$$;

create or replace function public.can_edit_list(p_list uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.list_members m
    where m.list_id = p_list and m.user_id = auth.uid()
      and m.role in ('owner', 'editor')
  );
$$;

-- ── RLS activado en todas las tablas (no-op si ya lo estaba) ────────

alter table public.profiles             enable row level security;
alter table public.lists                enable row level security;
alter table public.list_members         enable row level security;
alter table public.list_invites         enable row level security;
alter table public.list_items           enable row level security;
alter table public.products             enable row level security;
alter table public.user_product_history enable row level security;
alter table public.list_templates       enable row level security;
alter table public.template_items       enable row level security;
alter table public.subscriptions        enable row level security;
alter table public.categories           enable row level security;

-- ── categories / products: catálogo de sistema, lectura pública ────

drop policy if exists categories_select_all on public.categories;
create policy categories_select_all on public.categories for select using (true);

drop policy if exists products_select_all on public.products;
create policy products_select_all on public.products for select using (true);

-- ── profiles ─────────────────────────────────────────────────────

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles for select using (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update using (id = auth.uid());

-- ── lists ────────────────────────────────────────────────────────

drop policy if exists lists_select on public.lists;
create policy lists_select on public.lists for select
  using (public.is_list_member(id));

drop policy if exists lists_insert on public.lists;
create policy lists_insert on public.lists for insert
  with check (owner_id = auth.uid());

drop policy if exists lists_update on public.lists;
create policy lists_update on public.lists for update
  using (public.can_edit_list(id)) with check (public.can_edit_list(id));

drop policy if exists lists_delete on public.lists;
create policy lists_delete on public.lists for delete
  using (owner_id = auth.uid());

-- ── list_items ───────────────────────────────────────────────────

drop policy if exists items_select on public.list_items;
create policy items_select on public.list_items for select
  using (public.is_list_member(list_id));

drop policy if exists items_insert on public.list_items;
create policy items_insert on public.list_items for insert
  with check (public.can_edit_list(list_id));

drop policy if exists items_update on public.list_items;
create policy items_update on public.list_items for update
  using (public.can_edit_list(list_id)) with check (public.can_edit_list(list_id));

drop policy if exists items_delete on public.list_items;
create policy items_delete on public.list_items for delete
  using (public.can_edit_list(list_id));

-- ── list_members ─────────────────────────────────────────────────

drop policy if exists members_select on public.list_members;
create policy members_select on public.list_members for select
  using (public.is_list_member(list_id));

drop policy if exists members_delete on public.list_members;
create policy members_delete on public.list_members for delete
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.lists l
      where l.id = list_id and l.owner_id = auth.uid()
    )
  );

-- ── list_invites: sin política de SELECT a propósito ───────────────

drop policy if exists invites_manage on public.list_invites;
create policy invites_manage on public.list_invites for all
  using (exists (select 1 from public.lists l where l.id = list_id and l.owner_id = auth.uid()))
  with check (exists (select 1 from public.lists l where l.id = list_id and l.owner_id = auth.uid()));

-- ── user_product_history ────────────────────────────────────────

drop policy if exists history_own on public.user_product_history;
create policy history_own on public.user_product_history for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── list_templates ───────────────────────────────────────────────

drop policy if exists templates_select on public.list_templates;
create policy templates_select on public.list_templates for select
  using (is_public = true or owner_id = auth.uid());

drop policy if exists templates_write on public.list_templates;
create policy templates_write on public.list_templates for insert
  with check (owner_id = auth.uid());

drop policy if exists templates_update on public.list_templates;
create policy templates_update on public.list_templates for update
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists templates_delete on public.list_templates;
create policy templates_delete on public.list_templates for delete
  using (owner_id = auth.uid());

-- ── template_items ───────────────────────────────────────────────

drop policy if exists template_items_select on public.template_items;
create policy template_items_select on public.template_items for select
  using (
    exists (
      select 1 from public.list_templates t
      where t.id = template_id and (t.is_public = true or t.owner_id = auth.uid())
    )
  );

drop policy if exists template_items_write on public.template_items;
create policy template_items_write on public.template_items for all
  using (exists (select 1 from public.list_templates t where t.id = template_id and t.owner_id = auth.uid()))
  with check (exists (select 1 from public.list_templates t where t.id = template_id and t.owner_id = auth.uid()));

-- ── subscriptions ────────────────────────────────────────────────

drop policy if exists subscriptions_select_own on public.subscriptions;
create policy subscriptions_select_own on public.subscriptions for select using (user_id = auth.uid());

-- ── Verificación: debe listar 4 filas (select/insert/update/delete) ─

select policyname, cmd
from pg_policies
where schemaname = 'public' and tablename = 'lists'
order by policyname;

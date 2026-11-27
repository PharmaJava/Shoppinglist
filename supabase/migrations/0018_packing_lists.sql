-- ══════════════════════════════════════════════════════════════════
-- 0018 · Listas de equipaje
--
-- Una lista que no es de la compra: la mochila de los niños, la maleta de
-- un viaje. Funciona igual —se comparte, va sin conexión, se marca— con dos
-- diferencias que justifican un tipo propio:
--
-- 1. Se agrupa por **secciones que pone quien la usa** («Mochila niños»,
--    «Maleta Dani»), no por los pasillos fijos del súper de `categories`.
-- 2. **Se repite**: la mochila es la misma cada semana. Al terminar se
--    desmarca, no se borra, y por eso no caduca a las 24 horas como las
--    listas de invitado (0015).
-- ══════════════════════════════════════════════════════════════════

-- ───────────────────────────── El tipo ─────────────────────────────

alter table public.lists add column if not exists kind text not null default 'shopping';

do $$ begin
  alter table public.lists add constraint lists_kind_check check (kind in ('shopping', 'packing'));
exception when duplicate_object then null;
end $$;

-- ──────────────────────────── Secciones ────────────────────────────

create table if not exists public.list_sections (
  -- El id lo pone el cliente, igual que en `list_items`: una sección se crea
  -- sin cobertura y los productos que se le añaden ya la referencian.
  id         uuid primary key,
  list_id    uuid not null references public.lists (id) on delete cascade,
  name       text not null check (length(btrim(name)) between 1 and 80),
  sort_key   text not null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Borrado lógico, como los productos: así el borrado viaja por el outbox y
  -- llega a los demás por tiempo real igual que cualquier otro cambio.
  deleted_at timestamptz,
  -- Para la clave ajena compuesta de `list_items`, aquí abajo.
  unique (id, list_id)
);

create index if not exists list_sections_list_sort_idx on public.list_sections (list_id, sort_key)
  where deleted_at is null;

drop trigger if exists list_sections_set_updated_at on public.list_sections;
create trigger list_sections_set_updated_at
before update on public.list_sections
for each row execute function public.set_updated_at();

-- Mismo reparto que los productos (0001): la ven los miembros, la tocan
-- quienes pueden editar la lista.
alter table public.list_sections enable row level security;

drop policy if exists sections_select on public.list_sections;
create policy sections_select on public.list_sections for select
  using (public.is_list_member(list_id));

drop policy if exists sections_insert on public.list_sections;
create policy sections_insert on public.list_sections for insert
  with check (public.can_edit_list(list_id));

drop policy if exists sections_update on public.list_sections;
create policy sections_update on public.list_sections for update
  using (public.can_edit_list(list_id)) with check (public.can_edit_list(list_id));

drop policy if exists sections_delete on public.list_sections;
create policy sections_delete on public.list_sections for delete
  using (public.can_edit_list(list_id));

-- ─────────────────── En qué sección va cada cosa ───────────────────

alter table public.list_items add column if not exists section_id uuid;

/*
 * Compuesta con `list_id` a propósito: con una clave simple, un producto
 * podría apuntar a la sección de otra lista. Y `set null (section_id)` —sólo
 * esa columna, PostgreSQL 15+— porque si la sección desaparece el producto se
 * queda en su lista, sin sección; anular también `list_id` violaría su NOT
 * NULL.
 */
do $$ begin
  alter table public.list_items
    add constraint list_items_section_fkey
    foreign key (section_id, list_id) references public.list_sections (id, list_id)
    on delete set null (section_id);
exception when duplicate_object then null;
end $$;

create index if not exists list_items_section_idx on public.list_items (section_id)
  where section_id is not null;

-- ───────────── Una lista de equipaje no caduca a las 24 h ─────────────

create or replace function public.lists_set_auto_finish()
returns trigger
language plpgsql
-- DEFINER para poder llamar a `is_guest`, que lee `auth.users`.
security definer
set search_path = public
as $$
begin
  -- La regla de 0015 es para la compra de un invitado, que se hace y se
  -- acaba. Una lista de equipaje está hecha para volver a usarse: archivarla
  -- y borrarla a las 24 horas sería quitarle a quien la hizo justo lo que
  -- vino a buscar.
  if new.kind = 'shopping' and public.is_guest(new.owner_id) then
    new.auto_finish_at := now() + public.guest_list_window();
  end if;
  return new;
end;
$$;

-- ─────────────── Y el tipo no se cambia desde el navegador ───────────────

/*
 * Como el dueño o la caducidad (0017): si se pudiera, una lista de la compra
 * de invitado se convertiría en «de equipaje» con una línea en la consola y
 * se saltaría la regla de las 24 horas.
 */
create or replace function public.lists_protect_columns()
returns trigger
language plpgsql
as $$
begin
  if current_user in ('authenticated', 'anon') then
    new.owner_id := old.owner_id;
    new.auto_finish_at := old.auto_finish_at;
    new.created_at := old.created_at;
    new.kind := old.kind;
  end if;
  return new;
end;
$$;

-- ──────────────────────────── Tiempo real ────────────────────────────

do $$ begin
  alter publication supabase_realtime add table public.list_sections;
exception when duplicate_object then null;
end $$;

insert into public.schema_migrations (version) values ('0018_packing_lists')
on conflict (version) do nothing;

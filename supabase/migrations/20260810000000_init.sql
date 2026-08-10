-- ShoppingList — esquema inicial
-- Ver docs/01-DATA-MODEL.md para el razonamiento de cada decisión.

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- ─────────────────────────── Perfiles ───────────────────────────

create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url   text,
  locale       text not null default 'es' check (locale in ('es', 'en')),
  currency     char(3) not null default 'EUR',
  plan         text not null default 'free' check (plan in ('free', 'premium')),
  created_at   timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ─────────────────────── Categorías / pasillos ───────────────────

create table public.categories (
  id         text primary key,
  name_es    text not null,
  name_en    text not null,
  icon       text,
  sort_order int not null
);

-- ─────────────────────────── Utilidad ────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ───────────────────────────── Listas ────────────────────────────

create table public.lists (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references auth.users (id) on delete cascade,
  title        text not null default 'Mi lista',
  emoji        text,
  currency     char(3) not null default 'EUR',
  budget_cents integer,
  archived_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger lists_set_updated_at
before update on public.lists
for each row execute function public.set_updated_at();

create type public.list_role as enum ('owner', 'editor', 'viewer');

create table public.list_members (
  list_id   uuid not null references public.lists (id) on delete cascade,
  user_id   uuid not null references auth.users (id) on delete cascade,
  role      public.list_role not null default 'editor',
  joined_at timestamptz not null default now(),
  primary key (list_id, user_id)
);
create index list_members_user_id_idx on public.list_members (user_id);

create or replace function public.handle_new_list()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.list_members (list_id, user_id, role)
  values (new.id, new.owner_id, 'owner');
  return new;
end;
$$;

create trigger on_list_created
after insert on public.lists
for each row execute function public.handle_new_list();

-- ────────────────────────── Invitaciones ─────────────────────────

create table public.list_invites (
  token      text primary key,
  list_id    uuid not null references public.lists (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete cascade,
  role       public.list_role not null default 'editor',
  expires_at timestamptz,
  revoked_at timestamptz,
  max_uses   integer,
  uses       integer not null default 0,
  created_at timestamptz not null default now()
);
create index list_invites_list_id_idx on public.list_invites (list_id);

-- ─────────────────────────── Productos ───────────────────────────

create table public.list_items (
  id          uuid primary key,
  list_id     uuid not null references public.lists (id) on delete cascade,
  name        text not null check (length(name) between 1 and 200),
  qty         numeric(10, 2),
  unit        text,
  note        text,
  category_id text references public.categories (id),
  price_cents integer,
  is_checked  boolean not null default false,
  checked_by  uuid references auth.users (id) on delete set null,
  checked_at  timestamptz,
  assigned_to uuid references auth.users (id) on delete set null,
  sort_key    text not null,
  created_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);
create index list_items_list_sort_idx on public.list_items (list_id, sort_key)
  where deleted_at is null;
create index list_items_list_updated_idx on public.list_items (list_id, updated_at);

create trigger list_items_set_updated_at
before update on public.list_items
for each row execute function public.set_updated_at();

-- ──────────────── Catálogo y aprendizaje personal ────────────────

create table public.products (
  id           uuid primary key default gen_random_uuid(),
  locale       text not null check (locale in ('es', 'en')),
  name         text not null,
  normalized   text not null,
  category_id  text references public.categories (id),
  default_unit text,
  popularity   integer not null default 0,
  unique (locale, normalized)
);
create index products_normalized_trgm_idx on public.products using gin (normalized gin_trgm_ops);

create table public.user_product_history (
  user_id         uuid not null references auth.users (id) on delete cascade,
  normalized      text not null,
  name            text not null,
  category_id     text references public.categories (id),
  times_added     integer not null default 1,
  last_added      timestamptz not null default now(),
  avg_price_cents integer,
  primary key (user_id, normalized)
);

-- ──────────────────────────── Plantillas ─────────────────────────

create table public.list_templates (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null,
  locale      text not null check (locale in ('es', 'en')),
  title       text not null,
  description text,
  owner_id    uuid references auth.users (id) on delete cascade,
  is_public   boolean not null default false,
  use_count   integer not null default 0,
  unique (locale, slug)
);

create table public.template_items (
  id          uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.list_templates (id) on delete cascade,
  name        text not null,
  qty         numeric(10, 2),
  unit        text,
  category_id text references public.categories (id),
  sort_order  integer not null default 0
);

-- ─────────────────────────── Suscripciones ───────────────────────

create table public.subscriptions (
  user_id                 uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id      text unique,
  stripe_subscription_id  text unique,
  status                  text not null,
  current_period_end      timestamptz,
  updated_at              timestamptz not null default now()
);

create trigger subscriptions_set_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

-- ══════════════════════════ Row Level Security ═══════════════════

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

-- Funciones auxiliares SECURITY DEFINER: evitan la recursión de políticas
-- entre `lists` y `list_members`.

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

-- ¿Comparte alguna lista conmigo? Habilita ver su nombre en una lista
-- compartida. SECURITY DEFINER por lo mismo que las anteriores.
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

-- categories: catálogo de sistema, lectura pública (incluso sin sesión)
create policy categories_select_all on public.categories for select using (true);

-- products: catálogo de sistema, lectura pública
create policy products_select_all on public.products for select using (true);

-- profiles
create policy profiles_select_visible on public.profiles for select
  using (id = auth.uid() or public.shares_list_with(id));
create policy profiles_update_own on public.profiles for update using (id = auth.uid());

-- lists
-- El `owner_id = auth.uid()` no es redundante con `is_list_member`: en un
-- INSERT ... RETURNING, Postgres evalúa las políticas de SELECT sobre la fila
-- nueva antes de que el trigger `on_list_created` haya creado la membresía.
create policy lists_select on public.lists for select
  using (owner_id = auth.uid() or public.is_list_member(id));
create policy lists_insert on public.lists for insert
  with check (owner_id = auth.uid());
create policy lists_update on public.lists for update
  using (public.can_edit_list(id)) with check (public.can_edit_list(id));
create policy lists_delete on public.lists for delete
  using (owner_id = auth.uid());

-- list_items
create policy items_select on public.list_items for select
  using (public.is_list_member(list_id));
create policy items_insert on public.list_items for insert
  with check (public.can_edit_list(list_id));
create policy items_update on public.list_items for update
  using (public.can_edit_list(list_id)) with check (public.can_edit_list(list_id));
create policy items_delete on public.list_items for delete
  using (public.can_edit_list(list_id));

-- list_members: cualquier miembro ve el equipo; salir por voluntad propia o expulsar como propietario
create policy members_select on public.list_members for select
  using (public.is_list_member(list_id));
create policy members_delete on public.list_members for delete
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.lists l
      where l.id = list_id and l.owner_id = auth.uid()
    )
  );

-- list_invites: SIN política de SELECT. Sólo el propietario gestiona (incluye lectura de sus propias filas).
create policy invites_manage on public.list_invites for all
  using (exists (select 1 from public.lists l where l.id = list_id and l.owner_id = auth.uid()))
  with check (exists (select 1 from public.lists l where l.id = list_id and l.owner_id = auth.uid()));

-- user_product_history: privado del propio usuario
create policy history_own on public.user_product_history for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- list_templates: públicas visibles a todos; privadas sólo al propietario
create policy templates_select on public.list_templates for select
  using (is_public = true or owner_id = auth.uid());
create policy templates_write on public.list_templates for insert
  with check (owner_id = auth.uid());
create policy templates_update on public.list_templates for update
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy templates_delete on public.list_templates for delete
  using (owner_id = auth.uid());

-- template_items: sigue la visibilidad de la plantilla
create policy template_items_select on public.template_items for select
  using (
    exists (
      select 1 from public.list_templates t
      where t.id = template_id and (t.is_public = true or t.owner_id = auth.uid())
    )
  );
create policy template_items_write on public.template_items for all
  using (exists (select 1 from public.list_templates t where t.id = template_id and t.owner_id = auth.uid()))
  with check (exists (select 1 from public.list_templates t where t.id = template_id and t.owner_id = auth.uid()));

-- subscriptions: privado del propio usuario, sólo lectura (las escrituras las hace el webhook con service_role)
create policy subscriptions_select_own on public.subscriptions for select using (user_id = auth.uid());

-- ══════════════════════════ Canje de invitación ═══════════════════

create or replace function public.join_list_by_token(p_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v public.list_invites;
  already_member boolean;
begin
  if auth.uid() is null then
    raise exception 'auth_required' using errcode = '28000';
  end if;

  select * into v from public.list_invites where token = p_token for update;

  if not found
     or v.revoked_at is not null
     or (v.expires_at is not null and v.expires_at < now())
     or (v.max_uses is not null and v.uses >= v.max_uses)
  then
    raise exception 'invite_invalid' using errcode = 'P0002';
  end if;

  select exists (
    select 1 from public.list_members m where m.list_id = v.list_id and m.user_id = auth.uid()
  ) into already_member;

  if not already_member then
    insert into public.list_members (list_id, user_id, role) values (v.list_id, auth.uid(), v.role);
    update public.list_invites set uses = uses + 1 where token = p_token;
  end if;

  return v.list_id;
end;
$$;

revoke all on function public.join_list_by_token(text) from public;
grant execute on function public.join_list_by_token(text) to authenticated;

-- ══════════════════════════ Realtime ═══════════════════════════

alter publication supabase_realtime add table public.list_items;
alter publication supabase_realtime add table public.lists;
alter publication supabase_realtime add table public.list_members;

-- ══════════════════════════ Semilla: categorías ═══════════════════
-- Orden aproximado de recorrido típico de supermercado.

insert into public.categories (id, name_es, name_en, icon, sort_order) values
  ('produce',    'Fruta y verdura',       'Produce',           '🥦', 10),
  ('bakery',     'Panadería',             'Bakery',            '🍞', 20),
  ('dairy',      'Lácteos y huevos',      'Dairy & Eggs',      '🥛', 30),
  ('meat',       'Carnicería',            'Meat',              '🍖', 40),
  ('fish',       'Pescadería',            'Seafood',           '🐟', 50),
  ('deli',       'Embutidos y quesos',    'Deli',              '🧀', 60),
  ('frozen',     'Congelados',            'Frozen',            '🧊', 70),
  ('pantry',     'Despensa',              'Pantry',            '🥫', 80),
  ('drinks',     'Bebidas',               'Drinks',            '🥤', 90),
  ('snacks',     'Snacks y dulces',       'Snacks & Sweets',   '🍫', 100),
  ('breakfast',  'Desayuno y cereales',   'Breakfast & Cereal','🥣', 110),
  ('cleaning',   'Limpieza del hogar',    'Household Cleaning','🧽', 120),
  ('personal',   'Higiene personal',      'Personal Care',     '🧴', 130),
  ('baby',       'Bebé',                  'Baby',              '🍼', 140),
  ('pet',        'Mascotas',              'Pets',              '🐾', 150),
  ('other',      'Otros',                 'Other',             '🛒', 999)
on conflict (id) do nothing;

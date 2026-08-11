# Modelo de datos, RLS y sincronización

Este documento es la referencia para escribir `supabase/migrations/`. El SQL de aquí es la forma
prevista; puede ajustarse durante la implementación, pero **las decisiones de seguridad de la
sección 3 no son negociables**.

---

## 1. Diagrama

```
auth.users ──1:1── profiles
     │
     ├──1:N── lists ──1:N── list_items ──N:1── categories
     │           │
     │           ├──1:N── list_members ──N:1── auth.users
     │           └──1:N── list_invites
     │
     ├──1:N── user_product_history
     └──1:N── subscriptions

products (catálogo global, por locale) ──N:1── categories
list_templates ──1:N── template_items
```

---

## 2. Esquema

```sql
create extension if not exists pgcrypto;

-- ─────────────────────────── Perfiles ───────────────────────────
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url   text,
  locale       text not null default 'es' check (locale in ('es','en')),
  currency     char(3) not null default 'EUR',
  plan         text not null default 'free' check (plan in ('free','premium')),
  created_at   timestamptz not null default now()
);

-- Crea el perfil automáticamente al registrarse (incluidos los anónimos).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────── Categorías / pasillos ───────────────────
-- Semilla del sistema; ordenadas según el recorrido típico del supermercado.
create table public.categories (
  id         text primary key,          -- 'produce', 'dairy', 'bakery'…
  name_es    text not null,
  name_en    text not null,
  icon       text,
  sort_order int  not null
);

-- ───────────────────────────── Listas ────────────────────────────
create table public.lists (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  title       text not null default 'Mi lista',
  emoji       text,
  currency    char(3) not null default 'EUR',
  budget_cents integer,
  archived_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create type public.list_role as enum ('owner','editor','viewer');

create table public.list_members (
  list_id   uuid not null references public.lists(id) on delete cascade,
  user_id   uuid not null references auth.users(id) on delete cascade,
  role      public.list_role not null default 'editor',
  joined_at timestamptz not null default now(),
  primary key (list_id, user_id)
);
create index on public.list_members (user_id);

-- El propietario se añade como miembro automáticamente.
create or replace function public.handle_new_list()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.list_members (list_id, user_id, role)
  values (new.id, new.owner_id, 'owner');
  return new;
end $$;

create trigger on_list_created
  after insert on public.lists
  for each row execute function public.handle_new_list();

-- ────────────────────────── Invitaciones ─────────────────────────
-- Sin política SELECT: sólo se canjea vía RPC. Nunca se expone el token.
create table public.list_invites (
  token      text primary key,                        -- nanoid(22) ≈ 128 bits
  list_id    uuid not null references public.lists(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  role       public.list_role not null default 'editor',
  expires_at timestamptz,
  revoked_at timestamptz,
  max_uses   integer,
  uses       integer not null default 0,
  created_at timestamptz not null default now()
);
create index on public.list_invites (list_id);

-- ─────────────────────────── Productos ───────────────────────────
create table public.list_items (
  id          uuid primary key,          -- generado en el CLIENTE (offline-first)
  list_id     uuid not null references public.lists(id) on delete cascade,
  name        text not null check (length(name) between 1 and 200),
  qty         numeric(10,2),
  unit        text,
  note        text,
  category_id text references public.categories(id),
  price_cents integer,
  is_checked  boolean not null default false,
  checked_by  uuid references auth.users(id) on delete set null,
  checked_at  timestamptz,
  assigned_to uuid references auth.users(id) on delete set null,
  sort_key    text not null,             -- índice fraccionario ('a0', 'a0V', 'a1'…)
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz                -- borrado lógico: necesario para el merge offline
);
create index on public.list_items (list_id, sort_key) where deleted_at is null;
create index on public.list_items (list_id, updated_at);         -- sincronización delta

-- ──────────────── Catálogo y aprendizaje personal ────────────────
create table public.products (
  id          uuid primary key default gen_random_uuid(),
  locale      text not null check (locale in ('es','en')),
  name        text not null,
  normalized  text not null,                -- minúsculas y sin acentos, para buscar
  category_id text references public.categories(id),
  default_unit text,
  popularity  integer not null default 0,
  unique (locale, normalized)
);
create index on public.products using gin (normalized gin_trgm_ops);

create table public.user_product_history (
  user_id     uuid not null references auth.users(id) on delete cascade,
  normalized  text not null,
  name        text not null,
  category_id text references public.categories(id),
  times_added integer not null default 1,
  last_added  timestamptz not null default now(),
  avg_price_cents integer,
  primary key (user_id, normalized)
);

-- ──────────────────────────── Plantillas ─────────────────────────
-- Alimentan las páginas de SEO programático (ver 02-SEO.md).
create table public.list_templates (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null,
  locale      text not null check (locale in ('es','en')),
  title       text not null,
  description text,
  owner_id    uuid references auth.users(id) on delete cascade,  -- null = plantilla del sistema
  is_public   boolean not null default false,
  use_count   integer not null default 0,
  unique (locale, slug)
);

create table public.template_items (
  id          uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.list_templates(id) on delete cascade,
  name        text not null,
  qty         numeric(10,2),
  unit        text,
  category_id text references public.categories(id),
  sort_order  integer not null default 0
);

-- ─────────────────────────── Suscripciones ───────────────────────
create table public.subscriptions (
  user_id             uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id  text unique,
  stripe_subscription_id text unique,
  status              text not null,
  current_period_end  timestamptz,
  updated_at          timestamptz not null default now()
);
```

**`updated_at`**: un único trigger genérico `set_updated_at()` aplicado a `lists`, `list_items` y
`subscriptions`. El cliente **no** envía `updated_at`: lo pone el servidor, que es la única fuente
de verdad fiable para resolver conflictos.

---

## 3. Row Level Security

RLS activado en **todas** las tablas. Sin excepciones.

### 3.1 Función auxiliar (evita la recursión de políticas)

Si la política de `lists` consulta `list_members` y la de `list_members` consulta `lists`, Postgres
entra en recursión infinita. La solución es una función `SECURITY DEFINER` que salta RLS:

```sql
create or replace function public.is_list_member(p_list uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.list_members m
    where m.list_id = p_list and m.user_id = auth.uid()
  );
$$;

create or replace function public.can_edit_list(p_list uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.list_members m
    where m.list_id = p_list and m.user_id = auth.uid()
      and m.role in ('owner','editor')
  );
$$;
```

### 3.2 Políticas

```sql
alter table public.lists         enable row level security;
alter table public.list_items    enable row level security;
alter table public.list_members  enable row level security;
alter table public.list_invites  enable row level security;
alter table public.profiles      enable row level security;

-- lists
create policy lists_select on public.lists for select
  using (public.is_list_member(id));
create policy lists_insert on public.lists for insert
  with check (owner_id = auth.uid());
create policy lists_update on public.lists for update
  using (public.can_edit_list(id)) with check (public.can_edit_list(id));
create policy lists_delete on public.lists for delete
  using (owner_id = auth.uid());          -- sólo el propietario borra la lista

-- list_items
create policy items_select on public.list_items for select
  using (public.is_list_member(list_id));
create policy items_write on public.list_items for insert
  with check (public.can_edit_list(list_id));
create policy items_update on public.list_items for update
  using (public.can_edit_list(list_id)) with check (public.can_edit_list(list_id));
create policy items_delete on public.list_items for delete
  using (public.can_edit_list(list_id));

-- list_members: cualquier miembro ve el equipo; sólo el propietario lo modifica.
create policy members_select on public.list_members for select
  using (public.is_list_member(list_id));
create policy members_delete on public.list_members for delete
  using (
    user_id = auth.uid()                                     -- salir por voluntad propia
    or exists (select 1 from public.lists l
               where l.id = list_id and l.owner_id = auth.uid())  -- expulsar
  );

-- list_invites: el propietario las gestiona; NADIE puede leerlas.
create policy invites_manage on public.list_invites for all
  using (exists (select 1 from public.lists l
                 where l.id = list_id and l.owner_id = auth.uid()))
  with check (exists (select 1 from public.lists l
                      where l.id = list_id and l.owner_id = auth.uid()));

-- profiles
create policy profiles_select_own on public.profiles for select using (id = auth.uid());
create policy profiles_update_own on public.profiles for update using (id = auth.uid());
```

Nota sobre `invites_manage`: da al propietario `SELECT` sobre sus propias invitaciones (necesario
para mostrar y revocar enlaces). Ningún otro usuario puede leer la tabla, y el canje se hace por
RPC sin necesidad de `SELECT`.

### 3.3 Canje de invitación

```sql
create or replace function public.join_list_by_token(p_token text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v public.list_invites;
begin
  if auth.uid() is null then
    raise exception 'auth_required' using errcode = '28000';
  end if;

  select * into v from public.list_invites where token = p_token for update;

  if not found
     or v.revoked_at is not null
     or (v.expires_at is not null and v.expires_at < now())
     or (v.max_uses  is not null and v.uses >= v.max_uses)
  then
    raise exception 'invite_invalid' using errcode = 'P0002';
  end if;

  insert into public.list_members (list_id, user_id, role)
  values (v.list_id, auth.uid(), v.role)
  on conflict (list_id, user_id) do nothing;

  if found then
    update public.list_invites set uses = uses + 1 where token = p_token;
  end if;

  return v.list_id;
end $$;

revoke execute on function public.join_list_by_token(text) from public;
grant  execute on function public.join_list_by_token(text) to authenticated;
```

Un mismo mensaje de error para «no existe», «caducada» y «revocada»: no damos pistas a quien
pruebe tokens al azar.

### 3.4 Historial personal

`user_product_history` se escribe con `record_products(jsonb)`, que recibe la tanda entera de
productos recién añadidos y suma al contador en lugar de pisarlo
(`supabase/migrations/0003_product_history.sql`).

Es `security invoker` a propósito: la política `history_own` ya limita cada fila a su dueño y
`auth.uid()` es la única fuente del `user_id`, así que no hay nada que elevar. Dos detalles que
no son opcionales:

- **Agrupa antes de insertar.** `on conflict do update` no admite tocar la misma fila dos veces
  en una sentencia, y añadir «leche, leche» de una vez es normal.
- **Sin sesión, sale en silencio.** Se llama en segundo plano al añadir productos y no puede
  tumbar esa operación.

El precio se guarda aparte, con `record_product_price(text, text, integer)`, que lleva una media
exacta gracias a la columna `price_samples` y descarta lo que no puede ser un precio (negativo o
mayor de 10.000 € por línea). Por qué el precio sale del propio usuario y no del catálogo de una
cadena: `06-PRECIOS.md`.

Del lado del cliente no pasa por el outbox (`src/features/list/history.ts`): la operación es
«suma uno», no «escribe esta fila», y una cola que reintenta contaría de más. Si falla, se pierde
ese registro y ya está — la lista, que es lo que importa, sí va por el outbox.

---

## 4. Realtime

```sql
alter publication supabase_realtime add table public.list_items;
alter publication supabase_realtime add table public.lists;
alter publication supabase_realtime add table public.list_members;
```

En el cliente, canal **privado** por lista, autorizado por RLS:

```ts
supabase
  .channel(`list:${listId}`, { config: { private: true } })
  .on('postgres_changes',
      { event: '*', schema: 'public', table: 'list_items', filter: `list_id=eq.${listId}` },
      applyRemoteChange)
  .subscribe()
```

Reglas de higiene:

- Un solo canal por lista abierta; desuscribir al salir de la pantalla.
- Desconectar cuando la pestaña pasa a segundo plano (`visibilitychange`) y **resincronizar
  siempre por delta al volver** — no confiar en que no se ha perdido ningún evento.
- Presence en el mismo canal, con `user_id` y nombre; sin datos personales.

---

## 5. Sincronización offline

### 5.1 Outbox

```ts
type Operation = {
  id: string            // uuid de la operación (idempotencia)
  entity: 'item' | 'list'
  type: 'insert' | 'update' | 'delete'
  payload: Record<string, unknown>
  clientUpdatedAt: string
  retries: number
}
```

Reglas:

1. **Los IDs se generan en el cliente**. Una operación reenviada tras un fallo de red no duplica
   nada porque se resuelve como `upsert` sobre la misma clave primaria.
2. Las operaciones se **compactan** antes de enviarse: cinco toques sobre el mismo producto se
   colapsan en una sola actualización. Esto importa: la conexión del súper es intermitente y
   costosa.
3. Reintentos con *backoff* exponencial (1 s → 30 s) y disparo inmediato en el evento `online`.
4. El *outbox* se persiste en IndexedDB: cerrar la pestaña no pierde nada.

### 5.2 Resolución de conflictos

- **Last-write-wins por fila** comparando `updated_at`. Si la operación local es más antigua que
  la versión del servidor, gana el servidor.
- Excepción intencionada: **marcar/desmarcar siempre se aplica**, aunque el reloj vaya al revés.
  Si alguien acaba de coger la leche, ese hecho es cierto; perder ese cambio es peor que perder un
  cambio de nombre.
- **Borrado lógico** (`deleted_at`): sin él, un cliente offline con caché antigua reinserta lo que
  otro había borrado.
- Sincronización delta al reconectar:
  `select * from list_items where list_id = ? and updated_at > lastSyncAt` (incluidos los
  borrados lógicos).

### 5.3 Ordenación: índice fraccionario

`sort_key` es texto, no entero. Insertar entre `a0` y `a1` genera `a0V`, sin renumerar el resto de
filas. Es lo que permite arrastrar y soltar con varias personas editando a la vez sin que se pisen.

---

## 6. Mantenimiento

```sql
-- Purga de invitados abandonados (pg_cron, diario).
-- Sólo usuarios anónimos, con más de 30 días y sin ninguna lista con productos.
select cron.schedule('purge-anonymous-users', '0 4 * * *', $$
  delete from auth.users u
  where u.is_anonymous
    and u.created_at < now() - interval '30 days'
    and not exists (
      select 1 from public.list_members m
      join public.list_items i on i.list_id = m.list_id and i.deleted_at is null
      where m.user_id = u.id
    );
$$);

-- Purga de productos borrados lógicamente, pasada la ventana de sincronización.
select cron.schedule('purge-deleted-items', '30 4 * * *', $$
  delete from public.list_items where deleted_at < now() - interval '30 days';
$$);
```

Antes de activar la primera tarea en producción, ejecutarla como `SELECT` para comprobar a cuántas
filas afecta. El borrado en `auth.users` es en cascada e irreversible.

---

## 7. Rendimiento

- Los índices declarados arriba cubren los tres accesos calientes: productos de una lista,
  sincronización delta y listas de un usuario.
- Búsqueda del catálogo con `pg_trgm` sobre `normalized`; si se queda corta, pasar a
  `tsvector` con diccionario por idioma.
- El *shell* de la lista se sirve estático; los datos llegan por el cliente ya autenticado.
- Objetivo: p95 de lectura de una lista < 150 ms desde la UE.

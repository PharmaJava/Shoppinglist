-- ══════════════════════════════════════════════════════════════════
-- 0013 · Códigos de barras (F3-7)
--
-- Escanear un código no dice qué es: dice un número. Traducirlo a un nombre
-- se intenta primero contra Open Food Facts (base abierta, ver
-- docs/15-CODIGOS.md), pero la marca blanca del súper de al lado no siempre
-- está ahí. Esta tabla es la memoria de cada persona: lo que le enseñas una
-- vez, lo sabe para siempre.
--
-- Por qué es de cada uno y no una tabla compartida: si cualquiera pudiera
-- escribir el nombre de un código para todos, bastaría una tarde para llenar
-- la base de tonterías, y moderarlo sería un trabajo que aquí no hay quien
-- haga. Cada cual enseña lo suyo.
-- ══════════════════════════════════════════════════════════════════

create table if not exists public.user_barcodes (
  user_id     uuid not null references auth.users (id) on delete cascade,
  -- EAN-8, UPC-A, EAN-13 y GTIN-14: entre 8 y 14 dígitos. Se guarda como
  -- texto y no como número: los ceros de la izquierda son parte del código.
  code        text not null check (code ~ '^[0-9]{8,14}$'),
  name        text not null check (length(btrim(name)) between 1 and 200),
  category_id text references public.categories (id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  -- Un código, un nombre, por persona. Escanear otra vez lo que ya enseñaste
  -- corrige el nombre en vez de crear una segunda fila.
  primary key (user_id, code)
);

drop trigger if exists user_barcodes_set_updated_at on public.user_barcodes;
create trigger user_barcodes_set_updated_at
before update on public.user_barcodes
for each row execute function public.set_updated_at();

-- ────────────────────────────── RLS ────────────────────────────────

alter table public.user_barcodes enable row level security;

-- Mismo reparto que la despensa (0011) y las listas automáticas (0012):
-- leer siempre, escribir sólo premium, borrar siempre. Quien deja de pagar
-- conserva lo que enseñó y puede limpiarlo; lo que no puede es enseñar más.
drop policy if exists barcodes_select_own on public.user_barcodes;
create policy barcodes_select_own on public.user_barcodes for select
  using (user_id = auth.uid());

drop policy if exists barcodes_insert_own on public.user_barcodes;
create policy barcodes_insert_own on public.user_barcodes for insert
  with check (user_id = auth.uid() and public.is_premium());

drop policy if exists barcodes_update_own on public.user_barcodes;
create policy barcodes_update_own on public.user_barcodes for update
  using (user_id = auth.uid() and public.is_premium())
  with check (user_id = auth.uid() and public.is_premium());

drop policy if exists barcodes_delete_own on public.user_barcodes;
create policy barcodes_delete_own on public.user_barcodes for delete
  using (user_id = auth.uid());

insert into public.schema_migrations (version) values ('0013_barcodes')
on conflict (version) do nothing;

-- ══════════════════════════════════════════════════════════════════
-- 0011 · La despensa (F3-5)
--
-- Qué hay en casa y cuándo caduca. Es de pago, y cuelga del control de plan
-- que puso la 0010.
--
-- Una decisión que conviene entender antes de leer las políticas: **leer la
-- despensa no exige ser premium; escribirla sí**. Si alguien deja de pagar,
-- lo que ya tiene guardado sigue siendo suyo y lo sigue viendo — no puede
-- añadir más. Bloquearle la lectura sería secuestrarle sus propios datos por
-- dejar de pagar, y eso no se hace.
-- ══════════════════════════════════════════════════════════════════

create table if not exists public.pantry_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null check (length(btrim(name)) between 1 and 200),
  -- Igual que en `user_product_history`: sirve para reconocer «Leche entera» y
  -- «leche  ENTERA» como lo mismo al añadir algo que ya está.
  normalized  text not null,
  qty         numeric(10, 2),
  unit        text,
  category_id text references public.categories (id),
  -- Sin hora: una fecha de caducidad es un día, y guardar un `timestamptz`
  -- convertiría «caduca el 3» en «caducó ayer» para quien viaje de zona.
  expires_on  date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Una despensa se ordena por lo que caduca antes; lo que no caduca, al final.
create index if not exists pantry_items_user_expiry_idx
  on public.pantry_items (user_id, expires_on nulls last, name);

/*
 * **Único**, y no un índice a secas. Toda la lógica de «si ya está, suma la
 * cantidad en vez de crear otra línea» se apoya en que no puede haber dos
 * filas del mismo producto. Sin esta restricción bastaba un `insert` desde el
 * cliente para dejar la despensa con dos «leche», y a partir de ahí el
 * `update` de sumar cantidades las tocaba las dos.
 */
create unique index if not exists pantry_items_user_normalized_idx
  on public.pantry_items (user_id, normalized);

drop trigger if exists pantry_items_set_updated_at on public.pantry_items;
create trigger pantry_items_set_updated_at
before update on public.pantry_items
for each row execute function public.set_updated_at();

-- ────────────────────────────── RLS ────────────────────────────────

alter table public.pantry_items enable row level security;

-- Leer: lo tuyo, pagues o no. Ver arriba.
drop policy if exists pantry_select_own on public.pantry_items;
create policy pantry_select_own on public.pantry_items for select
  using (user_id = auth.uid());

-- Escribir: lo tuyo y siendo premium. `is_premium()` es SECURITY DEFINER
-- (migración 0010) justamente para poder llamarse desde aquí sin recursión.
drop policy if exists pantry_insert_own on public.pantry_items;
create policy pantry_insert_own on public.pantry_items for insert
  with check (user_id = auth.uid() and public.is_premium());

drop policy if exists pantry_update_own on public.pantry_items;
create policy pantry_update_own on public.pantry_items for update
  using (user_id = auth.uid() and public.is_premium())
  with check (user_id = auth.uid() and public.is_premium());

-- Borrar sí se deja siempre: quien ya no paga tiene que poder limpiar o
-- vaciar lo suyo. Impedirlo sería dejarle datos que no puede quitar.
drop policy if exists pantry_delete_own on public.pantry_items;
create policy pantry_delete_own on public.pantry_items for delete
  using (user_id = auth.uid());

-- ───────────────── Meter la compra en la despensa ──────────────────

/*
 * Al terminar una compra, lo marcado puede pasar a la despensa de una vez.
 * Va en una función y no en un `insert` desde el cliente por dos motivos:
 * son N filas en un viaje, y aquí se puede resolver lo que ya está —sumar
 * cantidades en vez de duplicar la línea— sin traerse la despensa entera al
 * navegador para compararla.
 *
 * SECURITY INVOKER: quien la llama tiene que poder leer la lista por sus
 * propias políticas, y las escrituras pasan por las de arriba, premium
 * incluido. La comprobación explícita está para dar un error que se entienda.
 */
create or replace function public.stock_up_from_list(p_list uuid)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_yo      uuid := auth.uid();
  v_metidos integer := 0;
begin
  if v_yo is null then
    raise exception 'Hay que tener sesión.';
  end if;
  perform public.require_premium();
  if not public.is_list_member(p_list) then
    raise exception 'Esa lista no es tuya.';
  end if;

  with comprados as (
    select
      -- Se agrupa **sólo** por el normalizado. Agrupar también por el nombre
      -- anularía el normalizado: «Leche» y «  leche » son grupos distintos si
      -- el nombre entra en el GROUP BY, y acabarían siendo dos líneas.
      lower(btrim(i.name)) as normalized,
      min(btrim(i.name)) as name,
      sum(coalesce(i.qty, 1)) as qty,
      min(i.unit) as unit,
      min(i.category_id) as category_id
    from public.list_items i
    where i.list_id = p_list and i.deleted_at is null and i.is_checked
    group by 1
  )
  insert into public.pantry_items (user_id, name, normalized, qty, unit, category_id)
  select v_yo, c.name, c.normalized, c.qty, c.unit, c.category_id
  from comprados c
  -- Lo que ya estaba suma; lo que no, se crea. En una sola sentencia y sin
  -- traerse la despensa al navegador para compararla.
  on conflict (user_id, normalized) do update
    set qty = coalesce(public.pantry_items.qty, 0) + excluded.qty,
        -- La unidad y la categoría sólo se rellenan si faltaban: lo que ya
        -- había corregido a mano manda sobre lo que traiga la compra.
        unit = coalesce(public.pantry_items.unit, excluded.unit),
        category_id = coalesce(public.pantry_items.category_id, excluded.category_id);

  get diagnostics v_metidos = row_count;

  return v_metidos;
end;
$$;

revoke all on function public.stock_up_from_list(uuid) from public;
grant execute on function public.stock_up_from_list(uuid) to authenticated;

insert into public.schema_migrations (version) values ('0011_pantry')
on conflict (version) do nothing;

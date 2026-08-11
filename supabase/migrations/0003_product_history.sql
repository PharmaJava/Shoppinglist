-- ══════════════════════════════════════════════════════════════════
-- 0003 · Historial personal de productos
--
-- `user_product_history` existe desde el esquema base pero nadie escribía
-- en ella. Esta migración añade lo que faltaba para poder usarla:
--
--   · un índice para pedir «lo que más compro» sin recorrer la tabla,
--   · una función que registra varios productos de una vez, sumando al
--     contador en lugar de pisarlo.
--
-- La función es SECURITY INVOKER a propósito: la política `history_own`
-- ya limita cada fila a su dueño, así que no hace falta elevar privilegios
-- ni comprobar nada a mano. `auth.uid()` es la única fuente del user_id —
-- el cliente no puede escribir en el historial de otro aunque lo intente.
-- ══════════════════════════════════════════════════════════════════

-- «Lo de siempre»: los más repetidos primero, y a igualdad de repeticiones
-- los más recientes. El índice cubre exactamente ese orden.
create index if not exists user_product_history_top_idx
  on public.user_product_history (user_id, times_added desc, last_added desc);

create or replace function public.record_products(p_items jsonb)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  -- Sin sesión no hay a quién atribuirlo. Se sale en silencio en vez de
  -- fallar: esto se llama en segundo plano al añadir productos y no debe
  -- poder tumbar esa operación.
  if auth.uid() is null then
    return;
  end if;

  -- El agrupado no es cosmético: `on conflict do update` no admite tocar la
  -- misma fila dos veces en la misma sentencia, y añadir "leche, leche" en
  -- una sola tanda es perfectamente normal. Se cuentan antes y se suma una
  -- vez.
  with entradas as (
    select
      nullif(trim(lower(item ->> 'normalized')), '') as normalized,
      nullif(trim(item ->> 'name'), '')              as name,
      nullif(item ->> 'category_id', '')             as category_id
    from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) as item
  ),
  agrupadas as (
    select
      normalized,
      min(name)        as name,
      min(category_id) as category_id,
      count(*)::integer as veces
    from entradas
    where normalized is not null and name is not null
    group by normalized
  )
  insert into public.user_product_history as h
    (user_id, normalized, name, category_id, times_added, last_added)
  select auth.uid(), normalized, name, category_id, veces, now()
  from agrupadas
  on conflict (user_id, normalized) do update
    set times_added = h.times_added + excluded.times_added,
        -- Se queda con la última forma escrita: si alguien pasó de "leche"
        -- a "Leche entera", la sugerencia debe ser la nueva.
        name        = excluded.name,
        category_id = coalesce(excluded.category_id, h.category_id),
        last_added  = now();
end;
$$;

revoke all on function public.record_products(jsonb) from public;
grant execute on function public.record_products(jsonb) to authenticated;

insert into public.schema_migrations (version) values ('0003_product_history')
on conflict (version) do nothing;

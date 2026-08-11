-- ══════════════════════════════════════════════════════════════════
-- 0004 · Precio recordado por producto
--
-- `avg_price_cents` existe desde el esquema base y nadie lo escribía. Esta
-- migración lo pone en uso: cada vez que alguien pone precio a un producto,
-- se guarda en su historial y sirve para no tener que volver a teclearlo.
--
-- Es la alternativa a integrar el catálogo de un supermercado concreto (ver
-- docs/06-PRECIOS.md): el precio que de verdad le sirve a alguien es el que
-- paga en su tienda, no el de una tarifa nacional.
-- ══════════════════════════════════════════════════════════════════

-- Sin el número de muestras, la media no se puede actualizar sin recalcularla
-- entera, y no guardamos el histórico de precios: sólo el agregado.
alter table public.user_product_history
  add column if not exists price_samples integer not null default 0;

create or replace function public.record_product_price(
  p_normalized text,
  p_name text,
  p_price_cents integer
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_normalized text := nullif(trim(lower(p_normalized)), '');
begin
  if auth.uid() is null or v_normalized is null then
    return;
  end if;

  -- Un precio negativo o absurdo es un error de tecleo, no un dato. El techo
  -- son 10.000 € por línea: por encima, alguien ha metido el código de barras
  -- en el campo del precio.
  if p_price_cents is null or p_price_cents < 0 or p_price_cents > 1000000 then
    return;
  end if;

  insert into public.user_product_history as h
    (user_id, normalized, name, times_added, last_added, avg_price_cents, price_samples)
  values (auth.uid(), v_normalized, coalesce(nullif(trim(p_name), ''), v_normalized),
          1, now(), p_price_cents, 1)
  on conflict (user_id, normalized) do update
    -- Media exacta, no exponencial: con dos o tres compras al mes durante
    -- meses, una media ponderada hacia lo reciente oscilaría con cada oferta.
    -- Lo que se busca aquí es «cuánto suele costarme», no el precio de hoy.
    set avg_price_cents = (
          (coalesce(h.avg_price_cents, 0) * h.price_samples) + excluded.avg_price_cents
        ) / (h.price_samples + 1),
        price_samples = h.price_samples + 1;
end;
$$;

revoke all on function public.record_product_price(text, text, integer) from public;
grant execute on function public.record_product_price(text, text, integer) to authenticated;

insert into public.schema_migrations (version) values ('0004_remembered_prices')
on conflict (version) do nothing;

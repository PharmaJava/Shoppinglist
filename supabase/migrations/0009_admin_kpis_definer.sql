-- ══════════════════════════════════════════════════════════════════
-- 0009 · admin_kpis pasa a SECURITY DEFINER
--
-- Arregla un fallo de la 0007: el panel respondía
--
--     permission denied for table users
--
-- La función se definió como SECURITY INVOKER a propósito, para que un GRANT
-- de más en el futuro no la convirtiera en una fuga. Lo que no era cierto es
-- la premisa: **`service_role` no puede leer `auth.users`**. Esa tabla es de
-- `supabase_auth_admin`, y la clave de servicio llega a los usuarios por la
-- Admin API, no por SQL. Siendo INVOKER, la función se ejecuta con los
-- permisos de quien llama y ahí se queda.
--
-- Se comprobó en local contra un PostgreSQL 16 y pasó porque el stub le había
-- concedido ese permiso a `service_role` «para parecerse a Supabase». Se
-- parecía a Supabase en todo menos en lo que importaba.
--
-- Así que pasa a DEFINER —se crea desde el editor SQL, o sea como `postgres`,
-- que sí puede leer `auth.users`— y la defensa que se pierde se repone a mano:
-- la función comprueba el rol del JWT y se niega a responder a cualquiera que
-- no sea `service_role`. Con eso, un `grant execute` accidental a
-- `authenticated` sigue sin abrir nada.
--
-- Sigue sin devolver datos personales: sólo agregados.
-- ══════════════════════════════════════════════════════════════════

create or replace function public.admin_kpis(p_dias integer default 30)
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  -- Entre una semana y un año: por debajo no hay serie que dibujar y por
  -- encima la consulta deja de ser instantánea sin aportar nada.
  v_dias      integer := greatest(7, least(coalesce(p_dias, 30), 365));
  -- Quién llama, leído del JWT. Sin JWT —editor SQL de Supabase, psql— sale
  -- null, y ahí ya se es `postgres`: no hay nada que comprobar.
  v_rol       text := coalesce(
                nullif(current_setting('request.jwt.claim.role', true), ''),
                nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'
              );
  v_hoy       timestamptz := date_trunc('day', now());
  v_usuarios  jsonb;
  v_listas    jsonb;
  v_productos jsonb;
  v_colab     jsonb;
  v_invites   jsonb;
  v_norte     jsonb;
  v_dinero    jsonb;
  v_perfiles  jsonb;
  v_push      jsonb;
  v_catalogo  jsonb;
  v_series    jsonb;
  v_tops      jsonb;
begin
  -- La red de seguridad que se pierde al pasar a SECURITY DEFINER, puesta a
  -- mano: si alguien concediera EXECUTE a `authenticated` por descuido —un
  -- `grant execute on all functions in schema public` basta— esto lo para.
  if v_rol is not null and v_rol <> 'service_role' then
    raise exception 'admin_kpis sólo la puede llamar el servidor.';
  end if;

  -- ── Usuarios ────────────────────────────────────────────────────
  -- El invitado es un usuario real de `auth.users` sin correo (ver
  -- 00-PLAN.md §2.2). Distinguirlos es la métrica de conversión.
  select jsonb_build_object(
    'total',             count(*),
    'registrados',       count(*) filter (where email is not null),
    'anonimos',          count(*) filter (where email is null),
    'nuevos_hoy',        count(*) filter (where created_at >= v_hoy),
    'nuevos_7d',         count(*) filter (where created_at >= now() - interval '7 days'),
    'nuevos_30d',        count(*) filter (where created_at >= now() - interval '30 days'),
    'nuevos_7d_previos', count(*) filter (
                           where created_at >= now() - interval '14 days'
                             and created_at <  now() - interval '7 days'
                         )
  )
  into v_usuarios
  from auth.users;

  -- ── Listas ──────────────────────────────────────────────────────
  select jsonb_build_object(
    'total',             count(*),
    'activas',           count(*) filter (where archived_at is null),
    'archivadas',        count(*) filter (where archived_at is not null),
    'nuevas_hoy',        count(*) filter (where created_at >= v_hoy),
    'nuevas_7d',         count(*) filter (where created_at >= now() - interval '7 days'),
    'nuevas_30d',        count(*) filter (where created_at >= now() - interval '30 days'),
    'nuevas_7d_previos', count(*) filter (
                           where created_at >= now() - interval '14 days'
                             and created_at <  now() - interval '7 days'
                         ),
    'tocadas_24h',       count(*) filter (where updated_at >= now() - interval '24 hours'),
    'tocadas_7d',        count(*) filter (where updated_at >= now() - interval '7 days')
  )
  into v_listas
  from public.lists;

  -- ── Productos ───────────────────────────────────────────────────
  select jsonb_build_object(
    'total',          count(*) filter (where deleted_at is null),
    'borrados',       count(*) filter (where deleted_at is not null),
    'marcados',       count(*) filter (where deleted_at is null and is_checked),
    'con_precio',     count(*) filter (where deleted_at is null and price_cents is not null),
    'con_cantidad',   count(*) filter (where deleted_at is null and qty is not null),
    'sin_categoria',  count(*) filter (where deleted_at is null and category_id is null),
    'nuevos_hoy',     count(*) filter (where created_at >= v_hoy),
    'nuevos_7d',      count(*) filter (where created_at >= now() - interval '7 days'),
    'nuevos_30d',     count(*) filter (where created_at >= now() - interval '30 days')
  )
  into v_productos
  from public.list_items;

  -- ── Colaboración ────────────────────────────────────────────────
  -- La apuesta del producto es que la lista se comparta; esto es lo que dice
  -- si está pasando.
  with por_lista as (
    select list_id, count(*) as miembros
    from public.list_members
    group by list_id
  )
  select jsonb_build_object(
    'listas_compartidas', count(*) filter (where miembros >= 2),
    'listas_con_miembros', count(*),
    'media_miembros',     round(coalesce(avg(miembros), 0)::numeric, 2),
    'max_miembros',       coalesce(max(miembros), 0),
    'reparto', jsonb_build_object(
      'una',       count(*) filter (where miembros = 1),
      'dos',       count(*) filter (where miembros = 2),
      'tres',      count(*) filter (where miembros = 3),
      'cuatro_mas',count(*) filter (where miembros >= 4)
    )
  )
  into v_colab
  from por_lista;

  -- ── Invitaciones ────────────────────────────────────────────────
  select jsonb_build_object(
    'total',      count(*),
    'usadas',     count(*) filter (where uses > 0),
    'revocadas',  count(*) filter (where revoked_at is not null),
    'caducadas',  count(*) filter (where expires_at is not null and expires_at < now()),
    'canjes',     coalesce(sum(uses), 0),
    'tasa_uso',   case when count(*) = 0 then 0
                       else round(100.0 * count(*) filter (where uses > 0) / count(*), 1) end
  )
  into v_invites
  from public.list_invites;

  -- ── Las métricas del plan (00-PLAN.md §1) ───────────────────────
  --
  -- «Última actividad» de una persona es lo más reciente de: haber tocado una
  -- lista suya, haber añadido un producto o haberse unido a una lista. Con
  -- eso salen los activos diarios/semanales/mensuales y la retención.
  with actividad as (
    select owner_id as user_id, max(updated_at) as visto from public.lists group by 1
    union all
    select created_by, max(updated_at) from public.list_items
      where created_by is not null group by 1
    union all
    select checked_by, max(checked_at) from public.list_items
      where checked_by is not null and checked_at is not null group by 1
    union all
    select user_id, max(joined_at) from public.list_members group by 1
  ),
  ultima as (
    select user_id, max(visto) as visto from actividad group by 1
  ),
  activados as (
    -- Activación: una lista con al menos tres productos. Menos de tres es
    -- alguien probando, no alguien usándolo.
    select distinct l.owner_id
    from public.lists l
    join public.list_items i on i.list_id = l.id and i.deleted_at is null
    group by l.id, l.owner_id
    having count(i.id) >= 3
  ),
  cohorte as (
    select u.id, u.created_at
    from auth.users u
    where u.created_at <= now() - interval '7 days'
  )
  select jsonb_build_object(
    'activados',   (select count(*) from activados),
    'activacion',  case when (select count(*) from auth.users) = 0 then 0
                        else round(100.0 * (select count(*) from activados)
                                   / (select count(*) from auth.users), 1) end,
    -- K: cuánta gente entra por lista creada. Por encima de 1 el producto
    -- crece solo.
    'viralidad_k', case when (select count(*) from public.lists) = 0 then 0
                        else round((select count(*) from public.list_members where role <> 'owner')::numeric
                                   / (select count(*) from public.lists), 2) end,
    'colaboracion',case when (select count(*) from public.lists) = 0 then 0
                        else round(100.0 * (select count(*) from (
                               select list_id from public.list_members
                               group by list_id having count(*) >= 2) c)
                                   / (select count(*) from public.lists), 1) end,
    'retencion_d7',case when (select count(*) from cohorte) = 0 then 0
                        else round(100.0 * (
                               select count(*) from cohorte c
                               join ultima f on f.user_id = c.id
                               where f.visto >= c.created_at + interval '7 days')
                                   / (select count(*) from cohorte), 1) end,
    'activos_24h', (select count(*) from ultima where visto >= now() - interval '24 hours'),
    'activos_7d',  (select count(*) from ultima where visto >= now() - interval '7 days'),
    'activos_30d', (select count(*) from ultima where visto >= now() - interval '30 days'),
    -- Cuántos de los mensuales aparecen cada día. Por debajo del 10 % la app
    -- se usa una vez y se olvida.
    'adherencia',  case when (select count(*) from ultima where visto >= now() - interval '30 days') = 0 then 0
                        else round(100.0 * (select count(*) from ultima where visto >= now() - interval '24 hours')
                                   / (select count(*) from ultima where visto >= now() - interval '30 days'), 1) end
  )
  into v_norte;

  -- ── Dinero: presupuesto y precios ───────────────────────────────
  select jsonb_build_object(
    'listas_con_presupuesto', (select count(*) from public.lists where budget_cents is not null),
    'presupuesto_medio',      (select round(coalesce(avg(budget_cents), 0)) from public.lists
                                where budget_cents is not null),
    'valor_cestas_cents',     (select coalesce(sum(price_cents * coalesce(qty, 1)), 0)::bigint
                                from public.list_items where deleted_at is null),
    'precio_medio_producto',  (select round(coalesce(avg(price_cents), 0)) from public.list_items
                                where deleted_at is null and price_cents is not null),
    'precios_recordados',     (select count(*) from public.user_product_history
                                where avg_price_cents is not null)
  )
  into v_dinero;

  -- ── Perfiles: idioma, moneda, plan ──────────────────────────────
  select jsonb_build_object(
    'total',    count(*),
    'es',       count(*) filter (where locale = 'es'),
    'en',       count(*) filter (where locale = 'en'),
    'con_nombre', count(*) filter (where display_name is not null and display_name <> ''),
    'free',     count(*) filter (where plan = 'free'),
    'premium',  count(*) filter (where plan = 'premium')
  )
  into v_perfiles
  from public.profiles;

  -- ── Avisos push ─────────────────────────────────────────────────
  select jsonb_build_object(
    'suscripciones', count(*),
    'usuarios',      count(distinct user_id),
    'es',            count(*) filter (where locale = 'es'),
    'en',            count(*) filter (where locale = 'en')
  )
  into v_push
  from public.push_subscriptions;

  -- ── Catálogo e historial ────────────────────────────────────────
  select jsonb_build_object(
    'productos_catalogo', (select count(*) from public.products),
    'categorias',         (select count(*) from public.categories),
    'historial_filas',    (select count(*) from public.user_product_history),
    'usuarios_con_historial', (select count(distinct user_id) from public.user_product_history)
  )
  into v_catalogo;

  -- ── Series diarias ──────────────────────────────────────────────
  with dias as (
    select generate_series(v_hoy - make_interval(days => v_dias - 1), v_hoy, interval '1 day') as dia
  )
  select jsonb_agg(
    jsonb_build_object(
      'dia',      to_char(d.dia, 'YYYY-MM-DD'),
      'usuarios', (select count(*) from auth.users u
                    where u.created_at >= d.dia and u.created_at < d.dia + interval '1 day'),
      'listas',   (select count(*) from public.lists l
                    where l.created_at >= d.dia and l.created_at < d.dia + interval '1 day'),
      'productos',(select count(*) from public.list_items i
                    where i.created_at >= d.dia and i.created_at < d.dia + interval '1 day'),
      'activos',  (select count(distinct x.user_id) from (
                     select owner_id as user_id, updated_at as visto from public.lists
                     union all
                     select created_by, updated_at from public.list_items where created_by is not null
                   ) x
                   where x.visto >= d.dia and x.visto < d.dia + interval '1 day')
    )
    order by d.dia
  )
  into v_series
  from dias d;

  -- ── Rankings ────────────────────────────────────────────────────
  select jsonb_build_object(
    'productos', coalesce((
      select jsonb_agg(t) from (
        select lower(btrim(name)) as nombre, count(*) as veces
        from public.list_items
        where deleted_at is null
        group by 1
        order by veces desc, nombre
        limit 20
      ) t
    ), '[]'::jsonb),
    'categorias', coalesce((
      select jsonb_agg(t) from (
        select coalesce(c.name_es, 'Sin categoría') as nombre, count(*) as veces
        from public.list_items i
        left join public.categories c on c.id = i.category_id
        where i.deleted_at is null
        group by 1
        order by veces desc, nombre
        limit 15
      ) t
    ), '[]'::jsonb),
    -- Cuántos productos tiene una lista típica. La barra de «vacías» es la
    -- que importa: es gente que llegó, creó la lista y se fue.
    'tamano_listas', (
      select jsonb_build_object(
        'vacias',    count(*) filter (where n = 0),
        'de_1_a_4',  count(*) filter (where n between 1 and 4),
        'de_5_a_14', count(*) filter (where n between 5 and 14),
        'de_15_a_29',count(*) filter (where n between 15 and 29),
        'de_30_mas', count(*) filter (where n >= 30),
        'media',     round(coalesce(avg(n), 0)::numeric, 1),
        'mediana',   coalesce(percentile_cont(0.5) within group (order by n), 0)
      )
      from (
        select l.id, count(i.id) filter (where i.deleted_at is null) as n
        from public.lists l
        left join public.list_items i on i.list_id = l.id
        group by l.id
      ) tam
    )
  )
  into v_tops;

  return jsonb_build_object(
    'generado_en', to_char(now() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
    'dias',        v_dias,
    'usuarios',    v_usuarios,
    'listas',      v_listas,
    'productos',   v_productos,
    'colaboracion',v_colab,
    'invitaciones',v_invites,
    'norte',       v_norte,
    'dinero',      v_dinero,
    'perfiles',    v_perfiles,
    'push',        v_push,
    'catalogo',    v_catalogo,
    'series',      coalesce(v_series, '[]'::jsonb),
    'tops',        v_tops
  );
end;
$$;

-- Sólo el servidor. `authenticated` incluye a cualquier invitado anónimo del
-- producto: si pudiera llamarla, cualquiera con la consola abierta tendría
-- las métricas del negocio entero.

-- Los mismos permisos que en la 0007: sólo el servidor.
revoke all on function public.admin_kpis(integer) from public;
revoke all on function public.admin_kpis(integer) from anon;
revoke all on function public.admin_kpis(integer) from authenticated;
grant execute on function public.admin_kpis(integer) to service_role;

insert into public.schema_migrations (version) values ('0009_admin_kpis_definer')
on conflict (version) do nothing;

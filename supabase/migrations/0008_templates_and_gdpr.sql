-- ══════════════════════════════════════════════════════════════════
-- 0008 · Plantillas propias y moneda del perfil
--
-- Cierra la Fase 2: F2-4 (plantillas propias) y F2-8 (perfil y RGPD).
--
-- Las tablas `list_templates` y `template_items` existen desde el esquema
-- base con sus políticas RLS, pero nadie las usaba: sólo había plantillas de
-- contenido (las de SEO, que viven en `src/content` y no en la base de
-- datos). Aquí entran en servicio.
-- ══════════════════════════════════════════════════════════════════

-- ─────────────────── Plantillas: arreglar el modelo ────────────────

/*
 * El `slug` venía siendo obligatorio y único por idioma. Eso vale para una
 * plantilla pública, que tiene URL; para las de una persona no: dos usuarios
 * que guarden su «Compra semanal» chocarían entre ellos, y el segundo vería
 * un error de clave duplicada sin entender por qué.
 *
 * Así que el slug pasa a ser opcional, y único sólo donde significa algo.
 */
alter table public.list_templates alter column slug drop not null;
alter table public.list_templates drop constraint if exists list_templates_locale_slug_key;

create unique index if not exists list_templates_public_slug_idx
  on public.list_templates (locale, slug)
  where is_public and slug is not null;

-- Sin fecha no hay forma de ordenar «mis plantillas» por las más recientes.
alter table public.list_templates
  add column if not exists created_at timestamptz not null default now();
alter table public.list_templates
  add column if not exists updated_at timestamptz not null default now();

create index if not exists list_templates_owner_idx
  on public.list_templates (owner_id, created_at desc)
  where owner_id is not null;

drop trigger if exists list_templates_set_updated_at on public.list_templates;
create trigger list_templates_set_updated_at
before update on public.list_templates
for each row execute function public.set_updated_at();

-- ────────────────── La moneda del perfil, en uso ───────────────────

/*
 * `profiles.currency` existía y no lo leía nadie: las listas nacían siempre
 * en euros. Una preferencia que no cambia nada es peor que no tenerla.
 *
 * Se resuelve en la base de datos y no en el cliente porque una lista se crea
 * desde cuatro sitios distintos (landing, plantilla de contenido, plantilla
 * propia, duplicar) y bastaría olvidarse en uno para que la preferencia
 * pareciera rota. Sólo actúa cuando no se ha pedido una moneda concreta.
 */
create or replace function public.apply_default_currency()
returns trigger
language plpgsql
-- INVOKER y no DEFINER: la política `lists_insert` ya exige
-- `owner_id = auth.uid()`, así que el único perfil que este disparador puede
-- llegar a leer es el de quien está creando la lista. Con DEFINER podría leer
-- el de cualquiera, y no hace ninguna falta.
security invoker
set search_path = public
as $$
begin
  if new.currency is null or new.currency = 'EUR' then
    select p.currency into new.currency
    from public.profiles p
    where p.id = new.owner_id;

    new.currency := coalesce(new.currency, 'EUR');
  end if;
  return new;
end;
$$;

drop trigger if exists lists_default_currency on public.lists;
create trigger lists_default_currency
before insert on public.lists
for each row execute function public.apply_default_currency();

-- ─────────────── Guardar una lista como plantilla ──────────────────

/*
 * SECURITY INVOKER: quien llama tiene que poder leer la lista por sus propias
 * políticas RLS. La comprobación explícita de `is_list_member` está de más a
 * efectos de seguridad, pero convierte «te sale una plantilla vacía» en un
 * error que dice qué ha pasado.
 */
create or replace function public.save_list_as_template(
  p_list uuid,
  p_title text
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_owner    uuid := auth.uid();
  v_titulo   text := nullif(btrim(p_title), '');
  v_template uuid;
  v_locale   text;
  v_cuantas  integer;
begin
  if v_owner is null then
    raise exception 'Hay que tener sesión para guardar una plantilla.';
  end if;
  if not public.is_list_member(p_list) then
    raise exception 'Esa lista no es tuya.';
  end if;

  -- Un tope por persona: sin él, un bucle mal escrito en el cliente llena la
  -- tabla y el problema aparece semanas después.
  select count(*) into v_cuantas from public.list_templates where owner_id = v_owner;
  if v_cuantas >= 100 then
    raise exception 'Has llegado al máximo de 100 plantillas.';
  end if;

  select coalesce(p.locale, 'es') into v_locale from public.profiles p where p.id = v_owner;

  insert into public.list_templates (owner_id, locale, title, is_public, slug)
  values (v_owner, coalesce(v_locale, 'es'), coalesce(v_titulo, 'Mi plantilla'), false, null)
  returning id into v_template;

  -- Se copia lo que hay ahora, no una referencia: la plantilla es una foto.
  -- Cambiar la lista después no debe cambiar la plantilla, ni al revés.
  insert into public.template_items (template_id, name, qty, unit, category_id, sort_order)
  select v_template, i.name, i.qty, i.unit, i.category_id,
         row_number() over (order by i.sort_key)
  from public.list_items i
  where i.list_id = p_list and i.deleted_at is null
  limit 300;

  return v_template;
end;
$$;

revoke all on function public.save_list_as_template(uuid, text) from public;
grant execute on function public.save_list_as_template(uuid, text) to authenticated;

-- ─────────────────── Sobre exportar los datos ──────────────────────
--
-- No hay función aquí para eso, y es a propósito. La exportación existe desde
-- la PR de cuentas y la arma el cliente leyendo sus propias tablas
-- (`src/features/auth/export-data.ts`), que es donde se sabe qué email tiene
-- la sesión —`auth.users.email` no lo puede leer `authenticated`—. Escribir
-- una segunda implementación en SQL daría dos formatos que se separarían al
-- primer cambio. Lo que sí hace falta es que esa exportación incluya las
-- plantillas que esta migración estrena, y eso se hace en el cliente.

insert into public.schema_migrations (version) values ('0008_templates_and_gdpr')
on conflict (version) do nothing;

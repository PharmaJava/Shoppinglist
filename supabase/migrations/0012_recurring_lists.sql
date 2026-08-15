-- ══════════════════════════════════════════════════════════════════
-- 0012 · Listas recurrentes (F3-3)
--
-- «La compra de todas las semanas, ya hecha el viernes por la mañana.» Una
-- plantilla propia + una periodicidad, y la lista aparece sola.
--
-- Tres decisiones que conviene entender antes de leer el resto:
--
-- 1. **Cuelga de una plantilla, no de una lista.** Una lista se tacha, se
--    vacía y se archiva; una plantilla es una foto estable de qué se compra.
--    Repetir una lista viva daría copias de lo que quedó a medias.
-- 2. **Un día perdido no se recupera.** Si la tarea programada no corre en
--    tres días, al volver se crea **una** lista, no tres. Tres listas iguales
--    no son un servicio, son una limpieza pendiente.
-- 3. **Leer siempre, escribir sólo premium**, igual que la despensa (0011):
--    quien deja de pagar sigue viendo lo que tiene programado y puede
--    borrarlo; lo que no puede es programar más.
-- ══════════════════════════════════════════════════════════════════

create table if not exists public.recurring_lists (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references auth.users (id) on delete cascade,
  -- `on delete cascade`: borrar la plantilla borra la programación. La
  -- alternativa —dejarla huérfana— sería una lista automática que cada semana
  -- falla en silencio.
  template_id  uuid not null references public.list_templates (id) on delete cascade,
  -- El título con el que nace cada lista. Se copia de la plantilla al
  -- programarla, pero se puede cambiar: «Compra semanal» vale para la
  -- plantilla y para las listas que salen de ella.
  title        text not null check (length(btrim(title)) between 1 and 80),
  cadence      text not null check (cadence in ('weekly', 'biweekly', 'monthly')),
  -- ISO: 1 = lunes … 7 = domingo. Es lo que devuelve `extract(isodow …)`, así
  -- que no hay que traducir nada al calcular la siguiente fecha.
  weekday      smallint check (weekday between 1 and 7),
  /*
   * Tope 28 **a propósito**. El 31 no existe en febrero, y cualquier regla
   * para resolverlo («el último día», «el 1 del siguiente») convierte «te la
   * creo el día 31» en una promesa que se incumple cuatro veces al año.
   * Con 28 la promesa siempre es verdad.
   */
  day_of_month smallint check (day_of_month between 1 and 28),
  -- Sin hora: la tarea corre una vez al día y lo que importa es el día.
  next_run_on  date not null,
  last_run_on  date,
  -- Para poder enseñar «la última fue esta» y llevar a ella de un toque.
  last_list_id uuid references public.lists (id) on delete set null,
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  -- Cada periodicidad usa un campo y sólo uno. Sin esto cabría una fila
  -- «mensual los martes», que no significa nada y habría que interpretar.
  constraint recurring_lists_cadence_fields check (
    (cadence in ('weekly', 'biweekly') and weekday is not null and day_of_month is null)
    or (cadence = 'monthly' and day_of_month is not null and weekday is null)
  )
);

create index if not exists recurring_lists_owner_idx
  on public.recurring_lists (owner_id, created_at desc);

-- El índice que usa la tarea programada: sólo mira lo activo y vencido.
create index if not exists recurring_lists_due_idx
  on public.recurring_lists (next_run_on)
  where active;

drop trigger if exists recurring_lists_set_updated_at on public.recurring_lists;
create trigger recurring_lists_set_updated_at
before update on public.recurring_lists
for each row execute function public.set_updated_at();

-- ─────────────────────── Cuándo toca la siguiente ──────────────────

/**
 * La primera fecha **estrictamente posterior** a `p_from` que cumple la
 * periodicidad.
 *
 * Estrictamente posterior, y no «hoy si cuadra»: quien programa la compra de
 * los viernes un viernes por la tarde quiere la del viernes que viene, no una
 * lista que le aparece en el mismo minuto. Para eso está el botón de crearla
 * ahora.
 */
create or replace function public.next_run_after(
  p_cadence text,
  p_weekday smallint,
  p_day_of_month smallint,
  p_from date
)
returns date
language plpgsql
immutable
set search_path = public
as $$
declare
  v_hoy smallint;
  v_fecha date;
begin
  if p_cadence in ('weekly', 'biweekly') then
    v_hoy := extract(isodow from p_from)::smallint;
    -- Días que faltan hasta el próximo `p_weekday`, siempre entre 1 y 7: si
    -- hoy ya es ese día, toca dentro de una semana (ver arriba).
    v_fecha := p_from + (((p_weekday - v_hoy + 6) % 7) + 1);
    -- Cada dos semanas = la siguiente que tocaría, más una semana. Sale
    -- anclado en la fecha desde la que se calcula, que es la de la última vez.
    if p_cadence = 'biweekly' then
      v_fecha := v_fecha + 7;
    end if;
    return v_fecha;
  end if;

  v_fecha := make_date(
    extract(year from p_from)::int,
    extract(month from p_from)::int,
    p_day_of_month
  );
  if v_fecha <= p_from then
    v_fecha := (date_trunc('month', p_from) + interval '1 month')::date + (p_day_of_month - 1);
  end if;
  return v_fecha;
end;
$$;

/**
 * `next_run_on` lo decide el servidor, siempre.
 *
 * Si lo pusiera el cliente, bastaría escribir una fecha de ayer para que la
 * tarea programada creara una lista en la siguiente pasada, y otra, y otra.
 * Aquí se recalcula al crear y cada vez que cambia la periodicidad; la propia
 * tarea la adelanta luego sin pasar por este camino (no toca esos campos).
 */
create or replace function public.recurring_lists_schedule()
returns trigger
language plpgsql
-- INVOKER: sólo lee `recurring_lists`, y con RLS puesta eso ya limita el
-- recuento del tope a las filas de quien está insertando.
security invoker
set search_path = public
as $$
declare
  v_cuantas integer;
begin
  -- Las dos ramas van separadas y no en un `or`: en un disparador de INSERT
  -- el registro `old` no existe, y plpgsql no garantiza que una condición
  -- deje de evaluarse a medias.
  if tg_op = 'INSERT' then
    -- Un tope por persona, como en las plantillas: sin él, un bucle mal
    -- escrito en el cliente llena la tabla y el problema aparece semanas
    -- después, cuando ya hay cien listas creándose solas.
    select count(*) into v_cuantas from public.recurring_lists where owner_id = new.owner_id;
    if v_cuantas >= 20 then
      raise exception 'Has llegado al máximo de 20 listas automáticas.';
    end if;

    new.next_run_on := public.next_run_after(
      new.cadence, new.weekday, new.day_of_month, current_date
    );
  elsif new.cadence is distinct from old.cadence
        or new.weekday is distinct from old.weekday
        or new.day_of_month is distinct from old.day_of_month then
    new.next_run_on := public.next_run_after(
      new.cadence, new.weekday, new.day_of_month, current_date
    );
  end if;

  return new;
end;
$$;

drop trigger if exists recurring_lists_schedule on public.recurring_lists;
create trigger recurring_lists_schedule
before insert or update on public.recurring_lists
for each row execute function public.recurring_lists_schedule();

-- ────────────────────────────── RLS ────────────────────────────────

alter table public.recurring_lists enable row level security;

-- Leer: lo tuyo, pagues o no.
drop policy if exists recurring_select_own on public.recurring_lists;
create policy recurring_select_own on public.recurring_lists for select
  using (owner_id = auth.uid());

/*
 * Escribir: lo tuyo, siendo premium y **sobre una plantilla tuya**. Sin esa
 * última condición se podría programar una plantilla pública del catálogo, o
 * peor, la de otra persona: bastaría con su id.
 */
drop policy if exists recurring_insert_own on public.recurring_lists;
create policy recurring_insert_own on public.recurring_lists for insert
  with check (
    owner_id = auth.uid()
    and public.is_premium()
    and exists (
      select 1 from public.list_templates t
      where t.id = template_id and t.owner_id = auth.uid()
    )
  );

drop policy if exists recurring_update_own on public.recurring_lists;
create policy recurring_update_own on public.recurring_lists for update
  using (owner_id = auth.uid() and public.is_premium())
  with check (owner_id = auth.uid() and public.is_premium());

-- Borrar sí se deja siempre: quien ya no paga tiene que poder apagar lo que
-- dejó programado. Impedirlo sería dejarle listas creándose sin poder pararlas.
drop policy if exists recurring_delete_own on public.recurring_lists;
create policy recurring_delete_own on public.recurring_lists for delete
  using (owner_id = auth.uid());

-- ───────────────────── ¿Es premium *esta* persona? ─────────────────

/**
 * La tarea programada corre sin sesión: `auth.uid()` es nulo y `is_premium()`
 * —que pregunta por quien llama— diría que no para todo el mundo. Aquí se
 * pregunta por una persona concreta.
 *
 * Sin `grant` a `authenticated` a propósito: desde el navegador esto sería
 * una forma de averiguar quién paga y quién no.
 */
create or replace function public.is_premium_user(p_user uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select p.plan = 'premium' from public.profiles p where p.id = p_user), false);
$$;

/*
 * Los `revoke` nombran a `anon` y a `authenticated` uno por uno, y no basta
 * con `from public`: Supabase tiene puesto un ALTER DEFAULT PRIVILEGES que
 * concede EXECUTE a `anon`, `authenticated` y `service_role` sobre **todo** lo
 * que se cree en `public`. Esas concesiones son explícitas y no se van con un
 * `revoke ... from public`, que sólo quita la de PUBLIC. Lo que queda vivo es
 * `service_role`, que es justo quien tiene que poder.
 */
revoke all on function public.is_premium_user(uuid) from public, anon, authenticated;

-- Y `is_premium()` pasa a ser eso mismo preguntado por uno mismo: una sola
-- definición de qué es ser premium, en vez de dos que se separan al primer
-- cambio.
create or replace function public.is_premium()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.is_premium_user(auth.uid());
$$;

-- ──────────────────── Crear la lista de una vez ────────────────────

/**
 * Claves de orden compatibles con `fractional-indexing`, que es lo que usa el
 * cliente (`src/features/list/sort-key.ts`).
 *
 * No vale cualquier texto: la librería **valida** la clave anterior antes de
 * generar la siguiente, y una inventada («0001») haría que el primer producto
 * añadido a mano a una lista automática reventara. El formato es una cabecera
 * que dice cuántos dígitos vienen detrás —'c' son tres— y dígitos en base 62
 * con el alfabeto 0-9A-Za-z, que ordena igual que ASCII.
 *
 * Tres dígitos dan 238.328 posiciones; una plantilla tiene como mucho 300.
 */
create or replace function public.sort_key_at(p_index integer)
returns text
language plpgsql
immutable
as $$
declare
  v_digitos constant text := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  v_resto integer := p_index;
  v_clave text := '';
begin
  for _ in 1..3 loop
    v_clave := substr(v_digitos, (v_resto % 62) + 1, 1) || v_clave;
    v_resto := v_resto / 62;
  end loop;
  return 'c' || v_clave;
end;
$$;

/**
 * Crea **ya** la lista de una programación y devuelve su id.
 *
 * Un solo camino para las dos formas de disparar esto —la tarea programada y
 * el botón de «crearla ahora»—: dos implementaciones acabarían dando listas
 * distintas según quién las pidiera.
 *
 * SECURITY DEFINER porque la tarea programada corre sin sesión y tiene que
 * poder crear la lista **a nombre de otra persona**. Eso obliga a comprobar a
 * mano quién llama: o es el servidor (clave de servicio), o es el dueño.
 *
 * No toca `next_run_on`: crear una ahora no descoloca el calendario.
 */
create or replace function public.run_recurring_list(p_recurring uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rec      public.recurring_lists;
  v_rol      text;
  v_lista    uuid;
  v_cuantos  integer;
begin
  -- El rol del JWT, que en Supabase llega por una de estas dos vías según la
  -- versión de PostgREST. Mismo apaño que en `admin_kpis` (migración 0009).
  v_rol := coalesce(
    current_setting('request.jwt.claim.role', true),
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'
  );

  select * into v_rec from public.recurring_lists where id = p_recurring;
  if not found then
    raise exception 'Esa lista automática no existe.';
  end if;

  if v_rol is distinct from 'service_role' and v_rec.owner_id is distinct from auth.uid() then
    raise exception 'Esa lista automática no es tuya.';
  end if;

  if not public.is_premium_user(v_rec.owner_id) then
    raise exception 'Esta función es de ListaSupermercado Premium.'
      using errcode = 'insufficient_privilege';
  end if;

  select count(*) into v_cuantos
  from public.template_items where template_id = v_rec.template_id;
  if v_cuantos = 0 then
    -- Crear una lista vacía cada semana es peor que no crearla: parece que
    -- funciona y no trae nada. Se avisa para que se pueda arreglar.
    raise exception 'Esa plantilla no tiene productos.';
  end if;

  -- La moneda la pone el disparador `lists_default_currency` (migración 0008)
  -- leyendo el perfil del dueño, y el propietario se añade como miembro solo
  -- (`on_list_created`, esquema base). Aquí no hay que repetir ninguna de las dos.
  insert into public.lists (owner_id, title)
  values (v_rec.owner_id, v_rec.title)
  returning id into v_lista;

  -- `list_items.id` no tiene valor por defecto: los genera el cliente para
  -- poder encolar productos sin red (ver src/lib/sync). Aquí no hay cliente.
  insert into public.list_items (id, list_id, name, qty, unit, category_id, sort_key, created_by)
  select gen_random_uuid(), v_lista, ti.name, ti.qty, ti.unit, ti.category_id,
         public.sort_key_at((row_number() over (order by ti.sort_order, ti.id))::integer),
         v_rec.owner_id
  from public.template_items ti
  where ti.template_id = v_rec.template_id;

  update public.recurring_lists
    set last_run_on = current_date, last_list_id = v_lista
  where id = p_recurring;

  return v_lista;
end;
$$;

revoke all on function public.run_recurring_list(uuid) from public, anon;
grant execute on function public.run_recurring_list(uuid) to authenticated;

-- ──────────────────── La pasada de cada mañana ─────────────────────

/**
 * Crea las listas que tocan hoy. La llama una vez al día la tarea programada
 * (`/api/cron/recurring`, ver docs/13-RECURRENTES.md) con la clave de
 * servicio.
 *
 * Devuelve lo creado para poder avisar por push a cada dueño: quien no se
 * entera de que su lista está hecha, no la usa.
 *
 * Sólo el servidor: desde el navegador esto crearía listas a nombre de otros.
 */
create or replace function public.run_due_recurring_lists(p_today date default current_date)
returns table (recurring_id uuid, list_id uuid, owner_id uuid, title text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rol   text;
  v_rec   public.recurring_lists;
  v_lista uuid;
begin
  v_rol := coalesce(
    current_setting('request.jwt.claim.role', true),
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'
  );
  if v_rol is not null and v_rol <> 'service_role' then
    raise exception 'run_due_recurring_lists sólo la puede llamar el servidor.';
  end if;

  for v_rec in
    select * from public.recurring_lists
    where active and next_run_on <= p_today
    order by next_run_on
  loop
    begin
      v_lista := public.run_recurring_list(v_rec.id);
    exception when others then
      -- Una programación rota —plantilla vacía, dueño que ya no paga— no
      -- puede dejar sin lista a los demás. Se salta y se sigue.
      v_lista := null;
    end;

    /*
     * La fecha se adelanta pase lo que pase, y se calcula desde hoy y no
     * desde `next_run_on`: si la tarea no corrió en tres días, esto da la
     * siguiente de verdad en vez de ir recuperando una a una las perdidas.
     * `greatest` protege el caso contrario —una fila con la fecha en el
     * futuro no puede retroceder— aunque el `where` de arriba ya lo impide.
     */
    update public.recurring_lists
      set next_run_on = public.next_run_after(
        cadence, weekday, day_of_month, greatest(p_today, next_run_on)
      )
    where id = v_rec.id;

    if v_lista is not null then
      recurring_id := v_rec.id;
      list_id      := v_lista;
      owner_id     := v_rec.owner_id;
      title        := v_rec.title;
      return next;
    end if;
  end loop;
end;
$$;

revoke all on function public.run_due_recurring_lists(date) from public, anon, authenticated;

/**
 * A qué dispositivos avisar de que ya tiene la lista hecha.
 *
 * Hermana de `push_targets_for_list` (migración 0006) y por el mismo motivo
 * sin `grant`: desde el navegador sería una forma de leer los endpoints de
 * push de otras personas.
 */
create or replace function public.push_targets_for_user(p_user uuid)
returns table (endpoint text, p256dh text, auth text, locale text)
language sql
security definer
stable
set search_path = public
as $$
  select s.endpoint, s.p256dh, s.auth, s.locale
  from public.push_subscriptions s
  where s.user_id = p_user;
$$;

revoke all on function public.push_targets_for_user(uuid) from public, anon, authenticated;

-- Y de paso su hermana de 0006, que se revocó de `public` y de `authenticated`
-- pero no de `anon`: por lo dicho arriba, ahí seguía concedida. Un invitado sin
-- cuenta podía llamarla y leer los endpoints de push de una lista.
revoke all on function public.push_targets_for_list(uuid, uuid) from public, anon, authenticated;

insert into public.schema_migrations (version) values ('0012_recurring_lists')
on conflict (version) do nothing;

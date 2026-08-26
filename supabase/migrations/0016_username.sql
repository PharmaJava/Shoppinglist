-- ══════════════════════════════════════════════════════════════════
-- 0016 · Nombre de usuario
--
-- Hasta ahora sólo se podía entrar con el correo. Se añade una tercera
-- forma: **un nombre de usuario inventado**, más una contraseña.
--
-- Lo que NO cambia, y conviene decirlo antes de leer nada más: el correo
-- sigue siendo obligatorio. Supabase identifica a la persona por su correo
-- —es lo que le permite mandar el enlace de confirmación y el de «he
-- olvidado la contraseña»—, así que el usuario no sustituye al correo: es un
-- alias más corto para entrar. Una cuenta, dos maneras de decir quién eres.
--
-- El correo de nadie sale de aquí. Traducir «usuario → correo» hace falta
-- para poder entrar, pero se hace en el servidor con la clave de servicio
-- (`email_for_username`, abajo, revocada de todo el mundo menos del
-- servidor). Si esa traducción se hiciera en el navegador, cualquiera podría
-- recorrer nombres de usuario y quedarse con los correos.
-- ══════════════════════════════════════════════════════════════════

alter table public.profiles add column if not exists username text;

/*
 * Minúsculas, números y guion bajo; de 3 a 20. Sin acentos ni espacios: un
 * nombre que se teclea a la primera en el móvil, y que no se puede confundir
 * con el de otra persona por una tilde de más.
 *
 * Se guarda ya normalizado (en minúsculas), así que la unicidad del índice de
 * abajo es de verdad insensible a mayúsculas sin necesitar `citext`.
 */
alter table public.profiles drop constraint if exists profiles_username_format;
alter table public.profiles add constraint profiles_username_format
  check (username is null or username ~ '^[a-z0-9_]{3,20}$');

-- Único, y varios nulos: quien entra con correo no tiene por qué tener uno.
create unique index if not exists profiles_username_key on public.profiles (username);

/** Lo que se teclea → lo que se guarda. Vacío es nulo, no cadena vacía. */
create or replace function public.normalize_username(p_raw text)
returns text
language sql
immutable
as $$ select nullif(lower(trim(p_raw)), ''); $$;

-- ─────────────────── ¿Está libre este nombre? ──────────────────────

/**
 * Lo pregunta el formulario de alta antes de mandar nada.
 *
 * SECURITY DEFINER porque `profiles_select_visible` (esquema base) sólo deja
 * ver el perfil propio y el de quien comparte lista contigo: sin esto, nadie
 * podría saber si un nombre está cogido hasta que fallara el alta.
 *
 * Lo único que revela es si un nombre existe, que es inherente a tener
 * nombres de usuario — y desde luego no revela de quién es.
 */
create or replace function public.username_available(p_username text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(public.normalize_username(p_username) ~ '^[a-z0-9_]{3,20}$', false)
     and not exists (
       select 1 from public.profiles p
       where p.username = public.normalize_username(p_username)
     );
$$;

grant execute on function public.username_available(text) to anon, authenticated;

-- ──────────────── Usuario → correo, sólo en el servidor ────────────

/**
 * La traducción que hace posible entrar con el nombre de usuario.
 *
 * Dos cerraduras, y las dos hacen falta:
 *
 * 1. **Revocada de `anon` y `authenticated`.** No basta con `from public`:
 *    Supabase concede EXECUTE a esos roles sobre todo lo que se cree en
 *    `public` mediante `ALTER DEFAULT PRIVILEGES`, y esas concesiones no se
 *    van con un `revoke ... from public` (misma lección que la migración
 *    0012).
 * 2. **Guarda de rol dentro.** Si algún día un `grant` de más volviera a
 *    abrirla, esto sigue cerrado.
 *
 * SECURITY DEFINER porque lee `auth.users`, que no puede leer ni la clave de
 * servicio: es de `supabase_auth_admin` (migración 0009).
 */
create or replace function public.email_for_username(p_username text)
returns text
language plpgsql
security definer
stable
set search_path = public, auth
as $$
declare
  v_rol text;
begin
  v_rol := coalesce(
    current_setting('request.jwt.claim.role', true),
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'
  );
  if v_rol is not null and v_rol <> 'service_role' then
    raise exception 'email_for_username sólo la puede llamar el servidor.';
  end if;

  return (
    select u.email
    from public.profiles p
    join auth.users u on u.id = p.id
    where p.username = public.normalize_username(p_username)
  );
end;
$$;

revoke all on function public.email_for_username(text) from public, anon, authenticated;
grant execute on function public.email_for_username(text) to service_role;

-- ───────────── El nombre elegido al crear la cuenta ────────────────

/**
 * Quien se da de alta con nombre de usuario no tiene sesión todavía —falta
 * confirmar el correo—, así que no puede escribir su propio perfil. El nombre
 * viaja en los metadatos del alta (`options.data.username` en el cliente) y se
 * recoge aquí, que es el único momento en que hay permiso para hacerlo.
 *
 * Si el nombre está cogido, **el alta entera falla**. Es deliberado: el
 * disparador es `after insert`, así que la excepción deshace también el
 * usuario y no queda nadie a medio crear creyendo que tiene un nombre que en
 * realidad es de otro. El formulario lo comprueba antes con
 * `username_available`; esto es la carrera de los dos segundos siguientes.
 */
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
begin
  v_username := public.normalize_username(new.raw_user_meta_data ->> 'username');

  if v_username is not null and not public.username_available(v_username) then
    raise exception 'username_taken' using errcode = 'unique_violation';
  end if;

  insert into public.profiles (id, username) values (new.id, v_username)
  on conflict (id) do nothing;
  return new;
end;
$$;

insert into public.schema_migrations (version) values ('0016_username')
on conflict (version) do nothing;

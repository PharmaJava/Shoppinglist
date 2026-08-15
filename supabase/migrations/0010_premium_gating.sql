-- ══════════════════════════════════════════════════════════════════
-- 0010 · Control de plan (F3-2)
--
-- El esquema base ya trae `profiles.plan` ('free' | 'premium') y la tabla
-- `subscriptions`, pero nadie los comprobaba: hasta ahora no había nada de
-- pago que proteger.
--
-- La regla de la que cuelga toda la Fase 3: **manipular el cliente no
-- desbloquea nada**. El interruptor de `src/lib/flags.ts` decide qué se
-- enseña; lo que decide qué se puede hacer es esto.
--
-- Y una decisión que conviene entender antes de leer el resto: el plan **no**
-- lo escribe nadie desde el cliente. `profiles.plan` sale de la política
-- `profiles_update_own`, que permitiría a cualquiera ponerse 'premium' con una
-- línea en la consola. Aquí se cierra esa puerta.
-- ══════════════════════════════════════════════════════════════════

-- ─────────────── El plan deja de ser escribible a mano ─────────────

/*
 * `profiles_update_own` dejaba actualizar cualquier columna del propio perfil,
 * `plan` incluida. Se sustituye por una política que comprueba, en el `WITH
 * CHECK`, que el plan que queda es el que ya había: el nombre, el idioma y la
 * moneda se siguen cambiando igual, y `plan` no.
 *
 * Quien lo escribe es el webhook de Stripe con la clave de servicio, que se
 * salta RLS (F3-1, todavía por llegar).
 */
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and plan = (select p.plan from public.profiles p where p.id = auth.uid())
  );

-- ───────────────────── ¿Esta persona es premium? ───────────────────

/*
 * SECURITY DEFINER porque la van a llamar las políticas RLS de las tablas de
 * pago, y ahí una consulta a `profiles` volvería a pasar por RLS: recursión.
 * Es el mismo patrón que `is_list_member` en el esquema base.
 *
 * Devuelve `false` sin sesión, que es lo correcto: un invitado no es premium.
 */
create or replace function public.is_premium()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select p.plan = 'premium' from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

revoke all on function public.is_premium() from public;
grant execute on function public.is_premium() to authenticated;

/*
 * Y la versión que sirve para *rechazar*: las funciones de la Fase 3 la llaman
 * al empezar. Un `raise` con mensaje propio explica por qué no se puede, en vez
 * de dejar que RLS devuelva cero filas y parezca que la función está rota.
 */
create or replace function public.require_premium()
returns void
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if not public.is_premium() then
    raise exception 'Esta función es de ListaSupermercado Premium.'
      using errcode = 'insufficient_privilege';
  end if;
end;
$$;

revoke all on function public.require_premium() from public;
grant execute on function public.require_premium() to authenticated;

insert into public.schema_migrations (version) values ('0010_premium_gating')
on conflict (version) do nothing;

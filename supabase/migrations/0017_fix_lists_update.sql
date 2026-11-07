-- ══════════════════════════════════════════════════════════════════
-- 0017 · Arreglar `lists_update` (la dejó rota la 0015)
--
-- Tres fallos con el mismo origen, reproducidos contra PostgreSQL 16 con las
-- dieciséis migraciones aplicadas:
--
-- A. La política de la 0015 comparaba con
--        (select l.auto_finish_at from public.lists l where l.id = id)
--    y ese `id` se resuelve a `l.id`, la columna de la propia subconsulta, no
--    a la fila que se actualiza. La condición era `l.id = l.id`: siempre
--    cierta, y la subconsulta devolvía TODAS las listas que la persona ve.
--    Con dos o más listas, cualquier actualización fallaba con «more than one
--    row returned by a subquery used as an expression». Renombrar, archivar o
--    poner presupuesto, imposible a partir de la segunda lista.
--
-- B. En invitados, aunque sólo tuvieran una lista, también fallaba: el
--    navegador guarda con `upsert` de la fila entera, el disparador de
--    creación (`lists_set_auto_finish`) reescribe `auto_finish_at` en la fila
--    propuesta ANTES de resolver el conflicto, y la política veía un valor
--    distinto del guardado y rechazaba.
--
-- C. (Desde la 0001.) Un editor que no era el dueño tampoco podía: el
--    `upsert` pasa también por `lists_insert`, que exige `owner_id =
--    auth.uid()`. Eso se corrige en el cliente, que ya no usa `upsert` para
--    las listas (nunca se crean sin red): ver src/lib/sync/flush.ts.
--
-- Y una cuarta cosa, de seguridad, que apareció al leer la política:
--
-- D. (Desde la 0001.) `lists_update` deja escribir cualquier columna a
--    cualquier editor, así que un editor podía ejecutar
--        update lists set owner_id = auth.uid() where id = ...
--    y quedarse con la lista de otra persona, borrado incluido.
--
-- La solución para A, B y D es la misma que la de `profiles.plan` (0010) y
-- más fuerte que una política: un disparador que, cuando escribe el
-- navegador, devuelve a su valor las columnas que no son suyas. No da error:
-- las ignora, así que un cliente que mande la fila entera sigue funcionando y
-- uno malicioso no consigue nada.
-- ══════════════════════════════════════════════════════════════════

-- Vuelve a la política del esquema base: poder editar la lista. Lo que no se
-- puede tocar lo guarda el disparador de abajo, no la política.
drop policy if exists lists_update on public.lists;
create policy lists_update on public.lists for update
  using (public.can_edit_list(id))
  with check (public.can_edit_list(id));

/**
 * Columnas de `lists` que el navegador no puede cambiar:
 *
 * - `owner_id`: el traspaso tiene su función (`transfer_list_ownership`).
 * - `auto_finish_at`: volver a abrir una lista tiene la suya (`reopen_list`).
 * - `created_at`: es un dato histórico.
 *
 * `current_user` es el rol con el que corre la sentencia. Cuando escribe el
 * navegador, PostgREST cambia a `authenticated` (o `anon`); dentro de una
 * función `SECURITY DEFINER` —el traspaso, reabrir, los disparadores de
 * registro, la pasada diaria— es el dueño de la función, así que esas siguen
 * pudiendo. No se mira el JWT: el rol de la sesión no se puede falsear desde
 * la API.
 */
create or replace function public.lists_protect_columns()
returns trigger
language plpgsql
as $$
begin
  if current_user in ('authenticated', 'anon') then
    new.owner_id := old.owner_id;
    new.auto_finish_at := old.auto_finish_at;
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$;

drop trigger if exists lists_protect_columns on public.lists;
create trigger lists_protect_columns
before update on public.lists
for each row execute function public.lists_protect_columns();

insert into public.schema_migrations (version) values ('0017_fix_lists_update')
on conflict (version) do nothing;

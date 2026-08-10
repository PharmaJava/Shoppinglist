-- Causa raíz del fallo persistente al crear una lista:
-- "new row violates row-level security policy for table lists".
--
-- El insert se hace con RETURNING (`.select()` en supabase-js, o
-- `Prefer: return=representation` en PostgREST). Cuando hay RETURNING,
-- PostgreSQL evalúa también las políticas de SELECT sobre la fila nueva, y lo
-- hace ANTES de que se disparen los triggers AFTER INSERT.
--
-- `lists_select` era `using (public.is_list_member(id))`, y la fila de
-- `list_members` que convierte al propietario en miembro la crea el trigger
-- `on_list_created`, que en ese momento todavía no ha corrido. La comprobación
-- fallaba siempre, con el mismo mensaje que produce un WITH CHECK incumplido
-- — de ahí que pareciera un problema de `lists_insert` o de la sesión.
--
-- Se añade al SELECT la condición directa de propiedad, que sí es cierta en
-- ese instante porque `owner_id` viaja en la propia fila insertada. Además
-- deja al propietario ver su lista aunque le faltara la fila de membresía.

drop policy if exists lists_select on public.lists;
create policy lists_select on public.lists for select
  using (owner_id = auth.uid() or public.is_list_member(id));

-- El diagnóstico temporal de 20260813000000 ya no hace falta.
drop function if exists public.debug_auth_context();

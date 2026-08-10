-- Diagnóstico temporal: expone lo que el servidor ve realmente en una
-- request autenticada (auth.uid(), auth.role(), claims del JWT tal como los
-- interpreta PostgREST). A diferencia del SQL Editor (que corre como
-- "postgres" y no pasa por RLS/PostgREST), esta función se invoca vía RPC
-- desde el cliente, así que refleja el contexto real de la request que
-- falla. SECURITY INVOKER (por defecto): debe correr con los privilegios de
-- quien llama, no los del dueño, para reflejar auth.uid() real.
--
-- Borrar esta función una vez resuelto el problema de RLS en "lists".

create or replace function public.debug_auth_context()
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'uid', auth.uid(),
    'role', auth.role(),
    'jwt_claims', coalesce(current_setting('request.jwt.claims', true), 'null')::jsonb
  );
$$;

grant execute on function public.debug_auth_context() to anon, authenticated;

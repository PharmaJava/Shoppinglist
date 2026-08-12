/**
 * Traduce lo que responde Postgres a algo accionable.
 *
 * El panel lo mira una persona sola y a deshora; «permission denied for table
 * users» es correcto y no dice qué hacer. Cada uno de estos casos ocurrió de
 * verdad, y por eso está aquí: la primera vez costó un rato averiguarlo.
 */
export function pistaDelError(detalle: string): string | null {
  const texto = detalle.toLowerCase();

  if (texto.includes("could not find the function") || texto.includes("does not exist")) {
    return "La función no existe todavía: falta aplicar supabase/migrations/0007_admin_kpis.sql en el editor SQL de Supabase.";
  }

  // El fallo de la 0007: la función era SECURITY INVOKER y `service_role` no
  // puede leer `auth.users`, que es de `supabase_auth_admin`.
  if (texto.includes("permission denied for table users")) {
    return "Falta aplicar supabase/migrations/0009_admin_kpis_definer.sql: sin ella la función se ejecuta sin permiso para leer auth.users.";
  }

  if (texto.includes("sólo la puede llamar el servidor")) {
    return "La llamada no ha ido con la clave de servicio. Revisa SUPABASE_SERVICE_ROLE_KEY en las variables del servidor.";
  }

  if (texto.includes("permission denied for function")) {
    return "A service_role le falta EXECUTE sobre admin_kpis. Vuelve a aplicar la última migración del panel.";
  }

  return null;
}

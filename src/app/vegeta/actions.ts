"use server";

import { redirect } from "next/navigation";
import { cerrarSesionAdmin, iniciarSesionAdmin } from "@/lib/admin/auth";

export interface EstadoAcceso {
  error?: string;
}

/**
 * La contraseña llega aquí en el cuerpo de un POST y se compara **en el
 * servidor**, contra el hash de `ADMIN_PASSWORD_HASH`. No hay ninguna
 * variable `NEXT_PUBLIC_` de por medio, así que nada de esto viaja al
 * navegador: el formulario sólo sabe enviar, no sabe si ha acertado hasta que
 * el servidor se lo dice.
 */
export async function accederAction(
  _anterior: EstadoAcceso,
  datos: FormData,
): Promise<EstadoAcceso> {
  const email = String(datos.get("email") ?? "");
  const password = String(datos.get("password") ?? "");

  const resultado = await iniciarSesionAdmin(email, password);

  if (resultado.ok) redirect("/vegeta");

  if (resultado.motivo === "bloqueado") {
    const minutos = Math.ceil(resultado.segundos / 60);
    return { error: `Demasiados intentos. Vuelve a probar en ${minutos} min.` };
  }
  if (resultado.motivo === "sin_configurar") {
    return { error: "El panel no está configurado en este despliegue." };
  }

  // El mismo mensaje para «correo que no es» y «contraseña que no es»: decir
  // cuál de los dos ha fallado es regalar la mitad de la respuesta.
  return { error: "Credenciales incorrectas." };
}

export async function salirAction(): Promise<void> {
  await cerrarSesionAdmin();
  redirect("/vegeta");
}

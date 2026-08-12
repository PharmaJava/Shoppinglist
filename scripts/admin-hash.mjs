/**
 * Genera el valor de `ADMIN_PASSWORD_HASH` a partir de una contraseña.
 *
 * La contraseña del panel no se guarda en ningún sitio: se guarda esto. Ni el
 * repositorio, ni el navegador, ni las variables de entorno llegan a ver la
 * contraseña en claro.
 *
 *   node scripts/admin-hash.mjs 'mi contraseña'
 *   node scripts/admin-hash.mjs            # la pide sin mostrarla al teclear
 *
 * El resultado se pega en Vercel → Settings → Environment Variables (y en
 * `.env.local` para desarrollo). Cambiarlo cierra todas las sesiones abiertas
 * del panel, porque la firma de la cookie se deriva de este valor.
 */
import { createInterface } from "node:readline";
import { hashPassword } from "../src/lib/admin/password.ts";

async function pedirContrasena() {
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });

  // Sin eco: una contraseña no se queda escrita en el historial de la terminal
  // ni a la vista de quien pase por detrás.
  const escribir = rl.output.write.bind(rl.output);
  rl.output.write = (fragmento) => (fragmento.includes("\n") ? escribir(fragmento) : true);

  const respuesta = await new Promise((resolve) => rl.question("Contraseña: ", resolve));
  rl.output.write = escribir;
  rl.close();
  process.stdout.write("\n");
  return respuesta;
}

const desdeArgumentos = process.argv.slice(2).join(" ");
const contrasena = desdeArgumentos || (await pedirContrasena());

if (!contrasena || contrasena.length < 12) {
  console.error("La contraseña debe tener al menos 12 caracteres.");
  process.exit(1);
}

console.log(`\nADMIN_PASSWORD_HASH=${await hashPassword(contrasena)}\n`);

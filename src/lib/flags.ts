/**
 * Interruptores de funciones.
 *
 * La Fase 3 (premium) se construye entera antes de enseñarla. Mientras tanto
 * vive detrás de este interruptor, apagado por defecto: el código está en el
 * repositorio y en el paquete, pero no hay ninguna puerta por la que entrar.
 *
 * Es una variable `NEXT_PUBLIC_` **a propósito**, aunque eso signifique que
 * viaja al navegador. Lo que se oculta aquí no es un secreto —son pantallas de
 * producto sin terminar— y el interruptor tiene que valer lo mismo en el
 * servidor (para no renderizar la ruta) y en el cliente (para no pintar el
 * enlace). Un flag que sólo existiera en el servidor obligaría a pasarlo por
 * props hasta el último botón.
 *
 * Lo que **no** protege esto: los datos. De eso se encargan RLS y las
 * comprobaciones de plan del servidor, que siguen puestas aunque alguien fuerce
 * el flag en su navegador. Ver `src/features/billing/plan.ts`.
 */
export type Flag = "premium";

function activo(valor: string | undefined): boolean {
  return valor === "1" || valor === "true";
}

/**
 * Se lee `process.env.NEXT_PUBLIC_*` con el nombre completo escrito a mano y
 * no con una plantilla: Next sustituye estas expresiones en tiempo de compilado
 * buscando el literal, y `process.env[`NEXT_PUBLIC_${x}`]` no lo encuentra —
 * quedaría `undefined` en el navegador sin avisar de nada.
 */
export function flagActivo(flag: Flag): boolean {
  switch (flag) {
    case "premium":
      return activo(process.env.NEXT_PUBLIC_FEATURE_PREMIUM);
  }
}

/** Atajo para lo que más se pregunta. */
export const PREMIUM_VISIBLE = flagActivo("premium");

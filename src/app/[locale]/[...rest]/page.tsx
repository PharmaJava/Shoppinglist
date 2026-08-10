import { notFound } from "next/navigation";

/**
 * Captura cualquier ruta bajo un idioma que no exista.
 *
 * Sin esto, Next resuelve las rutas sin coincidencia con el `not-found` de la
 * raíz —el genérico, sin cabecera, pie ni idioma— porque `not-found.tsx` de un
 * segmento sólo cubre los `notFound()` lanzados dentro de él. Llamarlo aquí
 * hace que la 404 sea la del segmento y conserve la interfaz.
 *
 * Las rutas reales ganan a este comodín: Next resuelve siempre lo más
 * específico primero.
 */
export default function CatchAllNotFound() {
  notFound();
}

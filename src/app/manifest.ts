import type { MetadataRoute } from "next";

/**
 * `id` es la identidad de la app para el navegador. Una vez instalada, cambiar
 * este valor hace que Chrome la considere *otra* app distinta: quien la tuviera
 * instalada se quedaría con la vieja y se le ofrecería instalar la nueva. No se
 * toca nunca, aunque cambie `start_url`.
 */
const APP_ID = "/";

/**
 * `handle_links` es un miembro estándar del manifest que el tipo de Next
 * todavía no lista. Se declara aquí en vez de castear el objeto entero: así
 * el resto del manifest sigue comprobándose contra el tipo de Next.
 */
type Manifest = MetadataRoute.Manifest & { handle_links?: "auto" | "preferred" | "not-preferred" };

export default function manifest(): Manifest {
  return {
    id: APP_ID,
    name: "ListaSupermercado — lista de la compra compartida",
    short_name: "ListaSupermercado",
    description: "Crea una lista de la compra, compártela y marcad juntos mientras compráis.",
    lang: "es",
    dir: "ltr",
    categories: ["shopping", "productivity", "lifestyle"],
    start_url: "/",
    scope: "/",
    display: "standalone",
    // Si el navegador no sabe abrir en `standalone`, que use la barra mínima
    // antes de caer en una pestaña normal con toda la interfaz del navegador.
    display_override: ["standalone", "minimal-ui"],
    background_color: "#ffffff",
    theme_color: "#1fa971",
    orientation: "portrait",
    // No hay app nativa en ninguna tienda: que el navegador no ofrezca ir a
    // buscarla.
    prefer_related_applications: false,
    related_applications: [],
    // Un toque en una notificación reutiliza la ventana que ya esté abierta en
    // vez de apilar copias de la misma lista.
    launch_handler: { client_mode: ["navigate-existing", "auto"] },
    /**
     * Pide que los enlaces del sitio los abra la app instalada y no el
     * navegador.
     *
     * `preferred` y no `auto`: `auto` deja la decisión al navegador, que en la
     * práctica es «no». Y no `not-preferred`, que sería pedir lo contrario.
     *
     * Lo que esto **no** hace, para que conste: en iPhone y iPad no existe
     * forma de que una web instalada capture enlaces —eso son Universal Links,
     * y exigen una app nativa firmada—, y un enlace abierto dentro de WhatsApp
     * se queda en el navegador de WhatsApp haga lo que haga el manifest. Ver
     * docs/08-PWA.md §7.
     */
    handle_links: "preferred",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    /**
     * Sin capturas, Chrome en Android enseña una barra gris minúscula al pie.
     * Con ellas enseña el diálogo de instalación grande, con nombre, icono y
     * previsualización — que es la diferencia entre que la instalen y que no.
     * Hace falta al menos una `narrow` y una `wide`.
     */
    screenshots: [
      {
        src: "/screenshots/movil-1.png",
        sizes: "780x1688",
        type: "image/png",
        form_factor: "narrow",
        label: "Escribe el primer producto y ya tienes lista",
      },
      {
        src: "/screenshots/movil-2.png",
        sizes: "780x1688",
        type: "image/png",
        form_factor: "narrow",
        label: "Crear, compartir por WhatsApp y comprar en equipo",
      },
      {
        src: "/screenshots/escritorio-1.png",
        sizes: "2560x1600",
        type: "image/png",
        form_factor: "wide",
        label: "La lista compartida, sincronizada entre móviles",
      },
    ],
    shortcuts: [
      {
        name: "Nueva lista",
        short_name: "Nueva lista",
        description: "Empieza una lista de la compra en blanco",
        url: "/es?new=1",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Mis listas",
        short_name: "Mis listas",
        description: "Abre las listas que ya tienes",
        url: "/es/mis-listas",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
    share_target: {
      action: "/share-target",
      method: "POST",
      enctype: "multipart/form-data",
      params: {
        title: "title",
        text: "text",
        url: "url",
      },
    },
  };
}

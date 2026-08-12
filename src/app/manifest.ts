import type { MetadataRoute } from "next";

/**
 * `id` es la identidad de la app para el navegador. Una vez instalada, cambiar
 * este valor hace que Chrome la considere *otra* app distinta: quien la tuviera
 * instalada se quedaría con la vieja y se le ofrecería instalar la nueva. No se
 * toca nunca, aunque cambie `start_url`.
 */
const APP_ID = "/";

export default function manifest(): MetadataRoute.Manifest {
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

import type { LegalDocument } from "../types";

/**
 * Textos legales en español.
 *
 * Describen con exactitud lo que hace la aplicación hoy. El responsable es
 * una persona física que se identifica por nombre y perfil de LinkedIn, que
 * es el canal de contacto: es lo que hay, y decirlo así es mejor que un
 * formulario de contacto que no lee nadie.
 *
 * Si el proyecto pasa a facturar o a tener empresa detrás, esta sección hay
 * que ampliarla con los datos identificativos completos.
 */
export const privacyEs: LegalDocument = {
  slug: "privacidad",
  title: "Política de privacidad",
  metaTitle: "Política de privacidad",
  metaDescription:
    "Qué datos guarda ListaSupermercado, para qué, con quién se comparten y cómo ejercer tus derechos. Sin rodeos.",
  updatedAt: "2026-08-11",
  blocks: [
    {
      heading: "Lo esencial en cuatro líneas",
      paragraphs: [
        "Para usar la aplicación no hace falta darnos ningún dato personal: puedes crear y compartir listas sin correo, sin nombre y sin contraseña.",
        "Si decides crear una cuenta, guardamos tu correo para poder identificarte. Nada más.",
        "No vendemos datos, no hacemos perfiles publicitarios y no usamos cookies de seguimiento.",
        "Puedes borrar tu cuenta y todo lo asociado desde la propia aplicación, tú mismo, sin escribirnos.",
      ],
    },
    {
      heading: "Quién es el responsable",
      paragraphs: [
        "ListaSupermercado es un proyecto personal de Antonio. No hay empresa detrás: lo mantiene una sola persona.",
        "Para cualquier cuestión relacionada con tus datos —acceso, corrección, borrado, portabilidad u oposición— escribe por LinkedIn, en linkedin.com/in/farmaiant. Se responde a todo.",
        "Quién hay detrás y por qué existe esta aplicación está contado en la página «Quiénes somos».",
      ],
    },
    {
      heading: "Qué datos tratamos y por qué",
      paragraphs: ["Sólo tratamos lo necesario para que la aplicación funcione. En concreto:"],
      bullets: [
        "Identificador de invitado: al crear tu primera lista se genera una identidad anónima. Es un identificador aleatorio, no lleva ningún dato tuyo, y existe para que tus listas sean tuyas y nadie más pueda editarlas. Base legal: ejecución del servicio que has solicitado.",
        "Correo electrónico: sólo si creas una cuenta. Sirve para identificarte al entrar y para enviarte el enlace de acceso o el de recuperación de contraseña. Base legal: ejecución del contrato.",
        "Contraseña: sólo si eliges ese método. No la almacenamos: se guarda cifrada y de forma irreversible, y nadie —tampoco nosotros— puede leerla.",
        "Nombre visible: opcional. Si lo pones, lo verán quienes compartan lista contigo, para saber quién ha añadido o marcado cada producto.",
        "Contenido de tus listas: los productos, cantidades y notas que escribes. Son tuyos y sólo los ven quienes tengan el enlace que hayas compartido.",
        "Datos técnicos agregados: visitas y rendimiento de las páginas, sin cookies y sin identificarte.",
      ],
    },
    {
      heading: "Con quién se comparten",
      paragraphs: [
        "Con nadie con fines comerciales. Sólo con los proveedores que hacen falta para que el servicio exista, y que actúan como encargados del tratamiento siguiendo nuestras instrucciones:",
      ],
      bullets: [
        "Supabase: base de datos y autenticación. Aloja tus listas y tu correo si tienes cuenta.",
        "Vercel: alojamiento de la web y métricas agregadas de uso y rendimiento, sin cookies ni identificación individual.",
      ],
    },
    {
      heading: "Cuánto tiempo los guardamos",
      paragraphs: [
        "Tus listas y tu cuenta se conservan mientras la sigas usando. Si borras la cuenta, se eliminan de inmediato junto con las listas de las que seas propietario.",
        "Las identidades de invitado que no tengan ninguna lista asociada se depuran periódicamente, porque no aportan nada y sí ocupan.",
      ],
    },
    {
      heading: "Tus derechos",
      paragraphs: [
        "Puedes acceder a tus datos, corregirlos, borrarlos, oponerte a su tratamiento, limitarlo y pedir que te los entreguemos en un formato portable. Para lo más habitual no hace falta ni escribirnos:",
      ],
      bullets: [
        "Acceso y corrección: desde tu cuenta y tus listas, en cualquier momento.",
        "Supresión: hay un botón de borrar cuenta en la página de tu cuenta. Es inmediato y definitivo.",
        "Portabilidad: desde tu cuenta puedes descargar en un archivo JSON tus datos, tus listas y tu historial de productos.",
        "Para lo demás, escribe por LinkedIn (linkedin.com/in/farmaiant).",
      ],
    },
    {
      heading: "Reclamaciones",
      paragraphs: [
        "Si crees que no tratamos tus datos como debemos, cuéntanoslo primero a nosotros: lo normal es que se resuelva ahí. En todo caso tienes derecho a reclamar ante la Agencia Española de Protección de Datos (aepd.es).",
      ],
    },
    {
      heading: "Cambios en esta política",
      paragraphs: [
        "Si cambia algo relevante, actualizaremos esta página y la fecha de revisión. Si el cambio te afecta de verdad y tienes cuenta, te avisaremos por correo en vez de esperar a que lo descubras.",
      ],
    },
  ],
};

export const termsEs: LegalDocument = {
  slug: "terminos",
  title: "Términos de uso",
  metaTitle: "Términos de uso",
  metaDescription:
    "Las condiciones de uso de ListaSupermercado: qué puedes esperar del servicio y qué esperamos de quien lo usa.",
  updatedAt: "2026-08-11",
  blocks: [
    {
      heading: "Qué es este servicio",
      paragraphs: [
        "ListaSupermercado es una aplicación web gratuita para crear listas de la compra y compartirlas. Al usarla aceptas estas condiciones; si no estás de acuerdo con alguna, lo razonable es no usarla.",
        "El responsable del servicio es Antonio, y se le puede escribir por LinkedIn (linkedin.com/in/farmaiant).",
      ],
    },
    {
      heading: "Uso sin cuenta y con cuenta",
      paragraphs: [
        "Puedes usar la aplicación sin registrarte. En ese caso tu identidad vive en el navegador que estés usando: si borras sus datos o cambias de dispositivo, perderás el acceso a esas listas salvo que hayas guardado el enlace.",
        "Si creas una cuenta, tus listas dejan de depender de un navegador concreto. Eres responsable de mantener a salvo tu acceso: quien tenga tu correo o tu contraseña puede entrar.",
      ],
    },
    {
      heading: "Los enlaces compartidos",
      paragraphs: [
        "Compartir una lista significa exactamente eso: cualquiera que tenga el enlace puede verla y editarla, sin registrarse. No hay contraseña ni lista de invitados.",
        "Compártelo sólo con quien quieras que participe, y ten en cuenta que quien lo reciba puede reenviarlo. Si un enlace se te va de las manos, crea una lista nueva.",
      ],
    },
    {
      heading: "Qué no se puede hacer",
      paragraphs: ["Lo previsible, pero conviene dejarlo escrito:"],
      bullets: [
        "Usar el servicio para actividades ilegales o para almacenar contenido ilícito.",
        "Intentar acceder a listas ajenas, o hacer ingeniería inversa de los mecanismos de acceso.",
        "Automatizar el uso de forma que degrade el servicio para los demás.",
        "Suplantar a otra persona.",
      ],
    },
    {
      heading: "Disponibilidad y garantías",
      paragraphs: [
        "El servicio se ofrece tal cual y es gratuito. Ponemos cuidado en que funcione y en no perder datos, pero no podemos garantizar disponibilidad ininterrumpida ni ausencia de errores.",
        "Dicho claro: para una lista de la compra esto es razonable, pero no uses la aplicación como único sitio donde guardas algo que no puedas permitirte perder.",
      ],
    },
    {
      heading: "Precio",
      paragraphs: [
        "Crear, compartir y usar listas es gratis, y la intención es que siga siéndolo. Si en el futuro añadimos funciones de pago, serán opcionales y se anunciarán con claridad antes de cobrar nada.",
      ],
    },
    {
      heading: "Cancelación",
      paragraphs: [
        "Puedes dejar de usar el servicio cuando quieras y borrar tu cuenta desde la propia aplicación. Nosotros podemos suspender cuentas que incumplan estas condiciones, avisando cuando sea posible.",
      ],
    },
    {
      heading: "Ley aplicable",
      paragraphs: [
        "Estas condiciones se rigen por la legislación española. Para cualquier controversia, los juzgados competentes serán los del domicilio del consumidor cuando la ley así lo establezca.",
      ],
    },
  ],
};

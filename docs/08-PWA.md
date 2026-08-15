# PWA: instalación en iOS y en Android

Cómo está montada la instalación en móvil, qué es distinto en cada plataforma y cómo se comprueba
que sigue funcionando. Complementa `03-UX.md §6`, que fija el criterio de producto.

---

## 1. Lo que hace instalable a la app

| Pieza | Dónde | Para qué |
|---|---|---|
| Manifest | `src/app/manifest.ts` → `/manifest.webmanifest` | Nombre, iconos, `display: standalone`, atajos, capturas |
| Service worker | `public/sw.js` | Shell precacheado, página offline, push |
| Iconos | `public/icons/` | 192 y 512 normales + los dos *maskable* |
| Capturas | `public/screenshots/` | El diálogo grande de instalación de Chrome |
| Pantallas de arranque | `public/splash/` | Que iOS no arranque en blanco |
| Metadatos de Apple | `src/app/layout.tsx` (`appleWebApp`) | Que Safari abra sin barra de navegador |
| Banner | `src/components/providers/install-prompt-banner.tsx` | Ofrecerlo en la 2.ª visita |

Los binarios se generan con `node scripts/pwa-assets.mjs` y se commitean; no se regeneran en cada
build. Ver §5.

---

## 2. Android y escritorio (Chrome, Edge, Samsung Internet)

El navegador decide solo si la app es instalable y dispara `beforeinstallprompt`. Nuestro banner
lo intercepta, lo guarda y lo lanza cuando la persona pulsa «Instalar»; hasta que ese evento no
llega, **no se enseña ningún botón de instalar**, porque no habría nada que hacer al pulsarlo.

Criterios que Chrome exige, todos cubiertos:

- servido por HTTPS;
- manifest con `name`, `short_name`, `start_url`, `display: standalone` e icono de 512×512;
- un icono `purpose: "maskable"` (si no, Android pinta el icono dentro de un círculo blanco);
- service worker registrado con un manejador de `fetch`.

Además hay **capturas** (`screenshots`) con las dos formas, `narrow` y `wide`. Sin ellas Chrome
enseña una barrita gris al pie de la página en vez del diálogo de instalación con nombre, icono y
previsualización. Todas las `narrow` tienen que compartir proporción o Chrome las descarta
enteras; hay un test que lo comprueba (`src/app/manifest.test.ts`).

`launch_handler: navigate-existing` hace que tocar una notificación reutilice la ventana abierta en
vez de apilar copias de la misma lista.

---

## 3. iOS y iPadOS (Safari y los demás, que también son Safari por dentro)

**No existe `beforeinstallprompt` y no va a existir.** En iOS instalar es un gesto manual:
compartir → «Añadir a pantalla de inicio». Lo único que puede hacer una web es explicarlo, y eso
es exactamente lo que hace la hoja de instrucciones del banner. Cualquier «botón de instalar» que
se vea por ahí en un iPhone es eso: instrucciones con otro nombre.

Detalles que importan:

- **`apple-mobile-web-app-capable` / `mobile-web-app-capable`**: sin uno de los dos, la app abierta
  desde la pantalla de inicio sigue saliendo con la barra de Safari. Next emite el estándar a
  partir de `appleWebApp.capable`; el de Apple con prefijo se añade a mano en `other` para los
  iPhone anteriores a iOS 15.4.
- **`statusBarStyle: "default"`**: la hora y la batería se quedan en su franja, con fondo propio.
  Con `black-translucent` el contenido pasaría por debajo del notch y habría que rehacer todas las
  cabeceras con `env(safe-area-inset-top)`.
- **Pantallas de arranque**: Safari elige la imagen cuya media query encaja **exactamente** con el
  dispositivo —ancho, alto, densidad y orientación— y si no encaja ninguna arranca en blanco. La
  lista literal de modelos está en `src/lib/pwa/ios-splash.json`; añadir uno nuevo es seguro.
- **iPad**: desde iPadOS 13 dice ser un Mac en el user agent. Se distingue por `maxTouchPoints`
  (ver `src/lib/pwa/platform.ts`), o le enseñaríamos instrucciones de móvil a quien está en un
  portátil.
- **Navegadores incrustados** (Instagram, Facebook, TikTok): ahí no hay «añadir a pantalla de
  inicio», así que no se dan instrucciones para buscar un botón que no está.
- **Almacenamiento**: la app instalada en iOS tiene su propio almacenamiento, separado del de
  Safari. Quien tenga una lista abierta en el navegador y luego instale la app entra como visitante
  nuevo. Es de iOS, no nuestro; el enlace de la lista sigue funcionando igual.

---

## 4. Comprobarlo a mano

**Android**: Chrome → menú → «Añadir a pantalla de inicio». Debe salir el diálogo grande con la
captura. En `chrome://inspect/#devices` o desde DevTools → Application → Manifest se ven los
errores del manifest si los hay.

**iPhone**: Safari → compartir → «Añadir a pantalla de inicio». Al abrirla desde el icono no debe
verse la barra de direcciones, y el arranque debe ser verde con el logotipo, no blanco.

**Sin conexión**: instalar, abrir una lista, activar el modo avión y volver a abrir la app. Debe
verse la lista, no la página offline; los cambios se encolan y salen al recuperar la red.

---

## 5. Regenerar los binarios

Hace falta Chromium (el de Playwright vale) y, para las capturas, la app levantada:

```bash
node scripts/pwa-assets.mjs iconos     # icon-maskable-192 desde el de 512
node scripts/pwa-assets.mjs splash     # las 18 pantallas de arranque de iOS
pnpm build && pnpm start --port 3111
node scripts/pwa-assets.mjs capturas   # las capturas del diálogo de Android
```

Si el Chromium del sistema no es el que instala Playwright: `PLAYWRIGHT_CHROMIUM_PATH=/ruta/chrome`.

Cambiar los iconos obliga a subir `VERSION` en `public/sw.js`; si no, los dispositivos que ya
tienen la app siguen sirviendo los viejos desde su caché.

### El icono, y por qué es como es

Es el logotipo de la marca —la bolsa con el visto— en blanco sobre verde. Antes era el emoji 🛒:
un carrito **gris**, con la rejilla calada, sobre el verde de la marca. A tamaño de icono no se
distinguía nada, y encima no era el logotipo que usa la web.

El fondo es `--color-brand-400` (`#50bb6d`), un paso más claro que el `theme_color`. En la pantalla
de inicio, el verde de la marca se leía como casi negro; este respira. El `theme_color` sigue
siendo el oscuro: ese pinta la barra de estado, donde va mejor.

El logotipo ocupa el **64 %** en los iconos normales y el **50 %** en los *maskable*. Esa
diferencia es la razón de ser del maskable: Android lo recorta a la forma que use el fabricante
—círculo, cuadrado redondeado, gota— y sólo garantiza el 80 % central. Un logotipo a tamaño
completo perdería el asa de la bolsa en medio móvil.

---

## 7. Abrir los enlaces en la app instalada

Lo pide el manifest con `handle_links: "preferred"`, y el `scope` es `/`, así que **cualquier**
enlace del sitio entra. Lo que pasa después depende de la plataforma, y no es lo mismo en las tres:

| Dónde | Qué ocurre |
|---|---|
| **Android**, app instalada, enlace desde el navegador o de otra app | Android ofrece abrirlo con la app, o lo abre directamente si está puesto |
| **Android**, enlace **dentro de WhatsApp** | Se queda en el navegador interno de WhatsApp. **No lo controlamos** |
| **iPhone / iPad** | La app instalada **no puede** capturar enlaces. Punto |
| Escritorio (Chrome, Edge) | Abre en la app instalada |

Tres cosas que conviene tener claras, porque parecen fallos y no lo son:

**En Android hay que activarlo una vez.** Ajustes → Aplicaciones → ListaSupermercado → *Abrir
enlaces compatibles* (o *Abrir de forma predeterminada*) → activar el dominio. Android 12 en
adelante lo deja apagado por defecto para todas las apps, nativas incluidas. El manifest pide el
permiso; concederlo es del sistema.

**En WhatsApp, casi nunca.** WhatsApp abre los enlaces en su propio navegador incrustado, que no
es Chrome y no consulta a Android. Se puede desactivar en WhatsApp (Ajustes → Chats → *Usar
navegador interno*), pero es una decisión de quien recibe el enlace, no nuestra. Como
ListaSupermercado funciona igual desde el navegador —la lista se abre y se edita sin instalar
nada—, esto degrada bien: se ve la lista, sólo que en una pestaña.

**En iOS no hay forma.** Capturar enlaces en Apple son *Universal Links*, y exigen una app nativa
firmada con su `apple-app-site-association`. Una web instalada en la pantalla de inicio no puede
hacerlo, y no hay truco que lo consiga. Si algún día importa lo suficiente, la vía es empaquetar
con Capacitor (Fase 4 del backlog), no otra cosa en el manifest.

---

## 8. Lo que **no** se toca

- **`id` del manifest**. Es la identidad de la app para el navegador. Cambiarlo convierte la app ya
  instalada en otra distinta: quien la tuviera se queda con la vieja y se le ofrece instalar la
  nueva. Hay un test que lo fija.
- **El alcance del service worker**. Se sirve desde `/sw.js` porque su alcance es todo el sitio.
  Moverlo a una subcarpeta lo limita a esa subcarpeta.
- **Interceptar Supabase desde el service worker**. El comportamiento offline lo lleva el outbox
  (`src/lib/sync`). Cachear respuestas de datos ahí duplicaría la lógica y daría listas viejas.

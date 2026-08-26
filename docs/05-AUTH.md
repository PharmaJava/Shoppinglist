# Autenticación — Fase 2

Login por email, con o sin contraseña, y conversión de invitado a usuario
permanente **conservando el mismo `auth.uid()`** (ver `docs/00-PLAN.md` §2.2).

## 1. Las cuatro maneras

Se ofrecen todas y la persona elige; ninguna excluye a las otras sobre la
misma cuenta.

| Método | Cuándo conviene |
|---|---|
| **Google** | Un clic y nada que recordar. No hay correo que confirmar: Google ya lo confirmó. |
| **Enlace por correo** | Alta rápida sin contraseña. Es el que está seleccionado por defecto. |
| **Correo y contraseña** | Entrar sin depender del correo cada vez, y sin esperar a que llegue nada. |
| **Usuario y contraseña** | Lo mismo, pero tecleando `ana_87` en vez de `ana.perez.1987@gmail.com`. |

**El correo es obligatorio en las cuatro, y conviene entender por qué.**
Supabase identifica a la persona por su correo: es lo que permite confirmar la
cuenta, recuperar la contraseña y —cuando dos dispositivos entran a la misma
cuenta— saber que son la misma persona. El nombre de usuario **no sustituye al
correo**: es un alias más corto para entrar. Una cuenta, dos maneras de decir
quién eres.

Por eso el formulario de acceso tiene **un solo campo** para las dos, «correo o
usuario»: se distinguen por la arroba (`looksLikeEmail`), y obligar a acertar
la pestaña antes de escribir es un paso de más para algo que se deduce solo.

### 1.1 El nombre de usuario

Reglas, en `src/features/auth/username.ts` y repetidas en la migración 0016
—la base de datos es la autoridad, el cliente sólo adelanta el «no»—: de 3 a 20
caracteres, minúsculas, números y guion bajo. Se guarda normalizado, así que
`ANA_87` y `ana_87` son el mismo nombre y no pueden coexistir.

**Es opcional.** Quien no lo quiera se registra con su correo y no pierde nada.

**El correo de nadie sale a la web.** Entrar con el nombre exige traducirlo a
un correo, y esa traducción es lo único delicado de toda esta función: si se
hiciera en el navegador, cualquiera tendría un buscador de correos ajenos a
partir de nombres de usuario. Por eso:

- `email_for_username` (migración 0016) está **revocada de `anon` y de
  `authenticated`**, y además lleva guarda de rol por dentro.
- La traducción ocurre en `POST /api/auth/username`, en el servidor, con la
  clave de servicio. Lo único que vuelve al navegador es la sesión, en cookies.
- Esa ruta **no distingue** «ese usuario no existe» de «esa contraseña no es»:
  las dos dan el mismo 401. Distinguirlas la convertiría en un comprobador de
  qué nombres están registrados.

Lo único que sí se puede preguntar desde el navegador es si un nombre está
libre (`username_available`), porque sin eso no hay forma de darse de alta. Eso
revela que un nombre existe —inherente a tener nombres de usuario— pero no de
quién es.

### 1.2 Google

En el código son dos llamadas distintas y la diferencia importa:

| Quién pulsa | Qué se llama | Por qué |
|---|---|---|
| Alguien sin sesión | `signInWithOAuth` | Crea o recupera su cuenta de Google |
| Un **invitado** con listas | `linkIdentity` | Le añade Google **al usuario que ya es** |

Si a un invitado se le llamara `signInWithOAuth`, Supabase le crearía un
usuario nuevo con otro `auth.uid()` y **sus listas se quedarían en el
anterior**. `linkIdentity` es la misma promesa que se le hace al convertirlo
con correo: mismo UUID, mismas listas, cero migración.

Ambos vuelven por `/auth/callback`, que ya sabía canjear el `code` del flujo
PKCE: para el callback un `code` de Google es igual que uno de un enlace de
correo, así que no hubo que tocarlo.

## 2. Los tres estados

| Estado | Qué ve | Qué ocurre |
|---|---|---|
| Sin sesión | «Entra o crea tu cuenta» | Con enlace: `signInWithOtp` con `shouldCreateUser: true` — entrar y darse de alta son lo mismo. Con contraseña: `signInWithPassword`, o `signUp` si elige crear cuenta. |
| Invitado (`is_anonymous`) | «Guarda tus listas» | `updateUser({ email })` o `updateUser({ email, password })`. Añade credenciales al usuario anónimo existente: **mismo UUID, mismas listas, cero migración de datos**. |
| Registrado | Su correo y cerrar sesión | — |

El invitado sigue siendo anónimo hasta que confirma el correo. Si abandona a
medias no pierde nada: conserva su sesión de invitado y sus listas.

### Recuperación de contraseña

`resetPasswordForEmail` con destino `…/cuenta?recovery=1`. Ese `?recovery=1`
viaja dentro del `next` del callback porque con PKCE el enlace llega como un
`code` indistinguible del de cualquier otro correo: sin la marca, la página no
sabría que toca pedir una contraseña nueva en vez de dar la bienvenida.

## 3. Configuración en el panel de Supabase

Sin esto los enlaces del correo no funcionan.

### 3.1 Authentication → URL Configuration

**Site URL**

```
https://listasupermercado.com
```

**Redirect URLs** — una por línea:

```
https://listasupermercado.com/auth/callback
http://localhost:3000/auth/callback
https://*-pharmajava.vercel.app/auth/callback
```

La última cubre las *preview* de Vercel. El cliente construye la URL de retorno
con `window.location.origin`, así que cada despliegue vuelve a sí mismo sin
tocar configuración.

### 3.2 Authentication → Sign In / Providers

- **Anonymous sign-ins**: sigue **activado**. Es la identidad de invitado, no
  una alternativa al login.
- **Email**: activado, con *Confirm email* activado.
- **Minimum password length**: 6 por defecto en Supabase. La interfaz exige 8 y
  lo comprueba antes de llamar, para no gastar un viaje de red en un error
  evitable; subirlo también aquí a 8 cierra el hueco por si algún día se llama
  a la API desde fuera de la interfaz.

### 3.3 Google (Authentication → Sign In / Providers → Google)

Son dos paneles, y el orden importa porque el segundo necesita un dato del
primero.

**En Supabase**, activa el proveedor **Google**. Antes de rellenar nada, copia
la **Callback URL** que te enseña ahí mismo. Tiene esta forma:

```
https://<tu-proyecto>.supabase.co/auth/v1/callback
```

Ojo con esto, que es donde se atasca todo el mundo: **esa URL es de Supabase,
no de listasupermercado.com**. Google habla con Supabase, y Supabase después
devuelve a nuestra web. Poner aquí nuestra propia URL de callback no funciona.

**En Google Cloud Console** (`console.cloud.google.com`), con un proyecto
creado:

1. **APIs y servicios → Pantalla de consentimiento de OAuth.** Tipo
   **Externo**. Rellena nombre de la aplicación, correo de asistencia y el
   dominio (`listasupermercado.com`), y **enlaza la política de privacidad y
   los términos** —ya existen en `/privacidad` y `/terminos`, y Google los
   exige para publicar—. Mientras esté «en pruebas» sólo entran los correos
   que añadas a mano en *Usuarios de prueba*: para abrirlo a todo el mundo hay
   que pulsar **Publicar aplicación**.
2. **Credenciales → Crear credenciales → ID de cliente de OAuth**, tipo
   **Aplicación web**.
   - *Orígenes autorizados de JavaScript*: `https://listasupermercado.com`
   - *URIs de redirección autorizados*: **la Callback URL de Supabase** que
     copiaste arriba.
3. Google te da un **ID de cliente** y un **secreto de cliente**.

**De vuelta en Supabase**, pega esos dos en el proveedor Google y guarda. No
hay que tocar nada en Vercel: aquí no hay variables de entorno nuevas — las
credenciales viven en Supabase, que es quien habla con Google.

**Para que un invitado pueda enlazar Google sin perder sus listas** hace falta
además activar **Manual linking** (Authentication → Providers, al final de la
página). Sin eso, `linkIdentity` falla y un invitado con listas no puede usar
el botón de Google.

Y en **Redirect URLs** (§3.1) no hay que añadir nada nuevo: la vuelta de Google
pasa por `/auth/callback`, que ya está en la lista.

### 3.4 Authentication → Email Templates (opcional, recomendado)

Por defecto el enlace usa el flujo **PKCE**, que exige abrir el correo **en el
mismo navegador** que lo pidió — el *code verifier* vive en una cookie de ese
navegador. Es una limitación real: mucha gente pide el enlace en el portátil y
lo abre en el móvil, y ahí falla.

Para que funcione en cualquier dispositivo, cambia el enlace de las plantillas
**Magic Link** y **Change Email Address**:

```html
<!-- Magic Link -->
<a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=magiclink">Entrar</a>

<!-- Change Email Address (conversión de invitado a cuenta) -->
<a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email_change">Confirmar</a>

<!-- Confirm signup (alta con contraseña) -->
<a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=signup">Confirmar</a>

<!-- Reset Password -->
<a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=recovery">Cambiar contraseña</a>
```

`{{ .RedirectTo }}` ya es nuestra propia URL de callback con su `next`, así que
añadirle el token conserva el idioma y el destino. El route handler acepta las
dos formas, así que este cambio no rompe nada si se aplica a medias.

## 4. El callback

`src/app/auth/callback/route.ts`, fuera de `[locale]` porque su URL está
registrada en Supabase y debe resolver exacta, sin negociación de idioma
(excluida también en `src/proxy.ts`).

Acepta `code` (PKCE) y `token_hash` (verificación directa), traduce los errores
de Supabase a un parámetro `authError` que la página de cuenta muestra, y
**valida `next`**: sólo rutas internas. Sin esa comprobación sería un *open
redirect* con el que llevar a un usuario recién autenticado a un dominio ajeno.

## 5. Borrado de cuenta (RGPD)

`public.delete_own_account()`, SECURITY DEFINER, sin parámetros: actúa siempre
sobre `auth.uid()`, así que nadie puede borrar a otro. No hace falta Edge
Function ni `service_role`.

El borrado cascadea por las claves foráneas a perfil, listas propias,
membresías, invitaciones, historial y suscripción. **Consecuencia a tener
presente**: las listas de las que la persona es propietaria desaparecen también
para quienes las compartían. La interfaz lo advierte antes de confirmar.

## 6. Nombre visible

Vive en `profiles.display_name`, no en los metadatos de `auth.users`, porque
tiene que poder leerlo otra persona. La política `profiles_select_visible` lo
permite entre quienes comparten alguna lista — exactamente la gente que ya ve
tus productos.

## 7. Qué falta

- Google y Apple con `linkIdentity()`, que convierte al invitado igual que el
  email.
- Transferir la propiedad de una lista antes de borrar la cuenta, para que una
  lista familiar sobreviva a que su creador se dé de baja.

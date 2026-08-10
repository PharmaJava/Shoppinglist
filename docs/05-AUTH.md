# Autenticación — Fase 2

Login por email, con o sin contraseña, y conversión de invitado a usuario
permanente **conservando el mismo `auth.uid()`** (ver `docs/00-PLAN.md` §2.2).

## 1. Los dos métodos

Se ofrecen ambos y la persona elige; ninguno excluye al otro sobre la misma
cuenta.

| Método | Cuándo conviene |
|---|---|
| **Enlace por correo** | Alta más rápida, nada que recordar. Es el que está seleccionado por defecto. |
| **Contraseña** | Entrar sin depender del correo cada vez, y sin esperar a que llegue nada. |

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

### 3.3 Authentication → Email Templates (opcional, recomendado)

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

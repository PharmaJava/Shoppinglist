# Autenticación — Fase 2

Login por email sin contraseña, con conversión de invitado a usuario permanente
**conservando el mismo `auth.uid()`** (ver `docs/00-PLAN.md` §2.2).

## 1. Los tres estados

| Estado | Qué ve | Qué ocurre al enviar el correo |
|---|---|---|
| Sin sesión | «Entra o crea tu cuenta» | `signInWithOtp` con `shouldCreateUser: true`. No hay pantalla de registro separada: entrar y darse de alta son lo mismo. |
| Invitado (`is_anonymous`) | «Guarda tus listas» | `updateUser({ email })`. Añade un email al usuario anónimo existente: **mismo UUID, mismas listas, cero migración de datos**. |
| Registrado | Su correo y cerrar sesión | — |

El invitado sigue siendo anónimo hasta que confirma el correo. Si abandona a
medias no pierde nada: conserva su sesión de invitado y sus listas.

## 2. Configuración en el panel de Supabase

Sin esto los enlaces del correo no funcionan.

### 2.1 Authentication → URL Configuration

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

### 2.2 Authentication → Sign In / Providers

- **Anonymous sign-ins**: sigue **activado**. Es la identidad de invitado, no
  una alternativa al login.
- **Email**: activado, con *Confirm email* activado.

### 2.3 Authentication → Email Templates (opcional, recomendado)

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
```

`{{ .RedirectTo }}` ya es nuestra propia URL de callback con su `next`, así que
añadirle el token conserva el idioma y el destino. El route handler acepta las
dos formas, así que este cambio no rompe nada si se aplica a medias.

## 3. El callback

`src/app/auth/callback/route.ts`, fuera de `[locale]` porque su URL está
registrada en Supabase y debe resolver exacta, sin negociación de idioma
(excluida también en `src/proxy.ts`).

Acepta `code` (PKCE) y `token_hash` (verificación directa), traduce los errores
de Supabase a un parámetro `authError` que la página de cuenta muestra, y
**valida `next`**: sólo rutas internas. Sin esa comprobación sería un *open
redirect* con el que llevar a un usuario recién autenticado a un dominio ajeno.

## 4. Qué falta

- Google y Apple con `linkIdentity()`, que convierte al invitado igual que el
  email.
- Dashboard multi-lista, ahora que una cuenta puede tener varias en varios
  dispositivos.
- Borrado de cuenta (RGPD): `auth.users` cascadea a todo lo demás, así que es
  una Edge Function con `service_role`.

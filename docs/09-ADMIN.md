# Panel de administración (`/vegeta`)

Un cuadro de mando con las métricas del producto. Una sola persona entra, no hay roles ni usuarios
de administración en la base de datos, y no se ve el contenido de las listas de nadie.

---

## 1. Puesta en marcha

Tres variables de entorno **de servidor** (ninguna lleva `NEXT_PUBLIC_`, y eso no es un detalle:
es lo que garantiza que Next no las meta en el paquete que descarga el navegador).

```bash
ADMIN_EMAIL=tu@correo.com
ADMIN_PASSWORD_HASH=scrypt$32768$8$1$…      # lo genera el comando de abajo
SUPABASE_SERVICE_ROLE_KEY=eyJ…              # Supabase → Project Settings → API
```

El hash se saca así, y **la contraseña en claro no se guarda en ningún sitio**:

```bash
pnpm admin:hash                 # la pide sin mostrarla al teclear
pnpm admin:hash 'contraseña'    # o directamente, si no importa el historial
```

Copia la línea que imprime en Vercel → Settings → Environment Variables (Production), y en
`.env.local` para desarrollo. Después, **redespliega**: las variables de entorno se leen al
arrancar.

Falta un paso más: aplicar las migraciones `0007_admin_kpis.sql` y `0009_admin_kpis_definer.sql`
en el editor SQL de Supabase. Sin ella el panel deja entrar pero avisa de que la función no existe. `pnpm db:check`
imprime una consulta que dice qué migraciones faltan.

### Cambiar la contraseña

Se genera un hash nuevo y se sustituye la variable. No hay nada más que hacer: la firma de la
cookie de sesión se deriva del hash, así que al cambiarlo **todas las sesiones abiertas dejan de
valer** sin llevar ningún registro de sesiones.

---

## 2. Cómo está protegido

| | |
|---|---|
| Contraseña | scrypt (N=2^15, r=8, p=1), sal aleatoria, comparación en tiempo constante |
| Sesión | Cookie `vegeta_sesion`, `httpOnly` + `SameSite=Strict` + `Secure`, `path=/vegeta`, 8 h |
| Firma | HMAC-SHA256 con clave derivada del hash de la contraseña |
| Fuerza bruta | 10 fallos por IP → 15 minutos de bloqueo |
| Fugas por mensaje | Correo incorrecto y contraseña incorrecta dan **el mismo** error |
| Fugas por tiempo | La contraseña se comprueba aunque el correo no cuadre |
| Indexación | `noindex` en metadatos y `Disallow: /vegeta` en robots.txt |

Dos decisiones que conviene entender:

**La contraseña se compara en el servidor, en una Server Action.** Viaja en el cuerpo de un POST
por HTTPS y muere ahí. El formulario del navegador no sabe nada: sólo sabe enviar, y se entera de
si ha acertado porque el servidor se lo dice. Hay una prueba e2e que descarga *todo* el JavaScript
de la página y busca dentro la contraseña, su hash y el nombre de las variables.

**`robots.txt` no protege nada.** Es una petición educada a los buscadores; cualquiera puede leer
el archivo y enterarse de que la ruta existe. Lo que protege el panel es la contraseña. La ruta se
llama `/vegeta` y no `/admin` por comodidad, no por seguridad.

---

## 3. De dónde salen los números

Una única función de Postgres, `public.admin_kpis(dias)`, devuelve el panel entero en un `jsonb`.
Podrían ser veinte consultas desde el servidor, pero serían veinte viajes a Supabase por cada carga.

La función es **`SECURITY DEFINER`** y sólo se le concede a `service_role`. Además comprueba el rol
del JWT y se niega a responder a quien no sea `service_role`, así que un `grant execute` accidental
a `authenticated` —basta un `grant execute on all functions in schema public`— sigue sin abrir
nada. Comprobado: con `EXECUTE` concedido a mano, la llamada falla igual.

### Por qué DEFINER, después de haber elegido INVOKER

Nació como `SECURITY INVOKER` a propósito, para que ningún `GRANT` futuro pudiera convertirla en
una fuga. La premisa era falsa: **`service_role` no puede leer `auth.users`**. Esa tabla pertenece
a `supabase_auth_admin`, y la clave de servicio llega a los usuarios por la Admin API, no por SQL.
Siendo INVOKER, la función se ejecutaba con los permisos de quien llamaba y el panel respondía
`permission denied for table users`.

Se había verificado en local contra un PostgreSQL 16 y pasó **porque el stub de pruebas le había
concedido ese permiso a `service_role` "para parecerse a Supabase"**. Se parecía en todo menos en
lo que importaba. Si se vuelve a montar un Postgres para probar migraciones, `service_role` no debe
tener `select` sobre `auth.users`: con ese permiso, la prueba deja de probar nada.

Lo arregla la migración `0009_admin_kpis_definer.sql`.

La clave de servicio se lee en `src/lib/admin/kpis.ts`, que es servidor puro. Es la única forma de
contar las listas de todo el mundo: con la clave pública, RLS sólo dejaría ver las del
administrador, que son ninguna.

### Lo que el panel **no** enseña

Ni títulos de listas, ni nombres de productos de una lista concreta, ni correos, ni nombres de
usuario. El ranking de productos son nombres agregados de todo el sistema, sin decir de quién.
El panel es para medir el producto, no para leer la compra de nadie — y eso está alineado con lo
que dice la política de privacidad.

---

## 4. Qué mide

**Las cuatro del plan** (`00-PLAN.md §1`), con su objetivo al lado:

| Métrica | Cómo se calcula | Objetivo |
|---|---|---|
| Activación | Personas con al menos una lista de ≥3 productos, sobre el total | > 25 % |
| Viralidad (K) | Miembros que no son propietarios ÷ listas creadas | > 1,2 |
| Retención D7 | De quien se dio de alta hace ≥7 días, quién tuvo actividad 7 días después | > 20 % |
| Colaboración | Listas con 2 personas o más, sobre el total | > 35 % |

La quinta —LCP móvil— no sale de la base de datos: está en Vercel Speed Insights.

**El resto**: activos 24 h/7 d/30 d y adherencia (diarios sobre mensuales) · altas, listas y
productos de los últimos 7 días contra los 7 anteriores · series diarias de altas, listas,
productos y personas activas · totales de personas (con cuenta frente a invitados, y la conversión
entre ambos), listas, productos, marcados, con precio, sin categoría · reparto de listas por número
de productos —incluidas las **vacías**, que son la fuga más cara— y por número de personas ·
invitaciones creadas, usadas, canjeadas, revocadas · presupuestos, valor de las cestas y precio
medio · idioma, plan y avisos push · tamaño del catálogo e historial · ranking de los 20 productos
y 15 categorías más usados.

«Activo» significa haber tocado una lista, añadido un producto o marcado algo.

---

## 5. Cosas que sorprenden si no se saben

- **El panel está sólo en español.** Lo mira una persona; traducirlo sería duplicar cien cadenas
  para nadie.
- **`/vegeta` no lleva prefijo de idioma.** Está declarado como ruta de app en `src/proxy.ts`: si
  `next-intl` lo llevara a `/es/vegeta`, la cookie —que tiene `path=/vegeta`— quedaría fuera de
  alcance y no habría forma de entrar.
- **El límite de intentos vive en memoria.** En Vercel eso significa por instancia, y se pierde en
  cada despliegue. Frena a quien prueba contraseñas desde una pestaña, no a un ataque distribuido;
  contra eso está scrypt.
- **En un proyecto recién estrenado, los porcentajes son ruido.** Con doce usuarios, una activación
  del 100 % no dice nada. Los números empiezan a significar algo con unos cientos.

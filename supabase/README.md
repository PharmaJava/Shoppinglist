# Base de datos

Las migraciones se aplican **a mano** en el editor SQL de Supabase: no hay CLI
conectada al proyecto. Eso significa que nada garantiza por sí solo que lo del
repositorio y lo de producción coincidan, así que hay un registro para saberlo.

## Saber qué falta por aplicar

```bash
pnpm db:check
```

Imprime una consulta lista para pegar en el editor SQL. Devuelve una fila por
migración con su estado:

| version | estado | applied_at |
|---|---|---|
| `0001_baseline` | aplicada | 2026-08-11 … |
| `0003_lo_que_sea` | **PENDIENTE** | — |

Las `PENDIENTE` se ejecutan en orden de versión, copiando el archivo entero.

La lista de versiones esperadas sale de los archivos que hay en
`supabase/migrations/`, no de un índice escrito a mano: añadir un archivo basta
para que aparezca en la comprobación. No hay nada que mantener sincronizado.

## Aplicar una migración

1. Abre el archivo de `supabase/migrations/` completo.
2. Pégalo entero en el editor SQL y ejecútalo.
3. Cada migración se registra sola al final. Vuelve a lanzar `pnpm db:check`
   para confirmarlo.

> Pégalo **entero**. El editor trata el bloque como una transacción, así que un
> error a mitad deshace todo lo anterior — ejecutar por trozos deja la base en
> un estado intermedio difícil de diagnosticar.

## Escribir una migración nueva

Numeración correlativa y descripción corta: `0003_precio_por_producto.sql`.

Dos reglas:

**Idempotente siempre.** `create table if not exists`, `drop policy if exists`
antes de `create policy`, `create or replace function`. Nunca se sabe si una
migración se quedó a medias, y poder relanzarla sin miedo es lo que evita
tener que averiguarlo.

**Se registra a sí misma**, como última línea:

```sql
insert into public.schema_migrations (version) values ('0003_precio_por_producto')
on conflict (version) do nothing;
```

Sin esa línea la migración no aparecerá como aplicada y `pnpm db:check` seguirá
pidiéndola.

## Por qué el histórico empieza en 0001

Antes había seis archivos, y entre ellos una reparación de RLS que duplicaba el
esquema inicial y una función de depuración que otra migración ya borraba. El
histórico completo describía cómo se llegó hasta aquí, no qué hay ahora, y para
auditar la base servía de poco.

`0001_baseline.sql` es el estado completo y es idempotente: se puede ejecutar
sobre una base vacía o sobre producción sin romper nada. A partir de aquí, un
archivo por cambio.

El histórico sigue en el registro de git para quien quiera reconstruir el
camino.

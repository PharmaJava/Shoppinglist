#!/usr/bin/env node
import { readdir } from "node:fs/promises";
import { join } from "node:path";

/**
 * Imprime una consulta lista para pegar en el editor SQL de Supabase que dice
 * qué migraciones faltan por aplicar.
 *
 * Existe porque las migraciones se aplican a mano: no hay CLI conectada al
 * proyecto, así que nada garantiza que lo del repositorio y lo de producción
 * coincidan. La lista de versiones esperadas se deriva de los archivos que hay
 * en disco, así que no hay un índice que mantener al día — añadir un archivo
 * basta para que aparezca en la comprobación.
 */

const MIGRATIONS_DIR = join(import.meta.dirname, "..", "supabase", "migrations");

const versions = (await readdir(MIGRATIONS_DIR))
  .filter((file) => file.endsWith(".sql"))
  .map((file) => file.replace(/\.sql$/, ""))
  .sort();

if (versions.length === 0) {
  console.error("No hay migraciones en supabase/migrations.");
  process.exit(1);
}

const values = versions.map((version) => `    ('${version}')`).join(",\n");

console.log(`
-- Pega esto en el editor SQL de Supabase.
-- Dice qué migraciones de supabase/migrations/ faltan por aplicar.

with esperadas (version) as (
  values
${values}
)
select
  e.version,
  case when m.version is null then 'PENDIENTE' else 'aplicada' end as estado,
  m.applied_at
from esperadas e
left join public.schema_migrations m using (version)
order by e.version;
`);

console.error(
  `${versions.length} migración(es) en el repositorio: ${versions.join(", ")}\n` +
    "Las marcadas PENDIENTE hay que ejecutarlas, en orden de versión.",
);

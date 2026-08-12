import { anchoBarra, cuota, numero, porcentaje } from "@/lib/admin/format";

export interface Fila {
  nombre: string;
  veces: number;
}

/** Ranking con barra proporcional: la lista ordenada más la forma de un vistazo. */
export function BarList({
  titulo,
  filas,
  vacio = "Todavía no hay datos.",
}: {
  titulo: string;
  filas: Fila[];
  vacio?: string;
}) {
  const maximo = Math.max(...filas.map((fila) => fila.veces), 0);
  const total = filas.reduce((suma, fila) => suma + fila.veces, 0);

  return (
    <section className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
      <h3 className="text-xs font-medium uppercase tracking-wide text-on-surface-muted">
        {titulo}
      </h3>

      {filas.length === 0 ? (
        <p className="text-sm text-on-surface-muted">{vacio}</p>
      ) : (
        <ol className="flex flex-col gap-2">
          {filas.map((fila) => (
            <li key={fila.nombre} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate text-on-surface first-letter:uppercase">
                  {fila.nombre}
                </span>
                <span className="shrink-0 tabular-nums text-on-surface-muted">
                  {numero(fila.veces)}
                  <span className="ml-1 text-xs">({porcentaje(cuota(fila.veces, total))})</span>
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-surface-muted">
                <div
                  className="h-full rounded-full bg-brand"
                  style={{ width: anchoBarra(fila.veces, maximo) }}
                />
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

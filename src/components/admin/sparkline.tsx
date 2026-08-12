import { diaCorto, numero, puntosSparkline } from "@/lib/admin/format";

const ANCHO = 300;
const ALTO = 64;

/**
 * Minigráfica en SVG puro, sin librería de gráficas.
 *
 * Son cuatro series de treinta puntos: meter 40 kB de JavaScript para dibujar
 * eso, en una página que además sólo mira una persona, no se sostiene.
 */
export function Sparkline({
  titulo,
  serie,
  etiquetas,
  total,
  resumen = "en el periodo",
}: {
  titulo: string;
  serie: number[];
  etiquetas: string[];
  total: number;
  /** Qué es el número grande. Las altas se suman; las personas activas no. */
  resumen?: string;
}) {
  const puntos = puntosSparkline(serie, ANCHO, ALTO);
  const maximo = Math.max(...serie, 0);
  const primera = etiquetas[0];
  const ultima = etiquetas[etiquetas.length - 1];

  return (
    <figure className="flex flex-col gap-2 rounded-card border border-border bg-surface p-4">
      <figcaption className="flex items-baseline justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-wide text-on-surface-muted">
          {titulo}
        </span>
        <span className="text-sm font-semibold tabular-nums text-on-surface">{numero(total)}</span>
      </figcaption>

      <svg
        viewBox={`0 0 ${ANCHO} ${ALTO}`}
        preserveAspectRatio="none"
        className="h-16 w-full"
        role="img"
        aria-label={`${titulo}: ${numero(total)} ${resumen}, máximo diario ${numero(maximo)}`}
      >
        <polyline
          points={puntos}
          fill="none"
          stroke="var(--brand)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <div className="flex justify-between text-[0.65rem] text-on-surface-muted">
        <span>{primera ? diaCorto(primera) : ""}</span>
        <span>máx. {numero(maximo)}/día</span>
        <span>{ultima ? diaCorto(ultima) : ""}</span>
      </div>
    </figure>
  );
}

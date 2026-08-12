export function numero(valor: number): string {
  return new Intl.NumberFormat("es-ES").format(valor);
}

/**
 * Un número con decimales, con coma. `toFixed()` no vale: siempre pone punto,
 * y «0.30» en un panel en español canta.
 */
export function decimal(valor: number, decimales = 2): string {
  return new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(valor);
}

export function porcentaje(valor: number, decimales = 1): string {
  return `${new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimales,
  }).format(valor)} %`;
}

export function euros(centimos: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: centimos % 100 === 0 ? 0 : 2,
  }).format(centimos / 100);
}

export interface Variacion {
  /** Cambio porcentual respecto al periodo anterior. */
  pct: number;
  sentido: "sube" | "baja" | "igual" | "nuevo";
  etiqueta: string;
}

/**
 * Comparar un periodo con el anterior.
 *
 * El caso de «antes 0, ahora algo» no es un aumento infinito ni un 100 %: es
 * que antes no había nada. Se marca aparte porque pintar «+∞ %» en un panel
 * no informa de nada.
 */
export function variacion(actual: number, previo: number): Variacion {
  if (previo === 0 && actual === 0) return { pct: 0, sentido: "igual", etiqueta: "igual" };
  if (previo === 0) return { pct: 0, sentido: "nuevo", etiqueta: "nuevo" };

  const pct = ((actual - previo) / previo) * 100;
  const redondeado = Math.round(pct * 10) / 10;

  if (redondeado === 0) return { pct: 0, sentido: "igual", etiqueta: "igual" };

  return {
    pct: redondeado,
    sentido: redondeado > 0 ? "sube" : "baja",
    etiqueta: `${redondeado > 0 ? "+" : ""}${new Intl.NumberFormat("es-ES", {
      maximumFractionDigits: 1,
    }).format(redondeado)} %`,
  };
}

/**
 * Puntos de una minigráfica, en coordenadas SVG.
 *
 * El eje Y siempre arranca en cero: escalar al mínimo de la serie convierte
 * una variación de dos unidades en un acantilado y hace que el panel mienta.
 */
export function puntosSparkline(valores: number[], ancho: number, alto: number): string {
  if (valores.length === 0) return "";
  if (valores.length === 1) return `0,${alto} ${ancho},${alto}`;

  const maximo = Math.max(...valores, 1);
  const paso = ancho / (valores.length - 1);

  return valores
    .map((valor, indice) => {
      const x = Math.round(indice * paso * 100) / 100;
      const y = Math.round((alto - (valor / maximo) * alto) * 100) / 100;
      return `${x},${y}`;
    })
    .join(" ");
}

/** Anchura de una barra en porcentaje, con un mínimo visible si no es cero. */
export function anchoBarra(valor: number, maximo: number): string {
  if (maximo <= 0 || valor <= 0) return "0%";
  return `${Math.max(2, Math.round((valor / maximo) * 100))}%`;
}

/** Fecha corta para el eje de las gráficas: «14 ago». */
export function diaCorto(iso: string): string {
  const fecha = new Date(`${iso}T00:00:00Z`);
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(fecha);
}

/**
 * Cuánta parte del todo es esto, para las líneas de «X de Y». Devuelve 0 si no
 * hay todo, en vez de `NaN`, que es lo que sale de dividir entre cero y lo que
 * se acaba viendo en pantalla.
 */
export function cuota(parte: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((parte / total) * 1000) / 10;
}

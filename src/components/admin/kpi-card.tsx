import type { ReactNode } from "react";
import { decimal, porcentaje, type Variacion } from "@/lib/admin/format";

/**
 * Objetivo de una métrica del plan (00-PLAN.md §1). Se pinta al lado del
 * valor: un número suelto no dice si va bien; «26 %» sobre «objetivo 25 %»
 * sí.
 */
export interface Objetivo {
  valor: number;
  sentido: "mayor" | "menor";
  /** Cómo se escribe: «25 %» o «1,2». */
  unidad: "porcentaje" | "numero";
}

function cumple(actual: number, objetivo: Objetivo): boolean {
  return objetivo.sentido === "mayor" ? actual >= objetivo.valor : actual <= objetivo.valor;
}

export function KpiCard({
  etiqueta,
  valor,
  pie,
  variacion,
  objetivo,
  actual,
  destacado,
}: {
  etiqueta: string;
  valor: ReactNode;
  pie?: ReactNode;
  variacion?: Variacion;
  /** El objetivo del plan, si esta métrica tiene uno. */
  objetivo?: Objetivo;
  /** El valor numérico para comparar con el objetivo. */
  actual?: number;
  destacado?: boolean;
}) {
  const cumplido = objetivo && actual !== undefined ? cumple(actual, objetivo) : null;

  return (
    <div
      className={`flex flex-col gap-1 rounded-card border p-4 ${
        destacado ? "border-brand/40 bg-brand/5" : "border-border bg-surface"
      }`}
    >
      <span className="text-xs font-medium uppercase tracking-wide text-on-surface-muted">
        {etiqueta}
      </span>
      <span className="text-2xl font-bold tabular-nums text-on-surface">{valor}</span>

      {objetivo && actual !== undefined && (
        <span
          className={`text-xs font-medium ${cumplido ? "text-brand" : "text-on-surface-muted"}`}
        >
          {cumplido ? "✓" : "○"} objetivo {objetivo.sentido === "mayor" ? "≥" : "≤"}{" "}
          {objetivo.unidad === "porcentaje"
            ? porcentaje(objetivo.valor, 0)
            : decimal(objetivo.valor, 1)}
        </span>
      )}

      {variacion && (
        <span
          className={`text-xs font-medium ${
            variacion.sentido === "sube"
              ? "text-brand"
              : variacion.sentido === "baja"
                ? "text-accent"
                : "text-on-surface-muted"
          }`}
        >
          {variacion.etiqueta} vs. 7 días antes
        </span>
      )}

      {pie && <span className="text-xs text-on-surface-muted">{pie}</span>}
    </div>
  );
}

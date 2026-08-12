import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { Kpis } from "@/lib/admin/kpis";
import fixture from "@/lib/admin/kpis.fixture.json";
import { Dashboard } from "./dashboard";

/**
 * El fixture no está inventado: es la salida literal de `public.admin_kpis(30)`
 * ejecutada contra un Postgres con el esquema del repositorio y datos de
 * prueba. Así el tipo `Kpis` y el SQL no se pueden separar en silencio — si
 * alguien cambia el nombre de una clave en la migración, aquí revienta.
 */
const kpis = fixture as unknown as Kpis;

afterEach(cleanup);

describe("Dashboard", () => {
  it("dibuja el panel entero sin romperse con datos reales", () => {
    render(<Dashboard kpis={kpis} />);

    for (const seccion of [
      "Las métricas del plan",
      "Ahora mismo",
      "Crecimiento",
      "Totales",
      "Cómo son las listas",
      "Invitaciones",
      "Presupuesto y precios",
      "Idioma, avisos y catálogo",
      "Qué se compra",
    ]) {
      expect(screen.getByRole("heading", { name: new RegExp(seccion, "i") })).toBeInTheDocument();
    }
  });

  it("enseña las cuatro métricas del plan con su objetivo", () => {
    render(<Dashboard kpis={kpis} />);

    expect(screen.getByText("Activación")).toBeInTheDocument();
    expect(screen.getByText("Viralidad (K)")).toBeInTheDocument();
    expect(screen.getByText("Retención D7")).toBeInTheDocument();
    expect(screen.getByText("Colaboración")).toBeInTheDocument();
    // «objetivo ≥», con el símbolo: sin él también cuenta la frase de la
    // cabecera de la sección, que habla de objetivos pero no es uno.
    expect(screen.getAllByText(/objetivo ≥/).length).toBe(4);
  });

  it("los porcentajes salen a la española, no en notación de máquina", () => {
    render(<Dashboard kpis={kpis} />);

    expect(screen.getAllByText(/\d+([.,]\d+)? %/).length).toBeGreaterThan(5);
    expect(screen.queryByText(/NaN|Infinity|undefined/)).not.toBeInTheDocument();
  });

  it("el ranking de productos sale ordenado de más a menos", () => {
    render(<Dashboard kpis={kpis} />);

    const primero = kpis.tops.productos[0];
    expect(primero).toBeDefined();
    expect(screen.getByText(primero?.nombre ?? "")).toBeInTheDocument();
  });

  /**
   * El caso del primer día: base de datos recién estrenada. Todas las
   * divisiones son entre cero y todas las series están vacías — es justo
   * cuando el panel se mira por primera vez, y sería absurdo que fuera lo
   * único que no funciona.
   */
  it("con la base de datos vacía no sale ni un NaN", () => {
    const vacio = JSON.parse(
      JSON.stringify(kpis, (_clave, valor) => (typeof valor === "number" ? 0 : valor)),
    ) as Kpis;
    vacio.series = [];
    vacio.tops.productos = [];
    vacio.tops.categorias = [];

    render(<Dashboard kpis={vacio} />);

    expect(screen.queryByText(/NaN|Infinity|undefined/)).not.toBeInTheDocument();
    expect(screen.getAllByText("Todavía no hay datos.").length).toBe(2);
  });
});

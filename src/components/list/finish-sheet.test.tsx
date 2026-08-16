import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { List, ListItem } from "@/features/list/types";
import messages from "@/i18n/messages/es.json";
import { FinishSheet } from "./finish-sheet";

/**
 * `PremiumGate` acaba importando el cliente de Supabase, que exige sus
 * variables de entorno nada más cargarse. Aquí no se prueba el plan, sólo que
 * la hoja de finalizar hace lo suyo — mismo motivo por el que
 * `share-sheet.test.tsx` sustituye el interruptor de avisos.
 */
const fetchPlan = vi.fn(async () => "free" as "free" | "premium");
vi.mock("@/features/billing/plan", () => ({ fetchPlan: () => fetchPlan() }));

const lista = { id: "l1", title: "Compra", archived_at: null } as List;

// Por defecto se monta como miembro, no como dueño: así cada prueba dice a
// las claras cuál de los dos finales está mirando.

function item(name: string): ListItem {
  return { id: name, name } as ListItem;
}

function montar(props: Partial<React.ComponentProps<typeof FinishSheet>> = {}) {
  const onConfirmar = vi.fn(async () => {});
  const onCerrar = vi.fn();

  render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <FinishSheet
        list={lista}
        pendientes={[item("Pan")]}
        marcados={[item("Leche"), item("Huevos")]}
        puedeBorrar={false}
        onCerrar={onCerrar}
        onConfirmar={onConfirmar}
        {...props}
      />
    </NextIntlClientProvider>,
  );

  return { onConfirmar, onCerrar };
}

afterEach(cleanup);

describe("FinishSheet", () => {
  it("resume cómo ha ido la compra", () => {
    montar();

    expect(screen.getByText("2 de 3 en el carro")).toBeInTheDocument();
  });

  /**
   * La última oportunidad de darse cuenta de que falta el pan es justo antes
   * de salir del supermercado, no en el aparcamiento.
   */
  it("avisa de lo que queda sin marcar, y con nombres", () => {
    montar();

    expect(screen.getByText("Queda 1 sin marcar")).toBeInTheDocument();
    expect(screen.getByText("Pan")).toBeInTheDocument();
  });

  it("si está todo marcado no da la matraca con lo pendiente", () => {
    montar({ pendientes: [] });

    expect(screen.queryByText(/sin marcar/)).not.toBeInTheDocument();
  });

  // Se pregunta en vez de decidir: hay quien repite la lista cada semana y
  // hay quien la da por cerrada. Elegir por ellos falla con la mitad.
  it.each([
    ["Dejar la lista como está", "nada"],
    ["Quitar los 2 comprados", "vaciar"],
    ["Archivar la lista", "archivar"],
  ])("«%s» confirma con la acción «%s»", async (etiqueta, accion) => {
    const { onConfirmar } = montar();

    await userEvent.click(screen.getByRole("button", { name: etiqueta }));
    expect(onConfirmar).toHaveBeenCalledWith(accion);
  });

  /**
   * La compra se acabó y la lista con ella: al dueño se le ofrece borrarla,
   * que es lo que deja sitio para la siguiente en vez de acumular listas
   * viejas.
   */
  it("al dueño le ofrece borrarla, no archivarla", async () => {
    const { onConfirmar } = montar({ puedeBorrar: true });

    expect(screen.queryByRole("button", { name: "Archivar la lista" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Borrar la lista" }));
    expect(onConfirmar).toHaveBeenCalledWith("borrar");
  });

  it("y avisa de que se borra para todos", () => {
    montar({ puedeBorrar: true });

    expect(screen.getByText(/Se borra para todos/)).toBeInTheDocument();
  });

  /**
   * Borrar una lista ajena lo impide RLS (migración 0001), así que a quien
   * sólo es miembro no se le enseña un botón que no puede funcionar.
   */
  it("a quien no es el dueño no le ofrece borrar", () => {
    montar();

    expect(screen.queryByRole("button", { name: "Borrar la lista" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Archivar la lista" })).toBeInTheDocument();
  });

  /**
   * Sin esto, un borrado fallido —sin cobertura, o de una lista que no es
   * tuya— dejaba la hoja congelada como si estuviera trabajando.
   */
  it("si la acción falla lo dice y deja volver a intentarlo", async () => {
    const onConfirmar = vi.fn(async () => {
      throw new Error("Sólo quien creó la lista puede borrarla.");
    });
    montar({ puedeBorrar: true, onConfirmar });

    await userEvent.click(screen.getByRole("button", { name: "Borrar la lista" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Sólo quien creó la lista puede borrarla.",
    );
    expect(screen.getByRole("button", { name: "Borrar la lista" })).toBeEnabled();
  });

  it("sin nada marcado no ofrece quitar lo comprado", () => {
    montar({ marcados: [] });

    expect(screen.queryByRole("button", { name: /Quitar/ })).not.toBeInTheDocument();
  });

  it("una lista ya archivada no se ofrece archivar otra vez", () => {
    montar({ list: { ...lista, archived_at: "2026-08-01T00:00:00Z" } as List });

    expect(screen.queryByRole("button", { name: "Archivar la lista" })).not.toBeInTheDocument();
  });

  it("«seguir comprando» cierra sin tocar nada", async () => {
    const { onCerrar, onConfirmar } = montar();

    await userEvent.click(screen.getByRole("button", { name: "Seguir comprando" }));
    expect(onCerrar).toHaveBeenCalled();
    expect(onConfirmar).not.toHaveBeenCalled();
  });

  /**
   * La despensa es de la Fase 3 y va apagada: con el interruptor sin poner
   * —que es como está en producción— el botón no puede aparecer aquí.
   */
  it("con la Fase 3 apagada no ofrece guardar en la despensa", () => {
    montar();

    expect(screen.queryByRole("button", { name: /despensa/i })).not.toBeInTheDocument();
  });
});

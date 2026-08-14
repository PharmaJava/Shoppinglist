import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { List, ListItem } from "@/features/list/types";
import messages from "@/i18n/messages/es.json";
import { FinishSheet } from "./finish-sheet";

const lista = { id: "l1", title: "Compra", archived_at: null } as List;

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
});

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { WakeLockState } from "@/features/list/use-wake-lock";
import messages from "@/i18n/messages/es.json";
import { ShoppingBar } from "./shopping-bar";

function montar(props: Partial<React.ComponentProps<typeof ShoppingBar>> = {}) {
  const onEmpezar = vi.fn();
  const onFinalizar = vi.fn();

  render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <ShoppingBar
        activa={false}
        pendientes={3}
        marcados={0}
        pantalla={"encendida" as WakeLockState}
        onEmpezar={onEmpezar}
        onFinalizar={onFinalizar}
        {...props}
      />
    </NextIntlClientProvider>,
  );

  return { onEmpezar, onFinalizar };
}

afterEach(cleanup);

describe("ShoppingBar", () => {
  it("con la compra parada ofrece empezarla", async () => {
    const { onEmpezar } = montar();

    await userEvent.click(screen.getByRole("button", { name: /Empezar la compra/ }));
    expect(onEmpezar).toHaveBeenCalled();
  });

  // Lo que faltaba: había forma de entrar en el modo compra y ninguna de
  // decir «ya está», así que la pantalla se quedaba encendida.
  it("con la compra en marcha ofrece finalizarla, y dice cómo va", async () => {
    const { onFinalizar } = montar({ activa: true, pendientes: 3, marcados: 9 });

    expect(screen.getByText("9 de 12 en el carro")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Finalizar" }));
    expect(onFinalizar).toHaveBeenCalled();
  });

  /**
   * Prometer que la pantalla se queda encendida y que se apague es peor que
   * no prometer nada: quien lo lea deja el móvil confiado y se encuentra la
   * pantalla negra en mitad del pasillo.
   */
  it.each([
    ["encendida", "La pantalla no se apagará"],
    ["apagada", "La pantalla puede apagarse"],
    ["no-soportado", "Este navegador apaga la pantalla igualmente"],
  ])("con la pantalla en «%s» dice la verdad", async (estado, texto) => {
    montar({ activa: true, pantalla: estado as WakeLockState });

    expect(screen.getByText(texto)).toBeInTheDocument();
  });

  it("una lista vacía no ofrece empezar una compra de nada", () => {
    montar({ pendientes: 0, marcados: 0 });

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  // Alguien puede vaciar la lista desde otro móvil en mitad de la compra: la
  // barra tiene que seguir ahí para poder terminarla.
  it("pero si la compra está en marcha, la barra no desaparece", () => {
    montar({ activa: true, pendientes: 0, marcados: 0 });

    expect(screen.getByRole("button", { name: "Finalizar" })).toBeInTheDocument();
  });
});

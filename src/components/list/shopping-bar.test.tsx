import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { WakeLockState } from "@/features/list/use-wake-lock";
import messages from "@/i18n/messages/es.json";
import { ShoppingBar } from "./shopping-bar";

function montar(props: Partial<React.ComponentProps<typeof ShoppingBar>> = {}) {
  const onFinalizar = vi.fn();

  render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <ShoppingBar
        pendientes={3}
        marcados={9}
        pantalla={"encendida" as WakeLockState}
        onFinalizar={onFinalizar}
        {...props}
      />
    </NextIntlClientProvider>,
  );

  return { onFinalizar };
}

afterEach(cleanup);

describe("ShoppingBar", () => {
  /**
   * Ya no hay que empezar nada: abrir la lista es estar comprando. El único
   * botón es el que sí decide algo, que es qué hacer con la lista al acabar.
   */
  it("ofrece terminar desde el primer momento, y dice cómo va", async () => {
    const { onFinalizar } = montar();

    expect(screen.getByText("9 de 12 en el carro")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Finalizar" }));
    expect(onFinalizar).toHaveBeenCalled();
  });

  it("no hay ningún botón de empezar", () => {
    montar();

    expect(screen.getByRole("button")).toHaveTextContent("Finalizar");
  });

  /** Una lista vacía no es una compra: no hay nada que terminar todavía. */
  it("sin productos no se pinta", () => {
    const { container } = render(
      <NextIntlClientProvider locale="es" messages={messages}>
        <ShoppingBar
          pendientes={0}
          marcados={0}
          pantalla={"encendida" as WakeLockState}
          onFinalizar={vi.fn()}
        />
      </NextIntlClientProvider>,
    );

    expect(container).toBeEmptyDOMElement();
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
  ])("con la pantalla en «%s» dice la verdad", (estado, texto) => {
    montar({ pantalla: estado as WakeLockState });

    expect(screen.getByText(texto)).toBeInTheDocument();
  });
});

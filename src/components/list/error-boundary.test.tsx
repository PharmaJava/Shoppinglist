import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ErrorBoundary } from "./error-boundary";

/** El estado vive fuera de React a propósito: al reintentar, el límite vuelve
 *  a montar los mismos elementos, así que la condición tiene que leerse en el
 *  momento del render y no venir congelada en una prop. */
const bomba = { activa: true };

function Bomba() {
  if (bomba.activa) throw new Error("algo muy concreto ha petado");
  return <p>contenido</p>;
}

afterEach(cleanup);

describe("ErrorBoundary", () => {
  it("contiene el fallo y enseña el mensaje, en vez de tumbar la página", () => {
    // React escribe el error por consola aunque lo capturemos; aquí sólo hace
    // ruido en la salida del test.
    const silencio = vi.spyOn(console, "error").mockImplementation(() => {});
    bomba.activa = true;

    render(
      <ErrorBoundary fallback={(error) => <p>Fallo: {error.message}</p>}>
        <Bomba />
      </ErrorBoundary>,
    );

    expect(screen.getByText(/algo muy concreto ha petado/)).toBeInTheDocument();
    silencio.mockRestore();
  });

  it("deja volver a intentarlo", async () => {
    const silencio = vi.spyOn(console, "error").mockImplementation(() => {});
    bomba.activa = true;

    render(
      <ErrorBoundary
        fallback={(_error, reset) => (
          <button
            type="button"
            onClick={() => {
              bomba.activa = false;
              reset();
            }}
          >
            Reintentar
          </button>
        )}
      >
        <Bomba />
      </ErrorBoundary>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(screen.getByText("contenido")).toBeInTheDocument();
    silencio.mockRestore();
  });

  it("no estorba cuando no hay error", () => {
    bomba.activa = false;

    render(
      <ErrorBoundary fallback={() => <p>nunca</p>}>
        <Bomba />
      </ErrorBoundary>,
    );

    expect(screen.getByText("contenido")).toBeInTheDocument();
  });
});

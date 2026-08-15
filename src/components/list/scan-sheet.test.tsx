import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Reconocido } from "@/features/barcode/api";
import type { EstadoEscaner } from "@/features/barcode/use-barcode-scanner";
import messages from "@/i18n/messages/es.json";
import { ScanSheet } from "./scan-sheet";

const reconocerCodigo = vi.fn<() => Promise<Reconocido | null>>();
const recordarCodigo = vi.fn(async (..._args: unknown[]) => {});
vi.mock("@/features/barcode/api", () => ({
  reconocerCodigo: () => reconocerCodigo(),
  recordarCodigo: (...args: unknown[]) => recordarCodigo(...args),
}));

/**
 * La cámara no existe en jsdom, así que el escáner se sustituye por completo:
 * lo que se prueba aquí es la pantalla —qué se enseña, qué se guarda—, no la
 * Barcode Detection API.
 */
let estadoCamara: EstadoEscaner = "no-soportado";
vi.mock("@/features/barcode/use-barcode-scanner", () => ({
  useBarcodeScanner: () => ({
    estado: estadoCamara,
    videoRef: { current: null },
    empezar: vi.fn(),
    parar: vi.fn(),
  }),
}));

const mutate = vi.fn();
vi.mock("@/features/list/use-list-mutations", () => ({
  useAddParsedItems: () => ({ mutate }),
}));

function montar() {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <ScanSheet listId="l1" onCerrar={vi.fn()} />
    </NextIntlClientProvider>,
  );
}

/** Teclea un código válido (una Coca-Cola de 33 cl) y pulsa «Buscar». */
async function teclear(code = "5449000000996") {
  await userEvent.type(screen.getByLabelText(/teclea el número/i), code);
  await userEvent.click(screen.getByRole("button", { name: "Buscar" }));
}

beforeEach(() => {
  estadoCamara = "no-soportado";
  reconocerCodigo.mockResolvedValue(null);
  recordarCodigo.mockClear();
  mutate.mockClear();
});

afterEach(cleanup);

describe("ScanSheet", () => {
  /**
   * Safari no implementa `BarcodeDetector`, así que esto no es un caso raro:
   * es la mitad de los móviles. Sin el campo para teclear, media base de
   * usuarios se queda mirando un mensaje de error.
   */
  it("sin cámara sigue habiendo forma de escanear", () => {
    montar();

    expect(screen.getByText(messages.barcode.noCamera)).toBeInTheDocument();
    expect(screen.getByLabelText(/teclea el número/i)).toBeInTheDocument();
  });

  it("con cámara se ofrece encenderla, y el campo sigue estando", () => {
    estadoCamara = "parado";
    montar();

    expect(screen.getByRole("button", { name: "Usar la cámara" })).toBeInTheDocument();
    expect(screen.getByLabelText(/teclea el número/i)).toBeInTheDocument();
  });

  /** Un número mal copiado no puede convertirse en una consulta. */
  it("un código con el dígito de control mal no se busca", async () => {
    montar();

    await userEvent.type(screen.getByLabelText(/teclea el número/i), "5449000000997");

    expect(screen.getByRole("button", { name: "Buscar" })).toBeDisabled();
    expect(screen.getByText(messages.barcode.invalidCode)).toBeInTheDocument();
    expect(reconocerCodigo).not.toHaveBeenCalled();
  });

  it("un producto conocido llega con su nombre puesto", async () => {
    reconocerCodigo.mockResolvedValue({
      code: "5449000000996",
      name: "Coca-Cola",
      quantity: "330 ml",
      categoryId: null,
      origen: "openfoodfacts",
    });
    montar();

    await teclear();

    expect(await screen.findByLabelText("Producto")).toHaveValue("Coca-Cola");
    expect(screen.getByText(messages.barcode.fromOpenFoodFacts)).toBeInTheDocument();
    expect(screen.getByText("330 ml")).toBeInTheDocument();
  });

  it("dice cuándo el nombre es el que tú le enseñaste", async () => {
    reconocerCodigo.mockResolvedValue({
      code: "5449000000996",
      name: "La cola del niño",
      quantity: null,
      categoryId: "drinks",
      origen: "memoria",
    });
    montar();

    await teclear();

    expect(await screen.findByText(messages.barcode.fromMemory)).toBeInTheDocument();
  });

  it("un código desconocido pide el nombre en vez de rendirse", async () => {
    montar();

    await teclear();

    expect(await screen.findByText(messages.barcode.unknown)).toBeInTheDocument();
    expect(screen.getByLabelText("Producto")).toHaveValue("");
  });

  it("añadir mete el producto en la lista y aprende el código", async () => {
    montar();
    await teclear();
    await screen.findByLabelText("Producto");

    await userEvent.type(screen.getByLabelText("Producto"), "Leche de la buena");
    await userEvent.click(screen.getByRole("button", { name: "Añadir" }));

    expect(mutate).toHaveBeenCalledWith([{ name: "Leche de la buena", qty: null, unit: null }]);
    await waitFor(() =>
      expect(recordarCodigo).toHaveBeenCalledWith("5449000000996", "Leche de la buena", "dairy"),
    );
  });

  /** Se escanea uno detrás de otro: al añadir hay que quedarse listo. */
  it("después de añadir vuelve a estar listo para el siguiente", async () => {
    montar();
    await teclear();
    await screen.findByLabelText("Producto");
    await userEvent.type(screen.getByLabelText("Producto"), "Atún");
    await userEvent.click(screen.getByRole("button", { name: "Añadir" }));

    expect(await screen.findByText("Atún está en la lista")).toBeInTheDocument();
    expect(screen.getByLabelText(/teclea el número/i)).toHaveValue("");
  });

  it("sin nombre no se puede añadir", async () => {
    montar();
    await teclear();

    expect(await screen.findByRole("button", { name: "Añadir" })).toBeDisabled();
  });
});

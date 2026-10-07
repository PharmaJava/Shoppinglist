import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { listPendingMutations, removeMutation } from "./outbox";

/**
 * Un servidor de mentira: guarda lo que le llega por `upsert` y deja decidir
 * a cada prueba cuánto tarda y qué contesta.
 */
const servidor = vi.hoisted(() => ({
  filas: new Map<string, Record<string, unknown>>(),
  latenciaMs: 0,
  responder: (_fila: Record<string, unknown>): { error: unknown; status: number } => ({
    error: null,
    status: 201,
  }),
}));

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    from: () => ({
      upsert: async (fila: Record<string, unknown>) => {
        await new Promise((resolve) => setTimeout(resolve, servidor.latenciaMs));
        const respuesta = servidor.responder(fila);
        if (!respuesta.error) servidor.filas.set(fila.id as string, { ...fila });
        return respuesta;
      },
    }),
  }),
}));

const { flushOutbox, queueRowMutation } = await import("./flush");

async function vaciarCola() {
  const pendientes = await listPendingMutations();
  await Promise.all(pendientes.map((op) => removeMutation(op.key)));
}

/** Espera a que no quede nada por enviar, o se rinde. */
async function hastaQueSeVacie(maxMs = 2000) {
  const limite = Date.now() + maxMs;
  while (Date.now() < limite) {
    await flushOutbox();
    if ((await listPendingMutations()).length === 0) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

beforeEach(async () => {
  await vaciarCola();
  servidor.filas.clear();
  servidor.latenciaMs = 0;
  servidor.responder = () => ({ error: null, status: 201 });
});

afterEach(vaciarCola);

describe("flushOutbox", () => {
  /**
   * Escribir «leche pan tomate» encola tres filas seguidas. Mientras se envía
   * la primera, las otras dos piden su envío y se encontraban la puerta
   * cerrada: esperaban al temporizador de 5 s. La lista aparecía con un solo
   * producto y los otros dos llegaban segundos después.
   */
  it("envía en la misma pasada lo que se encola mientras ya está enviando", async () => {
    servidor.latenciaMs = 30;

    await queueRowMutation("list_items", { id: "leche", name: "leche" });
    await queueRowMutation("list_items", { id: "pan", name: "pan" });
    await queueRowMutation("list_items", { id: "tomate", name: "tomate" });

    // Sin temporizador de por medio: sólo lo que arrancó `queueRowMutation`.
    await new Promise((resolve) => setTimeout(resolve, 300));

    expect([...servidor.filas.keys()].sort()).toEqual(["leche", "pan", "tomate"]);
    expect(await listPendingMutations()).toHaveLength(0);
  });

  /**
   * Añadir un producto y marcarlo (o borrarlo) antes de que el servidor
   * conteste la creación. Las dos escrituras comparten clave en la cola; al
   * confirmarse la primera se borraba la clave… que ya guardaba la segunda.
   * El marcado no llegaba nunca: en este móvil se veía marcado, en el de la
   * otra persona no, y al recargar se desmarcaba solo.
   */
  it("no pierde un cambio hecho mientras la versión anterior iba por el aire", async () => {
    servidor.latenciaMs = 50;

    await queueRowMutation("list_items", { id: "leche", name: "leche", is_checked: false });
    await new Promise((resolve) => setTimeout(resolve, 10)); // ya está en vuelo
    await queueRowMutation("list_items", { id: "leche", name: "leche", is_checked: true });

    await hastaQueSeVacie();

    expect(servidor.filas.get("leche")?.is_checked).toBe(true);
  });

  /**
   * Si el servidor rechaza una fila para siempre —la lista la borró su
   * dueño, o te sacaron de ella— reintentarla no la arregla. Se quedaba en la
   * cola de por vida, reintentándose cada 30 s, y el aviso de «cambios
   * pendientes» no se apagaba nunca.
   */
  it("descarta lo que el servidor rechaza para siempre y sigue con lo demás", async () => {
    servidor.responder = (fila) =>
      fila.id === "huerfano"
        ? { error: { code: "23503", message: "violates foreign key constraint" }, status: 409 }
        : { error: null, status: 201 };

    await queueRowMutation("list_items", { id: "huerfano", list_id: "borrada" });
    await queueRowMutation("list_items", { id: "pan", name: "pan" });

    await hastaQueSeVacie();

    expect(await listPendingMutations()).toHaveLength(0);
    expect(servidor.filas.has("pan")).toBe(true);
    expect(servidor.filas.has("huerfano")).toBe(false);
  });

  /** Sin red no se descarta nada: eso sí se arregla esperando. */
  it("conserva lo que falla por la red, para reintentarlo", async () => {
    servidor.responder = () => ({
      error: { code: "", message: "TypeError: Failed to fetch" },
      status: 0,
    });

    await queueRowMutation("list_items", { id: "leche", name: "leche" });
    await flushOutbox();

    const pendientes = await listPendingMutations();
    expect(pendientes).toHaveLength(1);
    expect(pendientes[0]?.retries).toBeGreaterThan(0);
  });

  /** Una sesión caducada se renueva sola: tampoco es motivo para tirar nada. */
  it("conserva lo que falla por sesión caducada (401)", async () => {
    servidor.responder = () => ({
      error: { code: "PGRST301", message: "JWT expired" },
      status: 401,
    });

    await queueRowMutation("list_items", { id: "leche", name: "leche" });
    await flushOutbox();

    expect(await listPendingMutations()).toHaveLength(1);
  });
});

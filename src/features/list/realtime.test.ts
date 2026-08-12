import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ListItemRow, ListRow } from "@/lib/supabase/types";
import { resetListSubscriptions, subscribeToList } from "./realtime";

/**
 * Réplica de lo que hace supabase-js y que provocó el fallo: `channel()`
 * devuelve el mismo canal para el mismo topic, y añadirle un `postgres_changes`
 * después de `subscribe()` lanza excepción.
 */
const canales = new Map<string, FakeChannel>();
const removidos: string[] = [];

class FakeChannel {
  suscrito = false;
  callbacks: Array<(payload: unknown) => void> = [];

  constructor(readonly topic: string) {}

  on(_evento: string, _filtro: unknown, callback: (payload: unknown) => void) {
    if (this.suscrito) {
      throw new Error(
        `cannot add \`postgres_changes\` callbacks for ${this.topic} after \`subscribe()\`.`,
      );
    }
    this.callbacks.push(callback);
    return this;
  }

  subscribe() {
    this.suscrito = true;
    return this;
  }

  emit(payload: unknown, indice: number) {
    this.callbacks[indice]?.(payload);
  }
}

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    channel: (topic: string) => {
      const existente = canales.get(topic);
      if (existente) return existente;
      const nuevo = new FakeChannel(topic);
      canales.set(topic, nuevo);
      return nuevo;
    },
    removeChannel: (channel: FakeChannel) => {
      removidos.push(channel.topic);
      canales.delete(channel.topic);
    },
  }),
}));

const item = { id: "i1", name: "Pan" } as ListItemRow;
const list = { id: "l1", title: "Compra" } as ListRow;

beforeEach(() => {
  canales.clear();
  removidos.length = 0;
  resetListSubscriptions();
});
afterEach(() => resetListSubscriptions());

describe("subscribeToList", () => {
  // El fallo real: la vista de la lista ya tenía canal y la hoja de compartir
  // intentaba montar otro encima. La excepción se llevaba la página entera.
  it("dos sitios mirando la misma lista no rompen nada", () => {
    const primero = { onItem: vi.fn(), onList: vi.fn() };
    const segundo = { onItem: vi.fn(), onList: vi.fn() };

    expect(() => {
      subscribeToList("l1", primero);
      subscribeToList("l1", segundo);
    }).not.toThrow();

    expect(canales.size).toBe(1);
  });

  // Deja constancia de que el sucedáneo reproduce el fallo de verdad: si no,
  // el test de arriba pasaría aunque el arreglo no sirviera de nada.
  it("hacerlo a la antigua —un canal por componente— sí revienta", async () => {
    const { getSupabaseBrowserClient } = await import("@/lib/supabase/client");
    const alaAntigua = () =>
      (getSupabaseBrowserClient() as unknown as { channel: (t: string) => FakeChannel })
        .channel("list:l1")
        .on("postgres_changes", {}, () => {})
        .subscribe();

    alaAntigua();

    expect(alaAntigua).toThrow(/after `subscribe\(\)`/);
  });

  it("los cambios llegan a todos los enganchados", () => {
    const primero = { onItem: vi.fn(), onList: vi.fn() };
    const segundo = { onItem: vi.fn(), onList: vi.fn() };
    subscribeToList("l1", primero);
    subscribeToList("l1", segundo);

    canales.get("list:l1")?.emit({ new: item }, 0);
    canales.get("list:l1")?.emit({ new: list }, 1);

    expect(primero.onItem).toHaveBeenCalledWith(item);
    expect(segundo.onItem).toHaveBeenCalledWith(item);
    expect(primero.onList).toHaveBeenCalledWith(list);
    expect(segundo.onList).toHaveBeenCalledWith(list);
  });

  it("al irse uno, el otro sigue recibiendo", () => {
    const primero = { onItem: vi.fn(), onList: vi.fn() };
    const segundo = { onItem: vi.fn(), onList: vi.fn() };
    const salir = subscribeToList("l1", primero);
    subscribeToList("l1", segundo);

    salir();
    canales.get("list:l1")?.emit({ new: item }, 0);

    expect(primero.onItem).not.toHaveBeenCalled();
    expect(segundo.onItem).toHaveBeenCalledWith(item);
    expect(removidos).toEqual([]);
  });

  // Sin esto quedaría un websocket abierto por cada lista visitada.
  it("el último cierra el canal", () => {
    const salirPrimero = subscribeToList("l1", { onItem: vi.fn(), onList: vi.fn() });
    const salirSegundo = subscribeToList("l1", { onItem: vi.fn(), onList: vi.fn() });

    salirPrimero();
    salirSegundo();

    expect(removidos).toEqual(["list:l1"]);
    expect(canales.size).toBe(0);
  });

  it("volver a entrar después de cerrar abre un canal nuevo", () => {
    subscribeToList("l1", { onItem: vi.fn(), onList: vi.fn() })();
    const handlers = { onItem: vi.fn(), onList: vi.fn() };

    expect(() => subscribeToList("l1", handlers)).not.toThrow();
    canales.get("list:l1")?.emit({ new: item }, 0);
    expect(handlers.onItem).toHaveBeenCalledWith(item);
  });

  it("listas distintas, canales distintos", () => {
    subscribeToList("l1", { onItem: vi.fn(), onList: vi.fn() });
    subscribeToList("l2", { onItem: vi.fn(), onList: vi.fn() });

    expect([...canales.keys()]).toEqual(["list:l1", "list:l2"]);
  });

  it("un borrado también se propaga: llega en `old`", () => {
    const handlers = { onItem: vi.fn(), onList: vi.fn() };
    subscribeToList("l1", handlers);

    canales.get("list:l1")?.emit({ old: item }, 0);

    expect(handlers.onItem).toHaveBeenCalledWith(item);
  });
});

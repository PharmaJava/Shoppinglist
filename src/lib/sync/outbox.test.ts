import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  enqueueMutation,
  listPendingMutations,
  markMutationFailed,
  nextAttemptDelay,
  operationKey,
  removeMutation,
  removeMutationIfUnchanged,
} from "./outbox";

describe("operationKey", () => {
  it("combina tabla e id de forma estable", () => {
    expect(operationKey("list_items", "abc")).toBe("list_items:abc");
    expect(operationKey("lists", "abc")).not.toBe(operationKey("list_items", "abc"));
  });
});

describe("nextAttemptDelay", () => {
  it("crece exponencialmente con un techo de 30s", () => {
    expect(nextAttemptDelay(0)).toBe(1000);
    expect(nextAttemptDelay(1)).toBe(2000);
    expect(nextAttemptDelay(2)).toBe(4000);
    expect(nextAttemptDelay(10)).toBe(30_000);
  });
});

describe("outbox (IndexedDB)", () => {
  beforeEach(async () => {
    const pending = await listPendingMutations();
    await Promise.all(pending.map((op) => removeMutation(op.key)));
  });

  it("encola y lista una mutación", async () => {
    await enqueueMutation("list_items", { id: "item-1", list_id: "list-1", name: "Leche" });

    const pending = await listPendingMutations();
    expect(pending).toHaveLength(1);
    expect(pending[0]?.key).toBe("list_items:item-1");
    expect(pending[0]?.row.name).toBe("Leche");
  });

  it("compacta escrituras repetidas sobre la misma fila (misma clave)", async () => {
    await enqueueMutation("list_items", { id: "item-1", name: "Leche", is_checked: false });
    await enqueueMutation("list_items", { id: "item-1", name: "Leche", is_checked: true });

    const pending = await listPendingMutations();
    expect(pending).toHaveLength(1);
    expect(pending[0]?.row.is_checked).toBe(true);
  });

  it("conserva el createdAt original al compactar (preserva el orden causal)", async () => {
    await enqueueMutation("list_items", { id: "item-1", name: "Leche" });
    const [first] = await listPendingMutations();

    await new Promise((resolve) => setTimeout(resolve, 5));
    await enqueueMutation("list_items", { id: "item-1", name: "Leche entera" });

    const [second] = await listPendingMutations();
    expect(second?.createdAt).toBe(first?.createdAt);
  });

  it("elimina una mutación tras sincronizarla", async () => {
    await enqueueMutation("list_items", { id: "item-1", name: "Leche" });
    await removeMutation(operationKey("list_items", "item-1"));

    expect(await listPendingMutations()).toHaveLength(0);
  });

  it("marca reintentos con backoff creciente", async () => {
    await enqueueMutation("list_items", { id: "item-1", name: "Leche" });
    const [enviada] = await listPendingMutations();
    await markMutationFailed(operationKey("list_items", "item-1"), 1, enviada?.stamp);

    const [op] = await listPendingMutations();
    expect(op?.retries).toBe(1);
    expect(op?.nextAttemptAt).toBeGreaterThan(Date.now());
  });

  it("no borra la versión nueva al confirmar la anterior", async () => {
    await enqueueMutation("list_items", { id: "item-1", is_checked: false });
    const [enviada] = await listPendingMutations();
    await enqueueMutation("list_items", { id: "item-1", is_checked: true });

    await removeMutationIfUnchanged(operationKey("list_items", "item-1"), enviada?.stamp);

    const pendientes = await listPendingMutations();
    expect(pendientes).toHaveLength(1);
    expect(pendientes[0]?.row.is_checked).toBe(true);
  });

  it("no castiga con espera a la versión nueva por el fallo de la anterior", async () => {
    await enqueueMutation("list_items", { id: "item-1", is_checked: false });
    const [enviada] = await listPendingMutations();
    await enqueueMutation("list_items", { id: "item-1", is_checked: true });

    await markMutationFailed(operationKey("list_items", "item-1"), 3, enviada?.stamp);

    const [op] = await listPendingMutations();
    expect(op?.retries).toBe(0);
    expect(op?.nextAttemptAt).toBe(0);
  });

  /**
   * El orden de la cola es el orden en que se encola, aunque dos cambios caigan
   * en el mismo milisegundo. Antes se desempataba por la clave y
   * `list_items:…` va antes que `list_sections:…`: un producto salía antes
   * que la sección en la que va, el servidor lo rechazaba y se perdía.
   */
  it("respeta el orden de encolado aunque coincida el milisegundo", async () => {
    const ahora = Date.now();
    const reloj = vi.spyOn(Date, "now").mockReturnValue(ahora);
    try {
      await enqueueMutation("list_sections", { id: "z-seccion", name: "Mochila" });
      await enqueueMutation("list_items", { id: "a-producto", section_id: "z-seccion" });
      await enqueueMutation("list_items", { id: "b-producto", section_id: "z-seccion" });
    } finally {
      reloj.mockRestore();
    }

    const pendientes = await listPendingMutations();
    expect(pendientes.map((op) => op.key)).toEqual([
      "list_sections:z-seccion",
      "list_items:a-producto",
      "list_items:b-producto",
    ]);
  });
});

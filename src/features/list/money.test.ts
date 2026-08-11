import { describe, expect, it } from "vitest";
import { centsToInput, computeTotals, formatMoney, parsePriceToCents } from "./money";
import type { ListItem } from "./types";

function item(price: number | null, isChecked = false): ListItem {
  return {
    id: crypto.randomUUID(),
    list_id: "list-1",
    name: "Producto",
    qty: null,
    unit: null,
    note: null,
    category_id: null,
    price_cents: price,
    is_checked: isChecked,
    checked_by: null,
    checked_at: null,
    assigned_to: null,
    sort_key: "a0",
    created_by: null,
    created_at: "2026-08-10T00:00:00.000Z",
    updated_at: "2026-08-10T00:00:00.000Z",
    deleted_at: null,
  };
}

describe("parsePriceToCents", () => {
  it("acepta coma y punto, porque el teclado del móvil da coma", () => {
    expect(parsePriceToCents("1,20")).toBe(120);
    expect(parsePriceToCents("1.20")).toBe(120);
  });

  it("aguanta el símbolo de moneda y los espacios", () => {
    expect(parsePriceToCents(" 12,40 € ")).toBe(1240);
  });

  it("vacío es quitar el precio, no cero", () => {
    expect(parsePriceToCents("")).toBeNull();
    expect(parsePriceToCents("   ")).toBeNull();
  });

  it("lo que no es un precio no lo es", () => {
    expect(parsePriceToCents("barato")).toBeNull();
    expect(parsePriceToCents("-3")).toBeNull();
  });

  // El clásico: 0.1 + 0.2 no es 0.3 en coma flotante, y un total de la compra
  // no puede arrastrar eso.
  it("redondea al céntimo", () => {
    expect(parsePriceToCents("0,145")).toBe(15);
    expect(parsePriceToCents("2,999")).toBe(300);
  });
});

describe("computeTotals", () => {
  it("suma lo que tiene precio y aparta lo marcado", () => {
    const totals = computeTotals([item(120), item(350, true), item(80, true)]);

    expect(totals.totalCents).toBe(550);
    expect(totals.checkedCents).toBe(430);
    expect(totals.missingPrices).toBe(0);
  });

  it("cuenta lo que no tiene precio: el total es un mínimo, no una factura", () => {
    const totals = computeTotals([item(120), item(null), item(null)]);

    expect(totals.totalCents).toBe(120);
    expect(totals.missingPrices).toBe(2);
  });

  it("una lista vacía suma cero", () => {
    expect(computeTotals([])).toEqual({ totalCents: 0, checkedCents: 0, missingPrices: 0 });
  });

  // En céntimos y con enteros no hay decimales que se desvíen.
  it("cien productos de diez céntimos son diez euros exactos", () => {
    const totals = computeTotals(Array.from({ length: 100 }, () => item(10)));

    expect(totals.totalCents).toBe(1000);
  });
});

describe("centsToInput", () => {
  it("en español escribe la coma decimal", () => {
    expect(centsToInput(1240, "es")).toBe("12,40");
    expect(centsToInput(1240, "en")).toBe("12.40");
  });

  it("sin precio, el campo va vacío", () => {
    expect(centsToInput(null, "es")).toBe("");
  });

  it("da la vuelta a lo que escribió la persona", () => {
    expect(parsePriceToCents(centsToInput(1999, "es"))).toBe(1999);
  });
});

describe("formatMoney", () => {
  it("usa la moneda y el idioma que se le pasan", () => {
    // El espacio antes del símbolo es un espacio duro, no uno normal.
    expect(formatMoney(1240, "EUR", "es").replace(/ /g, " ")).toBe("12,40 €");
    expect(formatMoney(1240, "USD", "en")).toBe("$12.40");
  });
});

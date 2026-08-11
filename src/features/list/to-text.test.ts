import { describe, expect, it } from "vitest";
import { listToText } from "./to-text";
import type { Category, ListItem } from "./types";

const categories: Category[] = [
  { id: "produce", name_es: "Fruta y verdura", name_en: "Produce", icon: "🥦", sort_order: 10 },
  { id: "dairy", name_es: "Lácteos y huevos", name_en: "Dairy & Eggs", icon: "🥛", sort_order: 30 },
  { id: "other", name_es: "Otros", name_en: "Other", icon: "🛒", sort_order: 999 },
];

function item(partial: Partial<ListItem> & { name: string }): ListItem {
  return {
    id: partial.name,
    list_id: "list-1",
    name: partial.name,
    qty: partial.qty ?? null,
    unit: partial.unit ?? null,
    note: null,
    category_id: partial.category_id ?? null,
    price_cents: null,
    is_checked: partial.is_checked ?? false,
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

const base = {
  title: "Compra del sábado",
  categories,
  locale: "es" as const,
  checkedLabel: "Ya en el carro",
  otherLabel: "Otros",
};

describe("listToText", () => {
  it("agrupa por pasillo, en el orden del recorrido", () => {
    const text = listToText({
      ...base,
      items: [
        item({ name: "Leche", category_id: "dairy" }),
        item({ name: "Tomates", category_id: "produce" }),
      ],
    });

    expect(text).toBe(
      [
        "Compra del sábado",
        "",
        "Fruta y verdura",
        "- Tomates",
        "",
        "Lácteos y huevos",
        "- Leche",
      ].join("\n"),
    );
  });

  it("escribe la cantidad y la unidad cuando las hay", () => {
    const text = listToText({
      ...base,
      items: [
        item({ name: "Carne picada", qty: 500, unit: "g", category_id: "other" }),
        item({ name: "Tomates", qty: 3, category_id: "produce" }),
        item({ name: "Pan", category_id: "other" }),
      ],
    });

    expect(text).toContain("- Carne picada — 500 g");
    expect(text).toContain("- Tomates — 3");
    expect(text).toContain("- Pan");
  });

  it("deja lo ya comprado al final, en su propio bloque", () => {
    const text = listToText({
      ...base,
      items: [
        item({ name: "Leche", category_id: "dairy", is_checked: true }),
        item({ name: "Tomates", category_id: "produce" }),
      ],
    });

    expect(text).toBe(
      [
        "Compra del sábado",
        "",
        "Fruta y verdura",
        "- Tomates",
        "",
        "Ya en el carro",
        "- Leche",
      ].join("\n"),
    );
  });

  it("lo que no tiene pasillo cae en Otros", () => {
    const text = listToText({ ...base, items: [item({ name: "Pilas" })] });

    expect(text).toBe(["Compra del sábado", "", "Otros", "- Pilas"].join("\n"));
  });

  it("una lista vacía es sólo su título", () => {
    expect(listToText({ ...base, items: [] })).toBe("Compra del sábado");
  });

  it("en inglés usa los nombres ingleses de los pasillos", () => {
    const text = listToText({
      ...base,
      locale: "en",
      items: [item({ name: "Milk", category_id: "dairy" })],
    });

    expect(text).toContain("Dairy & Eggs");
  });
});

import { describe, expect, it } from "vitest";
import type { ListItemRow, ListRow, ProfileRow } from "@/lib/supabase/types";
import { buildExport } from "./export-shape";

const yo = "11111111-1111-1111-1111-111111111111";
const otra = "22222222-2222-2222-2222-222222222222";

function list(id: string, ownerId: string): ListRow {
  return {
    id,
    owner_id: ownerId,
    title: `Lista ${id}`,
    emoji: null,
    currency: "EUR",
    budget_cents: null,
    archived_at: null,
    created_at: "2026-08-01T00:00:00.000Z",
    updated_at: "2026-08-10T00:00:00.000Z",
  };
}

function item(partial: Partial<ListItemRow> & { name: string; list_id: string }): ListItemRow {
  return {
    id: partial.name,
    list_id: partial.list_id,
    name: partial.name,
    qty: partial.qty ?? null,
    unit: partial.unit ?? null,
    note: null,
    category_id: partial.category_id ?? null,
    price_cents: null,
    is_checked: false,
    checked_by: null,
    checked_at: null,
    assigned_to: null,
    sort_key: partial.sort_key ?? "a0",
    created_by: yo,
    created_at: "2026-08-02T00:00:00.000Z",
    updated_at: "2026-08-02T00:00:00.000Z",
    deleted_at: partial.deleted_at ?? null,
  };
}

const profile: ProfileRow = {
  id: yo,
  display_name: "Ana",
  avatar_url: null,
  locale: "es",
  currency: "EUR",
  plan: "free",
  created_at: "2026-07-01T00:00:00.000Z",
};

const base = { userId: yo, email: "ana@example.com", profile, history: [] };

describe("buildExport", () => {
  it("mete cada producto bajo su lista, en el orden de la lista", () => {
    const data = buildExport({
      ...base,
      lists: [list("l1", yo)],
      items: [
        item({ name: "Pan", list_id: "l1", sort_key: "a2" }),
        item({ name: "Leche", list_id: "l1", sort_key: "a1" }),
      ],
    });

    expect(data.lists).toHaveLength(1);
    expect(data.lists[0]?.items.map((entry) => entry.name)).toEqual(["Leche", "Pan"]);
  });

  it("distingue las listas propias de aquellas en las que sólo participas", () => {
    const data = buildExport({
      ...base,
      lists: [list("mia", yo), list("suya", otra)],
      items: [],
    });

    expect(data.lists.map((entry) => entry.isOwner)).toEqual([true, false]);
  });

  // Una exportación no es una excusa para llevarse datos de terceros: los
  // productos van bajo su lista y los demás miembros no aparecen.
  it("no incluye a las otras personas de una lista compartida", () => {
    const data = buildExport({ ...base, lists: [list("suya", otra)], items: [] });

    expect(JSON.stringify(data)).not.toContain(otra);
  });

  it("deja fuera lo que estaba borrado", () => {
    const data = buildExport({
      ...base,
      lists: [list("l1", yo)],
      items: [
        item({ name: "Pan", list_id: "l1" }),
        item({ name: "Fantasma", list_id: "l1", deleted_at: "2026-08-03T00:00:00.000Z" }),
      ],
    });

    expect(data.lists[0]?.items.map((entry) => entry.name)).toEqual(["Pan"]);
  });

  it("lleva la cuenta y su nombre visible", () => {
    const data = buildExport({ ...base, lists: [], items: [] });

    expect(data.account).toMatchObject({
      id: yo,
      email: "ana@example.com",
      displayName: "Ana",
      locale: "es",
    });
  });

  it("aguanta una cuenta sin perfil todavía", () => {
    const data = buildExport({ ...base, profile: null, email: null, lists: [], items: [] });

    expect(data.account.displayName).toBeNull();
    expect(data.account.email).toBeNull();
  });
});

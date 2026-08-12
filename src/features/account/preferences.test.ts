import { afterEach, describe, expect, it, vi } from "vitest";
import { CURRENCIES, DEFAULT_PREFERENCES, fetchPreferences, isCurrencyCode } from "./preferences";

const maybeSingle = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle }) }) }),
  }),
}));

const getCurrentUserId = vi.fn(async () => "usuario-1" as string | null);
vi.mock("@/lib/supabase/get-current-user-id", () => ({
  getCurrentUserId: () => getCurrentUserId(),
}));

afterEach(() => {
  maybeSingle.mockReset();
  getCurrentUserId.mockResolvedValue("usuario-1");
});

describe("isCurrencyCode", () => {
  it("acepta las que ofrecemos y rechaza el resto", () => {
    expect(isCurrencyCode("EUR")).toBe(true);
    expect(isCurrencyCode("MXN")).toBe(true);
    expect(isCurrencyCode("XYZ")).toBe(false);
    expect(isCurrencyCode("")).toBe(false);
  });

  it("no hay códigos repetidos en la lista", () => {
    const codigos = CURRENCIES.map((moneda) => moneda.code);
    expect(new Set(codigos).size).toBe(codigos.length);
  });
});

describe("fetchPreferences", () => {
  it("devuelve lo que hay en el perfil", async () => {
    maybeSingle.mockResolvedValue({ data: { locale: "en", currency: "MXN" } });

    expect(await fetchPreferences()).toEqual({ locale: "en", currency: "MXN" });
  });

  // Si alguien tenía guardada una moneda que después se quita de la lista, el
  // desplegable se quedaría en blanco y parecería que no hay nada elegido.
  it("una moneda que ya no ofrecemos cae al valor por defecto", async () => {
    maybeSingle.mockResolvedValue({ data: { locale: "es", currency: "XYZ" } });

    expect((await fetchPreferences()).currency).toBe(DEFAULT_PREFERENCES.currency);
  });

  it("sin perfil y sin sesión devuelve los valores por defecto, no revienta", async () => {
    maybeSingle.mockResolvedValue({ data: null });
    expect(await fetchPreferences()).toEqual(DEFAULT_PREFERENCES);

    getCurrentUserId.mockResolvedValue(null);
    expect(await fetchPreferences()).toEqual(DEFAULT_PREFERENCES);
  });
});

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ListSummary } from "@/features/list/api";
import type { List } from "@/features/list/types";
import messages from "@/i18n/messages/es.json";
import type { Locale } from "@/lib/supabase/types";
import { MyListsClient } from "./my-lists-client";

const setListArchived = vi.fn(async (_list: List, _archived: boolean) => ({}) as List);
const duplicateList = vi.fn(
  async (_listId: string, _title: string, _locale: Locale) => ({ id: "copia-1" }) as List,
);

function list(id: string, title: string, archivedAt: string | null = null): ListSummary {
  return {
    list: {
      id,
      owner_id: "user-1",
      title,
      emoji: null,
      currency: "EUR",
      budget_cents: null,
      archived_at: archivedAt,
      created_at: "2026-08-01T00:00:00.000Z",
      updated_at: "2026-08-10T00:00:00.000Z",
    },
    totalItems: 4,
    checkedItems: 1,
  };
}

const lists = [
  list("l1", "Compra semanal"),
  list("l2", "Cumpleaños de Ana"),
  list("l3", "Semana pasada", "2026-08-05T00:00:00.000Z"),
];

vi.mock("@/features/list/api", () => ({
  fetchMyLists: async () => lists,
  setListArchived: (list: List, archived: boolean) => setListArchived(list, archived),
  duplicateList: (listId: string, title: string, locale: Locale) =>
    duplicateList(listId, title, locale),
  createList: vi.fn(),
}));

vi.mock("@/features/auth/use-session", () => ({
  useSession: () => ({ status: "registered" }),
}));

/**
 * `useRouter` exige que el App Router esté montado. Se monta su contexto en
 * vez de sustituir el módulo entero: `vi.mock("next/navigation")` rompe la
 * resolución que next-intl hace de ese mismo módulo.
 */
function renderPanel() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = {
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  };

  return render(
    <AppRouterContext.Provider value={router as unknown as AppRouterInstance}>
      <NextIntlClientProvider locale="es" messages={messages}>
        <QueryClientProvider client={client}>
          <MyListsClient />
        </QueryClientProvider>
      </NextIntlClientProvider>
    </AppRouterContext.Provider>,
  );
}

beforeEach(() => {
  setListArchived.mockClear();
  duplicateList.mockClear();
});
afterEach(cleanup);

describe("MyListsClient", () => {
  it("separa las archivadas y sólo las enseña si se piden", async () => {
    renderPanel();

    await waitFor(() => expect(screen.getByText("Compra semanal")).toBeInTheDocument());
    expect(screen.queryByText("Semana pasada")).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "Archivadas (1)" }));

    expect(screen.getByText("Semana pasada")).toBeInTheDocument();
  });

  it("«volver a comprar» duplica la lista con un título reconocible", async () => {
    renderPanel();

    await waitFor(() => expect(screen.getByText("Compra semanal")).toBeInTheDocument());
    await userEvent.click(
      screen.getAllByRole("button", { name: "Volver a comprar" })[0] as HTMLElement,
    );

    await waitFor(() => expect(duplicateList).toHaveBeenCalled());
    expect(duplicateList.mock.calls[0]).toEqual(["l1", "Compra semanal (copia)", "es"]);
  });

  it("archiva la lista activa y recupera la archivada", async () => {
    renderPanel();

    await waitFor(() => expect(screen.getByText("Compra semanal")).toBeInTheDocument());
    await userEvent.click(screen.getAllByRole("button", { name: "Archivar" })[0] as HTMLElement);

    await waitFor(() => expect(setListArchived).toHaveBeenCalled());
    expect(setListArchived.mock.calls[0]?.[1]).toBe(true);

    await userEvent.click(screen.getByRole("button", { name: "Archivadas (1)" }));
    await userEvent.click(screen.getByRole("button", { name: "Recuperar" }));

    await waitFor(() => expect(setListArchived).toHaveBeenCalledTimes(2));
    expect(setListArchived.mock.calls[1]?.[1]).toBe(false);
  });
});

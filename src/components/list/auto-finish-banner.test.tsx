import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { List } from "@/features/list/types";
import messages from "@/i18n/messages/es.json";
import { AutoFinishBanner } from "./auto-finish-banner";

const setListArchived = vi.fn(async (_list: List, _archivar: boolean) => ({}) as List);
const reopenList = vi.fn(async (_id: string) => {});
vi.mock("@/features/list/api", () => ({
  setListArchived: (list: List, archivar: boolean) => setListArchived(list, archivar),
  reopenList: (id: string) => reopenList(id),
}));

function lista(parcial: Partial<List> = {}): List {
  return {
    id: "l1",
    owner_id: "u1",
    title: "Compra",
    emoji: null,
    currency: "EUR",
    budget_cents: null,
    archived_at: null,
    auto_finish_at: null,
    created_at: "2026-08-15T00:00:00Z",
    updated_at: "2026-08-15T00:00:00Z",
    ...parcial,
  };
}

function montar(list: List) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render(
    <QueryClientProvider client={client}>
      <NextIntlClientProvider locale="es" messages={messages}>
        <AutoFinishBanner listId="l1" list={list} />
      </NextIntlClientProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.setSystemTime(new Date("2026-08-15T12:00:00Z"));
  setListArchived.mockClear();
  reopenList.mockClear();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("AutoFinishBanner", () => {
  /** Las listas de quien tiene cuenta no caducan: aquí no hay nada que decir. */
  it("sin fecha de fin no se pinta nada", () => {
    const { container } = montar(lista());

    expect(container).toBeEmptyDOMElement();
  });

  it("con el día entero por delante tampoco molesta", () => {
    const { container } = montar(lista({ auto_finish_at: "2026-08-16T06:00:00Z" }));

    expect(container).toBeEmptyDOMElement();
  });

  /**
   * Sin este aviso, la regla sería una pérdida por sorpresa: entras al día
   * siguiente y tu lista está cerrada sin que nadie te dijera nada.
   */
  it("en las últimas horas avisa y ofrece la cuenta", () => {
    montar(lista({ auto_finish_at: "2026-08-15T15:00:00Z" }));

    expect(screen.getByText("Esta lista se dará por terminada en 3 horas")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: messages.autoFinish.keepIt })).toBeInTheDocument();
    expect(setListArchived).not.toHaveBeenCalled();
  });

  /**
   * Quien la abre pasada la hora tiene que ver la verdad, no una lista que
   * dice estar abierta y que el servidor cerrará esta madrugada.
   */
  it("pasada la hora la cierra ahí mismo y lo dice", async () => {
    montar(lista({ auto_finish_at: "2026-08-15T10:00:00Z" }));

    expect(screen.getByText(messages.autoFinish.finished)).toBeInTheDocument();
    await waitFor(() => expect(setListArchived).toHaveBeenCalledWith(expect.anything(), true));
  });

  it("una ya archivada no se vuelve a archivar", () => {
    montar(lista({ auto_finish_at: "2026-08-15T10:00:00Z", archived_at: "2026-08-15T10:00:01Z" }));

    expect(screen.getByText(messages.autoFinish.finished)).toBeInTheDocument();
    expect(setListArchived).not.toHaveBeenCalled();
  });

  it("y se puede volver a abrir de un toque", async () => {
    montar(lista({ auto_finish_at: "2026-08-15T10:00:00Z", archived_at: "2026-08-15T10:00:01Z" }));

    await userEvent.click(screen.getByRole("button", { name: messages.autoFinish.reopen }));

    await waitFor(() => expect(reopenList).toHaveBeenCalledWith("l1"));
  });
});

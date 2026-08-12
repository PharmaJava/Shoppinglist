import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ListMember } from "@/features/list/api";
import messages from "@/i18n/messages/es.json";
import { ShareSheet } from "./share-sheet";

const getOrCreateActiveInvite = vi.fn(async (_listId: string, _role: string) => "token-de-prueba");
const fetchListMembers = vi.fn(
  async (): Promise<ListMember[]> => [
    { userId: "yo", role: "owner", displayName: "Ana", isMe: true },
  ],
);

vi.mock("@/features/list/api", () => ({
  getOrCreateActiveInvite: (listId: string, role: string) => getOrCreateActiveInvite(listId, role),
  fetchListMembers: () => fetchListMembers(),
  setMemberRole: vi.fn(),
  removeMember: vi.fn(),
  transferOwnership: vi.fn(),
}));

vi.mock("@/features/list/use-list", () => ({
  useList: () => ({ data: { list: { id: "list-1", title: "Compra" }, items: [] } }),
}));

vi.mock("@/features/list/use-categories", () => ({ useCategories: () => ({ data: [] }) }));

// El interruptor de avisos toca el cliente de Supabase al importarse; aquí no
// se prueba, sólo que no estorbe.
vi.mock("@/features/push/subscribe", () => ({
  pushSupported: () => false,
  pushPermission: () => "unsupported",
  hasPushSubscription: async () => false,
  enablePush: async () => false,
  disablePush: async () => {},
}));

function renderSheet() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <QueryClientProvider client={client}>
        <ShareSheet listId="list-1" onClose={() => {}} />
      </QueryClientProvider>
    </NextIntlClientProvider>,
  );
}

beforeEach(() => {
  getOrCreateActiveInvite.mockClear();
  fetchListMembers.mockClear();
});
afterEach(cleanup);

describe("ShareSheet", () => {
  it("se abre y ofrece el enlace", async () => {
    renderSheet();

    await waitFor(() => expect(getOrCreateActiveInvite).toHaveBeenCalled());
    await waitFor(() =>
      expect(screen.getByRole("button", { name: messages.list.shareNative })).toBeEnabled(),
    );
  });

  // Antes, un fallo aquí dejaba los botones en gris para siempre y sin una
  // sola pista: indistinguible de «está cargando».
  it("si la invitación falla, lo dice y ofrece reintentar", async () => {
    getOrCreateActiveInvite.mockRejectedValueOnce(new Error("permission denied"));
    renderSheet();

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(screen.getByRole("alert")).toHaveTextContent(messages.list.shareError);
    expect(screen.getByRole("button", { name: messages.list.retry })).toBeInTheDocument();
  });

  it("a quien no es propietario le explica por qué no puede invitar", async () => {
    fetchListMembers.mockResolvedValueOnce([
      { userId: "otra", role: "owner", displayName: "Ana", isMe: false },
      { userId: "yo", role: "editor", displayName: "Yo", isMe: true },
    ]);
    getOrCreateActiveInvite.mockRejectedValueOnce(new Error("new row violates row-level security"));
    renderSheet();

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(messages.list.shareOnlyOwner),
    );
  });
});

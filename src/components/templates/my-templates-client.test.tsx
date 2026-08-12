import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MyTemplate } from "@/features/templates/api";
import messages from "@/i18n/messages/es.json";
import { MyTemplatesClient } from "./my-templates-client";

const fetchMyTemplates = vi.fn<() => Promise<MyTemplate[]>>();
const deleteTemplate = vi.fn(async (_id: string) => {});
const renameTemplate = vi.fn(async (_id: string, _titulo: string) => {});
const createListFromMyTemplate = vi.fn(async () => ({ id: "lista-nueva" }));

vi.mock("@/features/templates/api", () => ({
  fetchMyTemplates: () => fetchMyTemplates(),
  deleteTemplate: (id: string) => deleteTemplate(id),
  renameTemplate: (id: string, titulo: string) => renameTemplate(id, titulo),
  createListFromMyTemplate: (...args: unknown[]) => createListFromMyTemplate(...(args as [])),
}));

/**
 * Se monta el contexto del App Router en vez de sustituir `next/navigation`
 * entero: mockear el módulo rompe la resolución que next-intl hace de él y no
 * llega a montarse nada (mismo motivo que en `my-lists-client.test.tsx`).
 */
const push = vi.fn();

function montar() {
  const router = {
    push,
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  };

  return render(
    <AppRouterContext.Provider value={router as unknown as AppRouterInstance}>
      <NextIntlClientProvider locale="es" messages={messages}>
        <MyTemplatesClient />
      </NextIntlClientProvider>
    </AppRouterContext.Provider>,
  );
}

const semanal: MyTemplate = {
  id: "p1",
  title: "Semanal de casa",
  createdAt: "2026-08-01T00:00:00Z",
  itemCount: 12,
};

beforeEach(() => {
  fetchMyTemplates.mockResolvedValue([semanal]);
  push.mockClear();
  deleteTemplate.mockClear();
  renameTemplate.mockClear();
});
afterEach(cleanup);

describe("MyTemplatesClient", () => {
  it("enseña las plantillas con cuántos productos llevan", async () => {
    montar();

    expect(await screen.findByText("Semanal de casa")).toBeInTheDocument();
    expect(screen.getByText("12 productos")).toBeInTheDocument();
  });

  // El estado vacío es la primera pantalla que ve todo el mundo: si no explica
  // dónde está el botón de guardar, la función no existe para nadie.
  it("sin plantillas explica dónde se guardan", async () => {
    fetchMyTemplates.mockResolvedValue([]);
    montar();

    expect(await screen.findByText(messages.templatesMine.emptyTitle)).toBeInTheDocument();
    expect(screen.getByText(messages.templatesMine.emptyBody)).toBeInTheDocument();
  });

  it("«Usar» crea la lista y lleva a ella", async () => {
    montar();
    await userEvent.click(await screen.findByRole("button", { name: "Usar" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/l/lista-nueva"));
    expect(createListFromMyTemplate).toHaveBeenCalledWith("p1", "Semanal de casa", "es");
  });

  // Borrar sin preguntar sería tirar algo que costó construir; una plantilla
  // no tiene deshacer.
  it("borrar pide confirmación antes de nada", async () => {
    montar();
    await userEvent.click(await screen.findByRole("button", { name: "Borrar" }));

    expect(screen.getByText(messages.templatesMine.deleteConfirm)).toBeInTheDocument();
    expect(deleteTemplate).not.toHaveBeenCalled();

    // La fila de acciones se sustituye por la confirmación, así que ya sólo
    // queda un botón «Borrar»: el que borra de verdad.
    await userEvent.click(screen.getByRole("button", { name: "Borrar" }));
    await waitFor(() => expect(deleteTemplate).toHaveBeenCalledWith("p1"));
    expect(screen.queryByText("Semanal de casa")).not.toBeInTheDocument();
  });

  it("renombrar guarda al salir del campo", async () => {
    montar();
    await userEvent.click(await screen.findByRole("button", { name: "Renombrar" }));

    const campo = screen.getByRole("textbox", { name: messages.templatesMine.nameLabel });
    await userEvent.clear(campo);
    await userEvent.type(campo, "Compra del mes");
    await userEvent.tab();

    await waitFor(() => expect(renameTemplate).toHaveBeenCalledWith("p1", "Compra del mes"));
    expect(screen.getByText("Compra del mes")).toBeInTheDocument();
  });

  it("si falla la carga lo dice en vez de quedarse en blanco", async () => {
    fetchMyTemplates.mockRejectedValue(new Error("permission denied"));
    montar();

    expect(await screen.findByRole("alert")).toHaveTextContent("permission denied");
  });
});

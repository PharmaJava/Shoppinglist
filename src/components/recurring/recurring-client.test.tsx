import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RecurringList } from "@/features/recurring/api";
import type { MyTemplate } from "@/features/templates/api";
import messages from "@/i18n/messages/es.json";
import { RecurringClient } from "./recurring-client";

const fetchRecurringLists = vi.fn<() => Promise<RecurringList[]>>();
const createRecurringList = vi.fn(async (_nueva: unknown) => {});
const deleteRecurringList = vi.fn(async (_id: string) => {});
const setRecurringActive = vi.fn(async (_id: string, _activa: boolean) => {});
const runRecurringNow = vi.fn(async (_id: string) => "lista-nueva");
const fetchMyTemplates = vi.fn<() => Promise<MyTemplate[]>>();

vi.mock("@/features/recurring/api", () => ({
  fetchRecurringLists: () => fetchRecurringLists(),
  createRecurringList: (nueva: unknown) => createRecurringList(nueva),
  deleteRecurringList: (id: string) => deleteRecurringList(id),
  setRecurringActive: (id: string, activa: boolean) => setRecurringActive(id, activa),
  runRecurringNow: (id: string) => runRecurringNow(id),
}));

// Igual que en `finish-sheet.test.tsx`: el módulo de plantillas arrastra el
// cliente de Supabase, que exige sus variables de entorno al cargarse.
vi.mock("@/features/templates/api", () => ({
  fetchMyTemplates: () => fetchMyTemplates(),
}));

/**
 * Se monta el contexto del App Router en vez de sustituir `next/navigation`:
 * mockear ese módulo rompe la resolución que hace next-intl.
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
        <RecurringClient />
      </NextIntlClientProvider>
    </AppRouterContext.Provider>,
  );
}

const plantilla: MyTemplate = {
  id: "p1",
  title: "Compra semanal",
  createdAt: "2026-08-01T00:00:00Z",
  itemCount: 12,
};

function programada(parcial: Partial<RecurringList> = {}): RecurringList {
  return {
    id: "r1",
    templateId: "p1",
    templateTitle: "Compra semanal",
    title: "Compra semanal",
    cadence: "weekly",
    weekday: 5,
    dayOfMonth: null,
    nextRunOn: "2026-08-21",
    lastRunOn: null,
    lastListId: null,
    active: true,
    ...parcial,
  };
}

beforeEach(() => {
  vi.setSystemTime(new Date(2026, 7, 15));
  fetchRecurringLists.mockResolvedValue([]);
  fetchMyTemplates.mockResolvedValue([plantilla]);
  createRecurringList.mockClear();
  deleteRecurringList.mockClear();
  setRecurringActive.mockClear();
  runRecurringNow.mockClear();
  push.mockClear();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("RecurringClient", () => {
  it("sin nada programado dice cómo empezar", async () => {
    montar();

    expect(await screen.findByText(messages.recurring.emptyTitle)).toBeInTheDocument();
  });

  /**
   * Una lista automática sale de una plantilla. Sin plantillas no hay nada que
   * repetir, y enseñar un formulario con un desplegable vacío sólo consigue
   * que la gente crea que está roto.
   */
  it("sin plantillas manda a crearlas en vez de enseñar el formulario", async () => {
    fetchMyTemplates.mockResolvedValue([]);
    montar();

    expect(await screen.findByText(messages.recurring.noTemplates)).toBeInTheDocument();
    expect(screen.queryByLabelText("Plantilla")).not.toBeInTheDocument();
  });

  it("al elegir la plantilla propone su nombre para la lista", async () => {
    montar();
    await screen.findByLabelText("Plantilla");

    await userEvent.selectOptions(screen.getByLabelText("Plantilla"), "p1");

    expect(screen.getByLabelText("Nombre de la lista")).toHaveValue("Compra semanal");
  });

  it("programa con la periodicidad elegida", async () => {
    montar();
    await screen.findByLabelText("Plantilla");

    await userEvent.selectOptions(screen.getByLabelText("Plantilla"), "p1");
    await userEvent.selectOptions(screen.getByLabelText("Día de la semana"), "5");
    await userEvent.click(screen.getByRole("button", { name: "Programar" }));

    await waitFor(() =>
      expect(createRecurringList).toHaveBeenCalledWith(
        expect.objectContaining({ templateId: "p1", cadence: "weekly", weekday: 5 }),
      ),
    );
  });

  /**
   * «Cada mes los martes» no significa nada. Al elegir mensual el día de la
   * semana desaparece y aparece el del mes, que es lo que la base de datos
   * acepta (restricción `recurring_lists_cadence_fields`).
   */
  it("en mensual se pide el día del mes, no el de la semana", async () => {
    montar();
    await screen.findByLabelText("Cada cuánto");

    await userEvent.selectOptions(screen.getByLabelText("Cada cuánto"), "monthly");

    expect(screen.getByLabelText("Día del mes")).toBeInTheDocument();
    expect(screen.queryByLabelText("Día de la semana")).not.toBeInTheDocument();
  });

  it("no deja pasar del día 28", async () => {
    montar();
    await screen.findByLabelText("Cada cuánto");
    await userEvent.selectOptions(screen.getByLabelText("Cada cuánto"), "monthly");

    const campo = screen.getByLabelText("Día del mes");
    await userEvent.clear(campo);
    await userEvent.type(campo, "31");

    expect(campo).toHaveValue(28);
  });

  it("cuenta cuándo es la siguiente y de qué plantilla sale", async () => {
    fetchRecurringLists.mockResolvedValue([programada()]);
    montar();

    expect(await screen.findByText("Cada semana, los viernes")).toBeInTheDocument();
    expect(screen.getByText("De la plantilla «Compra semanal»")).toBeInTheDocument();
    expect(screen.getByText(/viernes, 21 de agosto/)).toBeInTheDocument();
    expect(screen.getByText(/dentro de 6 días/)).toBeInTheDocument();
  });

  it("la que está en pausa se ve, y sin fecha de la siguiente", async () => {
    fetchRecurringLists.mockResolvedValue([programada({ active: false })]);
    montar();

    expect(await screen.findByText("En pausa")).toBeInTheDocument();
    expect(screen.queryByText(/Próxima/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reanudar" })).toBeInTheDocument();
  });

  it("«crear ahora» lleva a la lista recién creada", async () => {
    fetchRecurringLists.mockResolvedValue([programada()]);
    montar();
    await screen.findByRole("button", { name: "Crear ahora" });

    await userEvent.click(screen.getByRole("button", { name: "Crear ahora" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/l/lista-nueva"));
  });

  it("borrar pregunta antes", async () => {
    fetchRecurringLists.mockResolvedValue([programada()]);
    montar();
    await screen.findByRole("heading", { name: "Compra semanal" });

    await userEvent.click(screen.getByRole("button", { name: "Borrar" }));
    expect(deleteRecurringList).not.toHaveBeenCalled();
    expect(screen.getByText(messages.recurring.deleteConfirm)).toBeInTheDocument();

    // Ya sólo queda el «Borrar» de la confirmación, junto a «Cancelar».
    await userEvent.click(screen.getByRole("button", { name: "Borrar" }));

    await waitFor(() => expect(deleteRecurringList).toHaveBeenCalledWith("r1"));
  });

  it("si falla la carga lo dice en vez de quedarse en blanco", async () => {
    fetchRecurringLists.mockRejectedValue(new Error("permission denied"));
    montar();

    expect(await screen.findByRole("alert")).toHaveTextContent("permission denied");
  });
});

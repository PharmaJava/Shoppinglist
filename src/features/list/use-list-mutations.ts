"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import type { Locale } from "@/lib/supabase/types";
import {
  addParsedItems,
  addSection,
  deleteItem,
  deleteSection,
  type ItemEdits,
  renameSection,
  restoreItem,
  toggleItem,
  updateItem,
} from "./api";
import type { ParsedVoiceItem } from "./parse-voice";
import type { ListItem, ListSection, ListWithItems } from "./types";

function findItem(current: ListWithItems | undefined, itemId: string): ListItem | undefined {
  return current?.items.find((item) => item.id === itemId);
}

/**
 * Añade uno o varios productos. Es la única vía de alta desde la interfaz —
 * teclado, voz y sugerencias pasan por aquí— y por eso es también el punto
 * donde `addParsedItems` alimenta el historial personal.
 */
export function useAddParsedItems(listId: string, sectionId: string | null = null) {
  const queryClient = useQueryClient();
  const locale = useLocale() as Locale;
  const queryKey = ["list", listId] as const;

  return useMutation({
    mutationFn: (items: ParsedVoiceItem[]) => {
      const current = queryClient.getQueryData<ListWithItems>(queryKey);
      const lastItem = current?.items.at(-1);
      return addParsedItems(listId, items, locale, lastItem?.sort_key ?? null, sectionId);
    },
    onSuccess: (created) => {
      queryClient.setQueryData<ListWithItems>(queryKey, (current) => {
        if (!current) return current;
        const existingIds = new Set(current.items.map((item) => item.id));
        const toAdd = created.filter((item) => !existingIds.has(item.id));
        return { ...current, items: [...current.items, ...toAdd] };
      });
    },
  });
}

export function useToggleItem(listId: string) {
  const queryClient = useQueryClient();
  const queryKey = ["list", listId] as const;

  return useMutation({
    mutationFn: ({ itemId, isChecked }: { itemId: string; isChecked: boolean }) => {
      const current = queryClient.getQueryData<ListWithItems>(queryKey);
      const item = findItem(current, itemId);
      if (!item) throw new Error(`Producto ${itemId} no encontrado en caché.`);
      return toggleItem(item, isChecked);
    },
    onMutate: async ({ itemId, isChecked }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ListWithItems>(queryKey);

      queryClient.setQueryData<ListWithItems>(queryKey, (current) => {
        if (!current) return current;
        return {
          ...current,
          items: current.items.map((item) =>
            item.id === itemId ? { ...item, is_checked: isChecked } : item,
          ),
        };
      });

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
  });
}

export function useDeleteItem(listId: string) {
  const queryClient = useQueryClient();
  const queryKey = ["list", listId] as const;

  return useMutation({
    // Recibe la fila entera, no su id. Buscarla en la caché aquí no funciona:
    // `onMutate` corre ANTES que `mutationFn` y ya la ha quitado, así que la
    // búsqueda fallaba siempre, `onError` restauraba la lista y el producto
    // reaparecía — el borrado no llegaba a ejecutarse nunca.
    // Devuelve la fila para que el aviso pueda ofrecer deshacer.
    mutationFn: async (item: ListItem) => {
      await deleteItem(item);
      return item;
    },
    onMutate: async (item: ListItem) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ListWithItems>(queryKey);

      queryClient.setQueryData<ListWithItems>(queryKey, (current) => {
        if (!current) return current;
        return { ...current, items: current.items.filter((entry) => entry.id !== item.id) };
      });

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
  });
}

export function useUpdateItem(listId: string) {
  const queryClient = useQueryClient();
  const queryKey = ["list", listId] as const;

  return useMutation({
    mutationFn: ({ itemId, edits }: { itemId: string; edits: ItemEdits }) => {
      const current = queryClient.getQueryData<ListWithItems>(queryKey);
      const item = findItem(current, itemId);
      if (!item) throw new Error(`Producto ${itemId} no encontrado en caché.`);
      return updateItem(item, edits);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<ListWithItems>(queryKey, (current) => {
        if (!current) return current;
        return {
          ...current,
          items: current.items.map((item) => (item.id === updated.id ? updated : item)),
        };
      });
    },
  });
}

/**
 * Devuelve a la lista un producto recién borrado. Recibe la fila entera y no
 * un id porque para entonces ya no está en la caché — es justo lo que hizo el
 * borrado optimista.
 */
export function useRestoreItem(listId: string) {
  const queryClient = useQueryClient();
  const queryKey = ["list", listId] as const;

  return useMutation({
    mutationFn: (item: ListItem) => restoreItem(item),
    onSuccess: (restored) => {
      queryClient.setQueryData<ListWithItems>(queryKey, (current) => {
        if (!current) return current;
        if (current.items.some((item) => item.id === restored.id)) return current;
        return { ...current, items: [...current.items, restored] };
      });
    },
  });
}

/** Una sección nueva al final. Devuelve la sección para que quien la pidió
 *  pueda dejarla elegida y empezar a llenarla. */
export function useAddSection(listId: string) {
  const queryClient = useQueryClient();
  const queryKey = ["list", listId] as const;

  return useMutation({
    mutationFn: (name: string) => {
      const current = queryClient.getQueryData<ListWithItems>(queryKey);
      return addSection(listId, name, current?.sections.at(-1)?.sort_key ?? null);
    },
    onSuccess: (created) => {
      queryClient.setQueryData<ListWithItems>(queryKey, (current) => {
        if (!current || current.sections.some((section) => section.id === created.id)) {
          return current;
        }
        return { ...current, sections: [...current.sections, created] };
      });
    },
  });
}

export function useRenameSection(listId: string) {
  const queryClient = useQueryClient();
  const queryKey = ["list", listId] as const;

  return useMutation({
    mutationFn: ({ section, name }: { section: ListSection; name: string }) =>
      renameSection(section, name),
    onSuccess: (renamed) => {
      queryClient.setQueryData<ListWithItems>(queryKey, (current) =>
        current
          ? {
              ...current,
              sections: current.sections.map((section) =>
                section.id === renamed.id ? renamed : section,
              ),
            }
          : current,
      );
    },
  });
}

/** Quita la sección y lo que lleva dentro, de la pantalla y del servidor. */
export function useDeleteSection(listId: string) {
  const queryClient = useQueryClient();
  const queryKey = ["list", listId] as const;

  return useMutation({
    mutationFn: async (section: ListSection) => {
      const current = queryClient.getQueryData<ListWithItems>(queryKey);
      const inside = (current?.items ?? []).filter((item) => item.section_id === section.id);
      await deleteSection(section, inside);
    },
    onSuccess: (_result, section) => {
      queryClient.setQueryData<ListWithItems>(queryKey, (current) =>
        current
          ? {
              ...current,
              sections: current.sections.filter((entry) => entry.id !== section.id),
              items: current.items.filter((item) => item.section_id !== section.id),
            }
          : current,
      );
    },
  });
}

/**
 * «Empezar de nuevo»: desmarca todo lo marcado. Es lo que se hace con una
 * lista de equipaje en vez de borrarla — la mochila del lunes es la misma que
 * la del viernes.
 */
export function useResetPacking(listId: string) {
  const queryClient = useQueryClient();
  const queryKey = ["list", listId] as const;

  return useMutation({
    mutationFn: async () => {
      const current = queryClient.getQueryData<ListWithItems>(queryKey);
      const checked = (current?.items ?? []).filter((item) => item.is_checked);
      return Promise.all(checked.map((item) => toggleItem(item, false)));
    },
    onSuccess: (unchecked) => {
      const byId = new Map(unchecked.map((item) => [item.id, item]));
      queryClient.setQueryData<ListWithItems>(queryKey, (current) =>
        current
          ? { ...current, items: current.items.map((item) => byId.get(item.id) ?? item) }
          : current,
      );
    },
  });
}

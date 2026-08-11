"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import type { Locale } from "@/lib/supabase/types";
import {
  addParsedItems,
  deleteItem,
  type ItemEdits,
  restoreItem,
  toggleItem,
  updateItem,
} from "./api";
import type { ParsedVoiceItem } from "./parse-voice";
import type { ListItem, ListWithItems } from "./types";

function findItem(current: ListWithItems | undefined, itemId: string): ListItem | undefined {
  return current?.items.find((item) => item.id === itemId);
}

/**
 * Añade uno o varios productos. Es la única vía de alta desde la interfaz —
 * teclado, voz y sugerencias pasan por aquí— y por eso es también el punto
 * donde `addParsedItems` alimenta el historial personal.
 */
export function useAddParsedItems(listId: string) {
  const queryClient = useQueryClient();
  const locale = useLocale() as Locale;
  const queryKey = ["list", listId] as const;

  return useMutation({
    mutationFn: (items: ParsedVoiceItem[]) => {
      const current = queryClient.getQueryData<ListWithItems>(queryKey);
      const lastItem = current?.items.at(-1);
      return addParsedItems(listId, items, locale, lastItem?.sort_key ?? null);
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

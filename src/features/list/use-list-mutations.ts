"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import type { Locale } from "@/lib/supabase/types";
import { addItem, addParsedItems, deleteItem, toggleItem } from "./api";
import type { ParsedVoiceItem } from "./parse-voice";
import type { ListItem, ListWithItems } from "./types";

function findItem(current: ListWithItems | undefined, itemId: string): ListItem | undefined {
  return current?.items.find((item) => item.id === itemId);
}

export function useAddItem(listId: string) {
  const queryClient = useQueryClient();
  const locale = useLocale() as Locale;
  const queryKey = ["list", listId] as const;

  return useMutation({
    mutationFn: (name: string) => {
      const current = queryClient.getQueryData<ListWithItems>(queryKey);
      const lastItem = current?.items.at(-1);
      return addItem(listId, name, locale, lastItem?.sort_key ?? null);
    },
    onSuccess: (created) => {
      queryClient.setQueryData<ListWithItems>(queryKey, (current) => {
        if (!current) return current;
        if (current.items.some((item) => item.id === created.id)) return current;
        return { ...current, items: [...current.items, created] };
      });
    },
  });
}

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
    mutationFn: (itemId: string) => {
      const current = queryClient.getQueryData<ListWithItems>(queryKey);
      const item = findItem(current, itemId);
      if (!item) throw new Error(`Producto ${itemId} no encontrado en caché.`);
      return deleteItem(item);
    },
    onMutate: async (itemId: string) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ListWithItems>(queryKey);

      queryClient.setQueryData<ListWithItems>(queryKey, (current) => {
        if (!current) return current;
        return { ...current, items: current.items.filter((item) => item.id !== itemId) };
      });

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
  });
}

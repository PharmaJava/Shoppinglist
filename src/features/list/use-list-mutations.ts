"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import type { Locale } from "@/lib/supabase/types";
import { addItem, deleteItem, toggleItem } from "./api";
import type { ListWithItems } from "./types";

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

export function useToggleItem(listId: string) {
  const queryClient = useQueryClient();
  const queryKey = ["list", listId] as const;

  return useMutation({
    mutationFn: ({ itemId, isChecked }: { itemId: string; isChecked: boolean }) =>
      toggleItem(itemId, isChecked),
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
    mutationFn: (itemId: string) => deleteItem(itemId),
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

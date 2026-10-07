"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import type { ListWithItems } from "./types";

/**
 * Abre una lista recién creada sin volver a pedirla.
 *
 * Quien la acaba de crear ya tiene la lista y sus productos en la mano: se
 * dejan en la caché que lee `/l/[id]` y la página se pinta al instante, en vez
 * de enseñar un «cargando» para traer del servidor lo mismo que se le acaba de
 * mandar.
 *
 * El panel de «Mis listas» se marca como desactualizado pero no se espera a
 * recargarlo: esperarlo retrasaba la navegación una ida y vuelta entera para
 * algo que nadie está mirando.
 */
export function useOpenNewList() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useCallback(
    (created: ListWithItems) => {
      queryClient.setQueryData<ListWithItems>(["list", created.list.id], created);
      void queryClient.invalidateQueries({ queryKey: ["my-lists"] });
      router.push(`/l/${created.list.id}`);
    },
    [queryClient, router],
  );
}

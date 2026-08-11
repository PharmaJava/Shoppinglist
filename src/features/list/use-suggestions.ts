"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { useMemo } from "react";
import type { Locale } from "@/lib/supabase/types";
import { loadProductCatalog } from "./catalog";
import { fetchProductHistory } from "./history";
import { type Suggestion, suggestProducts } from "./suggest";

/** El historial personal, cacheado toda la sesión: cambia poco y se usa mucho. */
export function useProductHistory() {
  return useQuery({
    queryKey: ["product-history"],
    queryFn: () => fetchProductHistory(),
    staleTime: 10 * 60 * 1000,
    // Sin sesión devuelve una lista vacía, no un error: no hay nada que
    // reintentar y un invitado nuevo es el caso normal.
    retry: false,
  });
}

/**
 * Sugerencias para lo que se está escribiendo, combinando historial y
 * catálogo. Ambas fuentes fallan hacia una lista vacía, así que la barra de
 * añadir funciona igual sin ellas.
 */
export function useSuggestions(query: string, excludeNormalized: Iterable<string>): Suggestion[] {
  const locale = useLocale() as Locale;
  const history = useProductHistory();

  const catalog = useQuery({
    queryKey: ["product-catalog", locale],
    queryFn: () => loadProductCatalog(locale),
    // El catálogo no cambia durante una sesión, pero sin red la carga
    // devuelve una lista vacía; caducar cada media hora hace que una sesión
    // larga acabe recuperándolo sola en vez de quedarse sin sugerencias.
    staleTime: 30 * 60 * 1000,
    retry: false,
  });

  const exclude = useMemo(() => [...excludeNormalized], [excludeNormalized]);

  return useMemo(
    () =>
      suggestProducts(query, {
        history: history.data ?? [],
        catalog: catalog.data ?? [],
        exclude,
      }),
    [query, history.data, catalog.data, exclude],
  );
}

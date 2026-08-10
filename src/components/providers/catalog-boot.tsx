"use client";

import { useLocale } from "next-intl";
import { useEffect } from "react";
import { loadProductCatalog } from "@/features/list/catalog";
import type { Locale } from "@/lib/supabase/types";

/** Precarga el catálogo de productos del idioma activo, en segundo plano. */
export function CatalogBoot() {
  const locale = useLocale() as Locale;

  useEffect(() => {
    void loadProductCatalog(locale);
  }, [locale]);

  return null;
}

import type { Locale } from "@/lib/supabase/types";
import type { Category, ListItem } from "./types";

interface ToTextOptions {
  title: string;
  items: ListItem[];
  categories: Category[];
  locale: Locale;
  /** Encabezado de la sección de productos ya comprados. */
  checkedLabel: string;
  otherLabel: string;
}

/**
 * Convierte una lista en texto plano para pegar en un chat o una nota.
 *
 * Es lo que la gente hace igualmente —copiar la lista a mano al WhatsApp del
 * grupo— y el enlace no siempre vale: a veces el otro sólo quiere leerla, no
 * entrar a editarla.
 *
 * Conserva el agrupado por pasillo porque es la mitad del valor de la lista, y
 * deja lo ya comprado al final, tachado con un guion, para que se distinga sin
 * depender de emojis que no todos los teclados pintan igual.
 */
export function listToText({
  title,
  items,
  categories,
  locale,
  checkedLabel,
  otherLabel,
}: ToTextOptions): string {
  const order = new Map(categories.map((category) => [category.id, category.sort_order]));
  const label = new Map(
    categories.map((category) => [
      category.id,
      locale === "es" ? category.name_es : category.name_en,
    ]),
  );

  const pending = items.filter((item) => !item.is_checked);
  const checked = items.filter((item) => item.is_checked);

  const buckets = new Map<string, ListItem[]>();
  for (const item of pending) {
    const key = item.category_id ?? "other";
    buckets.set(key, [...(buckets.get(key) ?? []), item]);
  }

  const blocks = [...buckets.entries()]
    .sort((a, b) => (order.get(a[0]) ?? 999) - (order.get(b[0]) ?? 999))
    .map(([categoryId, group]) => {
      const heading = label.get(categoryId) ?? otherLabel;
      return [heading, ...group.map((item) => `- ${line(item)}`)].join("\n");
    });

  if (checked.length > 0) {
    blocks.push([checkedLabel, ...checked.map((item) => `- ${line(item)}`)].join("\n"));
  }

  return [title, "", ...interleave(blocks)].join("\n").trimEnd();
}

function line(item: ListItem): string {
  if (item.qty === null) return item.name;
  return item.unit ? `${item.name} — ${item.qty} ${item.unit}` : `${item.name} — ${item.qty}`;
}

/** Una línea en blanco entre bloques, ninguna al final. */
function interleave(blocks: string[]): string[] {
  return blocks.flatMap((block, index) => (index === 0 ? [block] : ["", block]));
}

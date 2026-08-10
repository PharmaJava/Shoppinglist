import type { AppLocale } from "@/i18n/routing";

interface DemoItem {
  name: string;
  qty?: string;
  emoji: string;
  checked?: boolean;
}

/** Productos de ejemplo del mockup. Decorativos: van con aria-hidden, así que
 *  no pasan por i18n de mensajes — sólo cambia el idioma del texto pintado. */
const DEMO_ITEMS: Record<AppLocale, DemoItem[]> = {
  es: [
    { name: "Tomates", qty: "1 kg", emoji: "🥦" },
    { name: "Leche", qty: "6 briks", emoji: "🥛", checked: true },
    { name: "Pan", emoji: "🍞", checked: true },
    { name: "Pollo", qty: "700 g", emoji: "🍖" },
    { name: "Aceite de oliva", emoji: "🥫" },
  ],
  en: [
    { name: "Tomatoes", qty: "2 lb", emoji: "🥦" },
    { name: "Milk", qty: "1 gal", emoji: "🥛", checked: true },
    { name: "Bread", emoji: "🍞", checked: true },
    { name: "Chicken", qty: "1.5 lb", emoji: "🍖" },
    { name: "Olive oil", emoji: "🥫" },
  ],
};

/**
 * Maqueta estática de una lista, para el hero de la landing: enseña el
 * producto (items por pasillo, marcados en tiempo real) sin cargar nada de la
 * app real. Decorativa a propósito — cero JS, oculta para lectores de
 * pantalla, que ya tienen el mismo mensaje en el texto del hero.
 */
export function ListMockup({
  locale,
  title,
  badge,
}: {
  locale: AppLocale;
  title: string;
  badge: string;
}) {
  const items = DEMO_ITEMS[locale];

  return (
    <div aria-hidden="true" className="relative w-full max-w-sm select-none">
      {/* Tarjeta trasera: sugiere el segundo móvil sincronizado. */}
      <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-2xl bg-brand/15" />

      <div className="relative flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 shadow-lg">
        <div className="flex items-center justify-between gap-2">
          <span className="font-bold text-on-surface">{title}</span>
          <span className="rounded-full bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand">
            {badge}
          </span>
        </div>

        <ul className="flex flex-col">
          {items.map((item) => (
            <li
              key={item.name}
              className="flex items-center gap-3 border-border border-b py-2.5 last:border-b-0"
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs ${
                  item.checked
                    ? "border-brand bg-brand text-brand-contrast"
                    : "border-border bg-surface"
                }`}
              >
                {item.checked ? "✓" : ""}
              </span>
              <span className="text-sm" role="presentation">
                {item.emoji}
              </span>
              <span
                className={`flex-1 text-sm ${
                  item.checked ? "text-on-surface-muted line-through" : "text-on-surface"
                }`}
              >
                {item.name}
              </span>
              {item.qty && <span className="text-xs text-on-surface-muted">{item.qty}</span>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

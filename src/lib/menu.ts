/**
 * Menu helpers shared by the visible page and the machine-readable one.
 *
 * The price formatter lived inside MenuList.astro, where only the HTML could
 * reach it. /llms.txt needs the same prices in the same shape, and a second
 * copy of a formatter is a second place for the currency rules to drift.
 */
import type { CollectionEntry } from "astro:content";
import { MENU_CATEGORIES } from "../content.config";
import { LOCALE } from "./site";

export type MenuEntry = CollectionEntry<"menu">;

/**
 * Prices as the shop writes them: $4 rather than $4.00, $4.50 when there are
 * cents.
 *
 * The number formatting follows the interface language, not the currency.
 * They are two different questions: WHICH money (the item's `currency`
 * field) and HOW a reader of this language writes numbers. Hard-coded to
 * en-US, a Turkish cafe selling in lira got `TRY 1,250.75` — wrong symbol
 * position, wrong decimal mark, wrong thousands mark. With the locale it is
 * `₺1.250,75`.
 */
const NUMBER_LOCALE: Record<string, string> = { en: "en-US", tr: "tr-TR" };

export const formatPrice = (value: number, currency: string) =>
  new Intl.NumberFormat(NUMBER_LOCALE[LOCALE] ?? "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);

/** Items a customer can actually order, in menu order, grouped by category. */
export function availableByCategory(items: MenuEntry[]) {
  const live = items.filter((i) => i.data.available);
  return MENU_CATEGORIES.map((category) => ({
    category,
    items: live
      .filter((i) => i.data.category === category)
      .sort((a, b) => a.data.order - b.data.order),
  })).filter((group) => group.items.length > 0);
}

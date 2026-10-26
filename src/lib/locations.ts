/**
 * locations.ts — read helpers for the shop collection.
 *
 * A cafe visitor's first question is where it is and whether it is open, so
 * the shop data is read in one place and both the interface and the
 * schema.org output draw on it. The difference between one shop and five is
 * a file, not a code path.
 */
import { getCollection, type CollectionEntry } from "astro:content";
import { readFileSync } from "node:fs";
import { hoursSchema, openingHoursSpec, type Hours } from "@studio/core/utils/hours";

export type Location = CollectionEntry<"locations">;

/* Files already warned about in this build (pages read the shops many times). */
const warned = new Set<string>();

/**
 * A location file still writing `hours` as rows (`- dayOfWeek: [...]`, the
 * format before the week) keeps building: the collection schema reads the
 * rows into the week (src/content.config.ts, weekFromRows). The build says
 * so once per file, with the way to rewrite it.
 */
function warnOldHours(entry: Location): void {
  const file = entry.filePath;
  if (!file || warned.has(file)) return;
  warned.add(file);
  let text = "";
  try {
    text = readFileSync(file, "utf8");
  } catch {
    return;
  }
  /* Block rows (`hours:` then `- dayOfWeek: …`) or flow rows (`hours: [{ dayOfWeek: … }]`, `hours: []`). */
  if (!/^hours:[ \t]*(?:\r?\n[ \t]*-[ \t]|\[)/m.test(text)) return;
  console.warn(
    `\n  [larkin] ${file}: \`hours\` is in the old rows format (- dayOfWeek: [...]).\n` +
      `           It still builds; rewrite it as the week, one entry per day:\n` +
      `             hours:\n               mon:\n                 open: "07:00"\n                 close: "18:00"\n` +
      `               ...\n               sun:\n                 closed: true\n` +
      `           All seven days (mon ... sun). docs/README.md, section 4, "Locations".\n`
  );
}

/** Every shop, in order. */
export async function getLocations(): Promise<Location[]> {
  const all = await getCollection("locations");
  for (const entry of all) warnOldHours(entry);
  return all.sort((a, b) => a.data.order - b.data.order);
}

/** The main shop: whichever is marked `primary: true`, else the first. */
export async function getPrimaryLocation(): Promise<Location | undefined> {
  const all = await getLocations();
  return all.find((l) => l.data.primary) ?? all[0];
}

/** The postal address on one line. */
export function formatAddress(loc: Location): string {
  const d = loc.data;
  return `${d.streetAddress}, ${d.addressLocality}, ${d.addressRegion} ${d.postalCode}`;
}

/** Day keys of the week, index 0 = Sunday (the order `dayLabels` and `WEEK_ORDER` use). */
const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

/**
 * Day index (0 = Sunday) to a "07:00 - 18:00" range, from the shop's week
 * (`hours`: mon…sun, each `{ open, close }` or `{ closed: true }`).
 * A closed day returns an empty string.
 */
export function weeklyRanges(loc: Location): string[] {
  const week = weekOf(loc);
  return DAY_KEYS.map((key) => {
    const day = week[key];
    return day.closed === true ? "" : `${day.open} - ${day.close}`;
  });
}

/**
 * The shop's week in core's format. The collection schema has already
 * checked it against `hoursSchema` (src/content.config.ts); reading it
 * through the same schema here drops the times beside a ticked "Closed all
 * day" and gives the week its type.
 */
export function weekOf(loc: Location): Hours {
  return hoursSchema.parse(loc.data.hours);
}

/**
 * schema.org's openingHoursSpecification for one shop, from core: consecutive
 * days with the same hours share an entry, a closed day is left out.
 */
export function openingHours(loc: Location) {
  return openingHoursSpec(weekOf(loc));
}

/**
 * Day names, in the order a week is read, from the active dictionary.
 *
 * These were hard-coded English arrays in two components at once
 * (SiteFooter and LocationCard). A Turkish site printed English day names in
 * the footer of every page, and no documented file could change them: the
 * strings sat outside the i18n layer entirely. Two copies also meant a fix in
 * one was invisible in the other.
 *
 * Index 0 is Sunday, matching the array `weeklyRanges` returns, so the two
 * line up.
 */
export function dayLabels(t: (key: string) => string): string[] {
  return DAY_KEYS.map((d) => t(`days.${d}`));
}

/** Monday-first reading order, as an index into the arrays above. */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

/**
 * The week's opening hours, with consecutive days that share a range collapsed
 * into one row — the way a shop writes them on the door.
 *
 * SINGLE SOURCE. The footer and the contact page both render this. The contact
 * page used to keep its own copy in the dictionary (`hours.monFriValue` and
 * friends), so hours lived in three places at once: the location file fed the
 * structured data, the "show all hours" list and llms.txt, while a second,
 * hand-typed set fed the table on /contact/. They agreed on the day they were
 * written and had no way of staying that way — and the documentation sends you
 * to the location file, which is exactly the one the table ignored.
 *
 * Returns `from`/`to` rather than a finished label because the connector is
 * translatable: building "Monday to Friday" here and splitting it later breaks
 * in any language that does not use that word.
 */
export function groupedHours(
  loc: Location | undefined,
  t: (key: string, params?: Record<string, string | number>) => string
): { from: string; to: string | null; value: string }[] {
  if (!loc) return [];
  const labels = dayLabels(t);
  const ranges = weeklyRanges(loc);
  const out: { from: string; to: string | null; value: string }[] = [];
  for (const i of WEEK_ORDER) {
    const value = ranges[i] || t("location.closedNow");
    const last = out[out.length - 1];
    if (last && last.value === value) last.to = labels[i];
    else out.push({ from: labels[i], to: null, value });
  }
  return out;
}

/** One row's label, joined with the translatable connector. */
export function hoursRowLabel(
  row: { from: string; to: string | null },
  t: (key: string, params?: Record<string, string | number>) => string
): string {
  return row.to ? t("days.range", { from: row.from, to: row.to }) : row.from;
}

/**
 * A schema.org node for every shop after the primary one.
 *
 * One business with two addresses cannot be one node: an address is singular
 * in schema.org, so a second shop that is not given its own node simply does
 * not exist to a machine. Each branch carries its own `@id`, address and
 * opening hours, and points back at the main business with `parentOrganization`
 * so the three are readable as one company rather than three.
 *
 * Takes the schema builder as an argument because the vertical decides the
 * type — a cafe branch is a CafeOrCoffeeShop, a clinic branch is not.
 */
export function branchNodes(
  locations: Location[],
  origin: string,
  build: (input: Record<string, unknown>) => unknown
): unknown[] {
  const primary = locations.find((l) => l.data.primary) ?? locations[0];
  return locations
    .filter((l) => l.id !== primary?.id)
    .map((loc) =>
      build({
        id: new URL(`/#business-${loc.id}`, origin).toString(),
        name: loc.data.name,
        streetAddress: loc.data.streetAddress,
        addressLocality: loc.data.addressLocality,
        addressRegion: loc.data.addressRegion,
        postalCode: loc.data.postalCode,
        addressCountry: loc.data.addressCountry,
        openingHours: openingHours(loc),
        parentOrganization: { "@id": new URL("/#business", origin).toString() },
      })
    );
}

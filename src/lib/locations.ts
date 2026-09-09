/**
 * locations.ts — read helpers for the shop collection.
 *
 * A cafe visitor's first question is where it is and whether it is open, so
 * the shop data is read in one place and both the interface and the
 * schema.org output draw on it. The difference between one shop and five is
 * a file, not a code path.
 */
import { getCollection, type CollectionEntry } from "astro:content";

export type Location = CollectionEntry<"locations">;

/** Every shop, in order. */
export async function getLocations(): Promise<Location[]> {
  const all = await getCollection("locations");
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

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

/**
 * Day index (0 = Sunday) to a "07:00 - 18:00" range.
 * A closed day returns an empty string. Built on the server and read in the
 * browser, because "today" has to be worked out from the visitor's clock
 * rather than from the time the site was built.
 */
export function weeklyRanges(loc: Location): string[] {
  const map: Record<string, string> = {};
  for (const h of loc.data.hours) {
    for (const d of h.dayOfWeek) map[d] = `${h.opens} - ${h.closes}`;
  }
  return DAYS.map((d) => map[d] ?? "");
}

/** Opening and closing minutes by day index, for the client-side check. */
export function weeklyMinutes(loc: Location): ([number, number] | null)[] {
  const toMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + (m || 0);
  };
  const map: Record<string, [number, number]> = {};
  for (const h of loc.data.hours) {
    for (const d of h.dayOfWeek) map[d] = [toMin(h.opens), toMin(h.closes)];
  }
  return DAYS.map((d) => map[d] ?? null);
}

/** One entry per row of schema.org's openingHoursSpecification. */
export function openingHours(loc: Location) {
  return loc.data.hours.map((h) => ({
    dayOfWeek: h.dayOfWeek,
    opens: h.opens,
    closes: h.closes,
  }));
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
 * Index 0 is Sunday, matching JavaScript's `Date.getDay()` and the arrays
 * `weeklyRanges` and `weeklyMinutes` return, so the three line up.
 */
export function dayLabels(t: (key: string) => string): string[] {
  return ["sun", "mon", "tue", "wed", "thu", "fri", "sat"].map((d) => t(`days.${d}`));
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

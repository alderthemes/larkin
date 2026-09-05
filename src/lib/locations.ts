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

/** schema.org openingHoursSpecification girdisi. */
export function openingHours(loc: Location) {
  return loc.data.hours.map((h) => ({
    dayOfWeek: h.dayOfWeek,
    opens: h.opens,
    closes: h.closes,
  }));
}

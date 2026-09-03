/**
 * locations.ts — şube collection'ının okuma yardımcıları.
 *
 * Cafe ziyaretçisinin ilk sorusu "nerede ve açık mı" (research.md §4), bu
 * yüzden şube verisi tek yerden okunur ve hem UI hem schema.org aynı kaynağı
 * kullanır. Tek şube ile çok şube arasındaki fark bir dosyadır, kod değil.
 */
import { getCollection, type CollectionEntry } from "astro:content";

export type Location = CollectionEntry<"locations">;

/** Sıralı tüm şubeler. */
export async function getLocations(): Promise<Location[]> {
  const all = await getCollection("locations");
  return all.sort((a, b) => a.data.order - b.data.order);
}

/** Ana şube: `primary: true` işaretli olan, yoksa ilk kayıt. */
export async function getPrimaryLocation(): Promise<Location | undefined> {
  const all = await getLocations();
  return all.find((l) => l.data.primary) ?? all[0];
}

/** Tek satırlık posta adresi. */
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
 * Gün indeksi (0 = Pazar) → "07:00 - 18:00" haritası.
 * Kapalı günler boş string döner. Sunucuda üretilir, istemcide okunur:
 * "bugün" hesabı ziyaretçinin saatine göre yapılmalı (build saatine göre değil).
 */
export function weeklyRanges(loc: Location): string[] {
  const map: Record<string, string> = {};
  for (const h of loc.data.hours) {
    for (const d of h.dayOfWeek) map[d] = `${h.opens} - ${h.closes}`;
  }
  return DAYS.map((d) => map[d] ?? "");
}

/** Açılış/kapanış dakikalarını gün indeksine göre verir (istemci hesabı için). */
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

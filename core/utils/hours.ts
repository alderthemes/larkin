/**
 * Opening hours: the week, written once, and everything built from it.
 *
 * The week lives in `src/data/business.json` → `hours`, one entry per day:
 *
 *   "hours": {
 *     "mon": { "open": "12:00", "close": "22:00" },
 *     ...
 *     "sun": { "closed": true }
 *   }
 *
 * All seven days are required, so a day cannot be forgotten. A closed day is
 * `{ "closed": true }` rather than `null`: the content editor writes an object
 * with a switch, and needs no special "may be empty" field for it (founder,
 * 2026-10-10). The editor's form has the three keys for every day, so it also
 * writes `{ "open": "", "close": "", "closed": true }` for a closed day and
 * `{ "open", "close", "closed": false }` for an open one (founder, 2026-10-13:
 * the schema reads the editor's shape; no site-wide "leave empty fields out"
 * switch, which would also change how the menu's allergen list is saved). A
 * ticked "Closed all day" wins: the times beside it are ignored. `close`
 * earlier than `open` means the day closes after midnight; `close` equal to
 * `open` is rejected.
 *
 * Nothing here reads the clock. Which day it is "today" depends on where the
 * visitor is and where the business is, so it is worked out in the browser,
 * in the business's time zone (hours-today.js), never at build time.
 */
import { z } from "astro/zod";

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
type DayKey = (typeof DAYS)[number];

/** schema.org day names, in the same order. */
const SCHEMA_DAYS: Record<DayKey, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'use 24-hour "HH:MM", e.g. "09:30"');

const openDay = z
  .strictObject({ open: time, close: time, closed: z.literal(false).optional() })
  .refine((d) => d.open !== d.close, "same opening and closing time; a closed day is { \"closed\": true }");
/* The editor keeps the (cleared or old) times beside the switch; they are ignored. */
const closedDay = z.strictObject({ closed: z.literal(true), open: z.string().optional(), close: z.string().optional() });

const day = z.union([openDay, closedDay]);

/** All seven days, each open with a range or closed; a missing day stops the build. */
export const hoursSchema = z.strictObject({ mon: day, tue: day, wed: day, thu: day, fri: day, sat: day, sun: day });

type Day = z.infer<typeof day>;
export type Hours = z.infer<typeof hoursSchema>;

const isOpen = (d: Day): d is { open: string; close: string; closed?: false } => d.closed !== true;

/** "12:00 – 22:00", or null on a closed day. The browser script prints the same form. */
function rangeText(day: Day): string | null {
  return isOpen(day) ? `${day.open} – ${day.close}` : null;
}

/** 1 January 2024 was a Monday; day i of the week is that date plus i. */
function dayName(day: DayKey, locale: string, style: "short" | "long"): string {
  const i = DAYS.indexOf(day);
  return new Intl.DateTimeFormat(locale, { weekday: style, timeZone: "UTC" }).format(new Date(Date.UTC(2024, 0, 1 + i)));
}

/** Runs of consecutive days (Monday first) that share the same hours. */
function runs(hours: Hours): DayKey[][] {
  const out: DayKey[][] = [];
  for (const day of DAYS) {
    const last = out.at(-1);
    if (last && rangeText(hours[last[0]]) === rangeText(hours[day])) last.push(day);
    else out.push([day]);
  }
  return out;
}

interface HoursRow {
  label: string;
  value: string;
}

/**
 * The week as table rows, Monday first. Consecutive days with the same hours
 * share a row ("Mon – Thu"); a day on its own gets its full name ("Sunday");
 * a closed day reads `closedLabel`. Day names come from `locale`.
 */
export function hoursRows(hours: Hours, locale: string, closedLabel: string): HoursRow[] {
  return runs(hours).map((run) => {
    const first = run[0];
    const last = run[run.length - 1];
    return {
      label: first === last ? dayName(first, locale, "long") : `${dayName(first, locale, "short")} – ${dayName(last, locale, "short")}`,
      value: rangeText(hours[first]) ?? closedLabel,
    };
  });
}

/**
 * What a "today" line says before the browser script runs, or when it
 * cannot: one sentence when every day opens at the same time (`openDaily`
 * gets that time), the whole week in one line otherwise, because a single
 * sentence would be wrong on some day.
 */
export function weeklyFallback(
  hours: Hours,
  locale: string,
  labels: { closed: string; openDaily: (opens: string) => string }
): string {
  const days = DAYS.map((d) => hours[d]);
  const opens = new Set(days.filter(isOpen).map((d) => d.open));
  if (days.every(isOpen) && opens.size === 1) return labels.openDaily([...opens][0]);
  return hoursRows(hours, locale, labels.closed)
    .map((r) => `${r.label} ${r.value}`)
    .join(" · ");
}

interface OpeningHoursSpec {
  dayOfWeek: string[];
  opens: string;
  closes: string;
}

/**
 * The week for schema.org's `openingHoursSpecification`: one entry per run of
 * consecutive days with the same hours.
 *
 * A day that closes after midnight is one entry on the day it opens, with
 * `closes` earlier than `opens`: schema.org ("If the value for the closes
 * property is less than the value for the opens property then the hour range
 * is assumed to span over the next day", OpeningHoursSpecification, V30.1,
 * 2026-09-16) and Google's LocalBusiness guide ("For hours past midnight,
 * define opening and closing hours using a single OpeningHoursSpecification
 * property", updated 2026-09-08) say the same. Founder confirmed, 2026-10-10.
 *
 * A closed day is left out, as the themes did before: schema.org reads a
 * place as closed when `opens` is not given. Google's guide suggests
 * "00:00"–"00:00" for a closed day instead; the two documents disagree on what
 * that means, so the themes keep their output (founder, 2026-10-10).
 */
export function openingHoursSpec(hours: Hours): OpeningHoursSpec[] {
  const out: OpeningHoursSpec[] = [];
  for (const run of runs(hours)) {
    const day = hours[run[0]];
    if (!isOpen(day)) continue;
    out.push({ dayOfWeek: run.map((d) => SCHEMA_DAYS[d]), opens: day.open, closes: day.close });
  }
  return out;
}

/**
 * Fills in today's opening hours, worked out for the business, not the visitor.
 *
 * The page ships the whole week as a sentence. This script replaces it with
 * today's range: "today" is the day it is where the business is
 * (`data-tz`, e.g. "Europe/London"), whatever time zone or language the
 * visitor's browser uses. A visitor in New York looking at a London cafe at
 * 1 a.m. their time sees London's day.
 *
 * Never a wrong "today": everything is worked out first, and only if every
 * line on the page can be filled is anything written. A missing or unknown
 * time zone, or hours that do not read, leave the weekly sentence in place.
 *
 * Why a file and not an inline script: the site's Content-Security-Policy is
 * `script-src 'self'` (public/_headers). An inline script is blocked SILENTLY:
 * the page loads, nothing looks broken, the line keeps the weekly sentence.
 *
 * Markup it reads (core/components/HoursToday.astro writes it):
 *   <p class="hours-today" data-hours='{"mon":{"open":"12:00","close":"22:00"},…}'
 *      data-tz="Europe/London" data-closed="Closed">
 *     … <span class="hours-today__value">weekly sentence</span>
 *   </p>
 * and, for today's row in a table, the "closed today" note and the "open now"
 * badge, the scopes described at fillHoursMarks below.
 */

const KEYS = {
  Mon: "mon",
  Tue: "tue",
  Wed: "wed",
  Thu: "thu",
  Fri: "fri",
  Sat: "sat",
  Sun: "sun",
};
const ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

/** The day ("mon"…"sun") and minute of the day at `now`, in `timeZone`. Throws on an unknown zone. */
export function localDayAndMinute(now, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type) => parts.find((p) => p.type === type)?.value;
  const day = KEYS[get("weekday")];
  const minute = Number(get("hour")) * 60 + Number(get("minute"));
  if (!day || !Number.isInteger(minute))
    throw new Error("could not read the local day");
  return { day, minute };
}

function readDay(entry) {
  if (entry && entry.closed === true) return null;
  if (
    entry &&
    HHMM.test(entry.open) &&
    HHMM.test(entry.close) &&
    entry.open !== entry.close
  )
    return entry;
  throw new Error("unreadable day");
}

const minutes = (hhmm) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3));

/** Today's line: "12:00 – 22:00", or `closedLabel`. Same text the server prints for a range. */
export function todayText(hours, timeZone, now, closedLabel) {
  const { day } = localDayAndMinute(now, timeZone);
  const range = readDay(hours[day]);
  return range ? `${range.open} – ${range.close}` : closedLabel;
}

/**
 * Open right now? Today's range, or yesterday's range if it runs past
 * midnight into today ("Fri 18:00 – 02:00" is open on Saturday at 01:00).
 */
export function isOpenNow(hours, timeZone, now) {
  const { day, minute } = localDayAndMinute(now, timeZone);
  const today = readDay(hours[day]);
  const yesterday = readDay(hours[ORDER[(ORDER.indexOf(day) + 6) % 7]]);
  if (today) {
    const open = minutes(today.open);
    const close = minutes(today.close);
    if (close > open ? minute >= open && minute < close : minute >= open)
      return true;
  }
  if (yesterday) {
    const open = minutes(yesterday.open);
    const close = minutes(yesterday.close);
    if (close < open && minute < close) return true;
  }
  return false;
}

/** Works out every line first; writes only if all of them could be worked out. */
export function fillHoursToday(root, now = new Date()) {
  const lines = [...root.querySelectorAll(".hours-today")];
  const writes = [];
  for (const el of lines) {
    const target = el.querySelector(".hours-today__value");
    const tz = el.dataset.tz;
    if (!target || !tz) return 0;
    let text;
    try {
      text = todayText(
        JSON.parse(el.dataset.hours || "{}"),
        tz,
        now,
        el.dataset.closed || "",
      );
    } catch {
      return 0;
    }
    if (!text) return 0;
    writes.push([target, text]);
  }
  for (const [target, text] of writes) target.textContent = text;
  return writes.length;
}

/**
 * The marks that depend on today, inside a scope the theme draws: an element
 * with `data-hours-scope`, `data-hours` (the week) and `data-tz`. One page can
 * hold several (a branch per card). Inside each scope:
 *   [data-hours-day="mon"]  today's row gets aria-current="date", and any
 *                           [data-today-flag] inside it is unhidden (the word
 *                           "Today": color alone would not carry it, WCAG 1.4.1)
 *   [data-closed-today]     unhidden when the business is closed today and
 *                           not open right now (a night that started
 *                           yesterday can still be open after midnight)
 *   [data-open-now]         its text becomes data-open-label or
 *                           data-closed-label, and data-state "open"/"closed"
 * Same rule as the line: everything is worked out first, and nothing is
 * written unless every scope on the page reads.
 */
export function fillHoursMarks(root, now = new Date()) {
  const scopes = [...root.querySelectorAll("[data-hours-scope]")];
  const plans = [];
  for (const scope of scopes) {
    const tz = scope.dataset.tz;
    if (!tz) return 0;
    let day, closed, open;
    try {
      const hours = JSON.parse(scope.dataset.hours || "{}");
      /* The whole week must read, not only today: a table marked from a week
         with a broken day would mark the right row of a wrong table. */
      for (const d of ORDER) readDay(hours[d]);
      ({ day } = localDayAndMinute(now, tz));
      closed = readDay(hours[day]) === null;
      open = isOpenNow(hours, tz, now);
    } catch {
      return 0;
    }
    plans.push({ scope, day, closed, open });
  }
  for (const { scope, day, closed, open } of plans) {
    for (const row of scope.querySelectorAll(`[data-hours-day="${day}"]`)) {
      row.setAttribute("aria-current", "date");
      for (const flag of row.querySelectorAll("[data-today-flag]"))
        flag.hidden = false;
    }
    for (const note of scope.querySelectorAll("[data-closed-today]"))
      note.hidden = !(closed && !open);
    for (const badge of scope.querySelectorAll("[data-open-now]")) {
      badge.textContent =
        (open ? badge.dataset.openLabel : badge.dataset.closedLabel) || "";
      badge.dataset.state = open ? "open" : "closed";
    }
  }
  return plans.length;
}

if (typeof document !== "undefined") {
  fillHoursToday(document);
  fillHoursMarks(document);
}

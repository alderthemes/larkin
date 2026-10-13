/**
 * The privacy and terms pages: their content collection and their date.
 *
 * Every theme keeps these two pages as markdown in src/content/legal/, and
 * each page carries the day it was last changed. The day is a date, not
 * free text, so the content editor can offer a date picker and the page can
 * print it in the site's language.
 *
 * Why every helper here formats in UTC: `updated: 2026-10-01` is read as
 * midnight UTC on that day. Formatted in the time zone of the computer that
 * builds the site, it becomes 30 September anywhere west of UTC. Formatting
 * in UTC prints the day that is written in the file, wherever the build runs.
 *
 * Why `defineCollection` comes from "astro/content/config" and not from
 * "astro:content": the same function, but typing "astro:content" here needs
 * Astro's generic client types, and those declare the site's content config
 * as `any`. Pulled into a theme's type check through this file, they won
 * over the theme's generated types, and every collection entry (menu items,
 * FAQ, these pages) lost its type.
 */
import { defineCollection } from "astro/content/config";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const DAY = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_ERROR = "use YYYY-MM-DD, e.g. 2026-10-01";

/**
 * The day, as midnight UTC, or the value unchanged when it is not a day.
 *
 * A file can hold the day two ways. Quoted, "2026-10-01" is text. Unquoted,
 * 2026-10-01 is already a date: the YAML reader makes it midnight UTC.
 * Anything else stays as written so the schema below rejects it with the
 * expected format. That includes "Sept 2026" and "01.10.2026", which a
 * looser date reader would accept and read in the build computer's time
 * zone (the second one as 9 January), a day that does not exist
 * ("2026-02-30"), and a date with a time of day: unquoted, YAML reads
 * 2026-10-01T10:00:00 as a date too, and keeping it would make the day
 * shown depend on the time written next to it.
 */
function toDay(value: unknown): unknown {
  if (value instanceof Date) {
    return !Number.isNaN(value.getTime()) && value.toISOString().endsWith("T00:00:00.000Z") ? value : String(value);
  }
  if (typeof value !== "string") return value;
  const m = DAY.exec(value);
  if (!m) return value;
  const date = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return isoDate(date) === value ? date : value;
}

/**
 * `updated`: only a day written YYYY-MM-DD, with or without quotes.
 * The input side is a plain date, so the content editor still sees a date
 * field and offers a date picker.
 */
const day = () => z.preprocess(toDay, z.date({ error: DAY_ERROR }));

interface LegalCollectionOptions<T extends z.core.$ZodLooseShape> {
  /**
   * Extra frontmatter fields for one theme, as a zod shape. A key that is
   * already in the base shape replaces it, for example
   * `{ order: z.number().int().default(100) }` to give pages a default order.
   */
  extend?: T;
}

/**
 * The `legal` collection for src/content.config.ts:
 *
 *   import { legalCollection } from "@studio/core/utils/legal";
 *   export const collections = { legal: legalCollection() };
 *
 * Frontmatter: `title` (text), `updated` (a day, written 2026-10-01 with or
 * without quotes; any other format stops the build and names the expected
 * one), and optionally `description` and `order`.
 */
export function legalCollection<T extends z.core.$ZodLooseShape = {}>({ extend }: LegalCollectionOptions<T> = {}) {
  const base = z.object({
    title: z.string(),
    updated: day(),
    description: z.string().optional(),
    order: z.number().int().optional(),
  });
  return defineCollection({
    loader: glob({ pattern: "**/*.md", base: "./src/content/legal" }),
    // Without `extend`, T is its default `{}`, so the empty object is a T.
    schema: base.extend(extend ?? ({} as T)),
  });
}

/**
 * Stops with a message that names the helper, instead of the bare
 * "Invalid time value" a broken date would otherwise throw from deep inside
 * the build.
 */
function assertValidDate(date: unknown, helper: string): asserts date is Date {
  if (date instanceof Date && !Number.isNaN(date.getTime())) return;
  throw new TypeError(
    `${helper}: expected a valid Date (got ${date instanceof Date ? "Invalid Date" : typeof date}) — ` +
      "legal dates come from the legal collection schema; pass entry.data.updated"
  );
}

/**
 * The day a page was updated, written out in the site's language:
 * formatUpdated(date, "en-GB") is "1 October 2026".
 *
 * Expects a Date that has passed the collection schema (entry.data.updated).
 * An invalid Date throws a TypeError that says so; a malformed locale tag
 * throws Intl's own RangeError. A well-formed tag this runtime has no data
 * for does not make Intl throw: it quietly falls back to the build
 * computer's language. That is refused here, so the page never prints its
 * date in whatever language the build computer happens to use.
 */
export function formatUpdated(date: Date, locale: string): string {
  assertValidDate(date, "formatUpdated");
  const format = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const resolved = format.resolvedOptions().locale;
  const language = (tag: string) => tag.split("-")[0].toLowerCase();
  if (language(resolved) !== language(locale)) {
    throw new RangeError(
      `formatUpdated: locale ${JSON.stringify(locale)} is not supported by this runtime ` +
        `(resolved to ${JSON.stringify(resolved)}) — dates would print in the build machine's language`
    );
  }
  return format.format(date);
}

/**
 * The same day as YYYY-MM-DD, for `<time datetime>`.
 *
 * Expects a Date that has passed the collection schema (entry.data.updated).
 * An invalid Date throws a TypeError that says so.
 */
export function isoDate(date: Date): string {
  assertValidDate(date, "isoDate");
  return date.toISOString().slice(0, 10);
}

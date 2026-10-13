/**
 * The business details: who runs the site, where, and how to reach them.
 *
 * They live in one data file, `src/data/business.json`, the same name in
 * every theme, so the content editor can open it as one form ("Business
 * details") and the build can check it. A theme reads the file once, through
 * `readBusiness`, and every page, the structured data and /llms.txt read the
 * result.
 *
 * Field names are schema.org's flat names (`streetAddress`, not an `address`
 * object): the themes' structured data already uses them, so the JSON-LD
 * code does not change when the data moves.
 *
 * Types follow what the themes held before the move: `foundingYear` is text
 * ("2019"), `mapUrl` may be empty. A type that changed silently would change
 * the structured data search engines read.
 *
 * A theme adds its own fields (a second phone, the number of rooms) with
 * `businessSchema.extend({ ... })`. Settings that are code rather than
 * business facts (language, booking mode, price tables) stay in the theme's
 * `src/lib/site.ts`.
 */
import { z } from "astro/zod";

/** IANA time zone names the runtime knows, e.g. "Europe/London". */
function isTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

/* Strict: a key the schema does not know stops the build. Otherwise a field a
   theme put in the file but forgot to add with extend() would vanish from
   every page without a word. */
export const businessSchema = z.strictObject({
  name: z.string().min(1),
  email: z.string().min(1),
  phone: z.string().optional(),
  streetAddress: z.string().optional(),
  addressLocality: z.string().optional(),
  addressRegion: z.string().optional(),
  postalCode: z.string().optional(),
  addressCountry: z.string().regex(/^[A-Z]{2}$/, "use the two-letter country code, e.g. GB or US"),
  mapUrl: z.string().optional(),
  priceRange: z.string().optional(),
  foundingYear: z.string().regex(/^\d{4}$/, 'use the year as text, e.g. "2019"').optional(),
  timeZone: z.string().refine(isTimeZone, "use a time zone name, e.g. Europe/London").optional(),
});

interface ReadOptions<S extends z.ZodType> {
  /** The file the data came from, as the owner sees it: "src/data/business.json". */
  file: string;
  /** The theme's schema, usually `businessSchema.extend({ ... })`. */
  schema?: S;
}

/**
 * Checks the business details against the schema and returns them. On a
 * wrong or missing field the build stops with the file, every field that is
 * wrong and what each one needs, instead of a page that silently prints
 * "undefined".
 */
export function readBusiness<S extends z.ZodType = typeof businessSchema>(data: unknown, { file, schema }: ReadOptions<S>): z.infer<S> {
  const result = (schema ?? businessSchema).safeParse(data);
  if (result.success) return result.data as z.infer<S>;
  const lines = result.error.issues.flatMap((issue) => {
    if (issue.code === "unrecognized_keys") {
      return issue.keys.map(
        (key) => `    - ${key}: not a field of the business details. Check the spelling; a theme adds its own fields with businessSchema.extend() in src/lib/site.ts.`
      );
    }
    const field = issue.path.length ? issue.path.join(".") : "(the whole file)";
    return [`    - ${field}: ${issue.message}`];
  });
  throw new Error(
    ["", `  ${file}: the business details are not valid.`, "", ...lines, "", "  Fix the file and build again.", ""].join("\n")
  );
}

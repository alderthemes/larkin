/**
 * The i18n helper layer.
 * The rule: a UI string is never hard-coded inside a component or a section.
 * Every template keeps its strings in src/i18n/<locale>.json, which is what
 * makes translating a site a matter of adding one file.
 *
 * Usage:
 *   import { createT } from "@studio/core/utils/i18n";
 *   import en from "../i18n/en.json";
 *   const t = createT(en);
 *   t("nav.menu")            → "Menu"
 *   t("hero.title", {name})  → the same string with {name} filled in
 */

export type Locale = "en" | "tr";
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALES: Locale[] = ["en", "tr"];

/**
 * A dictionary is nested strings, and it may also hold an array of them.
 * Most interface copy is a sentence, but some of it is a list — a set of
 * house rules, the things a template says it does not have — and splitting a
 * list on a delimiter inside a JSON string is how those end up untranslatable.
 * `t()` still resolves strings only; a template reads the array off the
 * dictionary object, or addresses one entry by index ("about.notes.0").
 *
 * An array of objects is allowed for the same reason: a list of steps, each
 * with a heading, a duration and a paragraph, is one translatable unit. Split
 * across `steps.0.title`, `steps.0.body`, `steps.1.title` it stays translatable
 * but stops being reorderable, and a translator can no longer see that the
 * three strings belong to each other.
 */
export type Dict = { [key: string]: string | string[] | Dict | Dict[] };

function lookup(dict: Dict, key: string): string | undefined {
  /* The walker is `unknown` because a dictionary holds arrays as well as
     strings and nested dictionaries — the `Dict` type above says so on
     purpose, since a list is one translatable unit. The previous annotation
     said `string | Dict | undefined` and could not see an array at all.
     Nothing about the behaviour changes: reaching an array element by index
     ("about.notDo.0") already worked, and now the type says so too. */
  let node: unknown = dict;
  for (const p of key.split(".")) {
    if (typeof node !== "object" || node === null) return undefined;
    node = (node as Record<string, unknown>)[p];
  }
  return typeof node === "string" ? node : undefined;
}

/**
 * Builds a translation function from a dictionary.
 * When a key is missing the fallback dictionary (English) is tried, and if
 * that misses too the key itself is returned. The build stays green and the
 * gap shows on the page, which is the right way round: a missing translation
 * should be obvious, not fatal.
 */
export function createT(dict: Dict, fallback?: Dict) {
  return function t(key: string, params?: Record<string, string | number>): string {
    let value = lookup(dict, key) ?? (fallback ? lookup(fallback, key) : undefined) ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        value = value.replaceAll(`{${k}}`, String(v));
      }
    }
    return value;
  };
}

/* `localeFromUrl` and `localizePath` used to live here. They were removed:
   nothing imported them, and between them they implied a capability the
   templates do not have. A template runs in ONE language, chosen at build
   time by `LOCALE` in src/lib/site.ts. Serving two at once would need
   locale-prefixed routes, a per-page dictionary rather than the
   module-level one, hreflang tags, a language switcher and a sitemap that
   multiplies locales by paths — none of which exists. A helper that only
   makes sense inside that architecture advertises it. */

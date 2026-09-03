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
 *   t("hero.title", {name})  → parametreli string
 */

export type Locale = "en" | "tr";
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALES: Locale[] = ["en", "tr"];

export type Dict = { [key: string]: string | Dict };

function lookup(dict: Dict, key: string): string | undefined {
  const parts = key.split(".");
  let node: string | Dict | undefined = dict;
  for (const p of parts) {
    if (typeof node !== "object" || node === null) return undefined;
    node = node[p];
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

/** Resolves the locale from a URL: /tr/menu -> "tr", /menu -> "en" */
export function localeFromUrl(pathname: string): Locale {
  const seg = pathname.split("/").filter(Boolean)[0];
  return (LOCALES as string[]).includes(seg) ? (seg as Locale) : DEFAULT_LOCALE;
}

/** Adds the locale prefix: localizePath("tr", "/menu") -> "/tr/menu" */
export function localizePath(locale: Locale, path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return locale === DEFAULT_LOCALE ? clean : `/${locale}${clean}`;
}

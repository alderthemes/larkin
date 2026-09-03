/**
 * i18n yardımcı katmanı.
 * Kural: UI string'leri HİÇBİR ZAMAN component/section içine hardcode edilmez;
 * her template src/i18n/<locale>.json dosyalarında tutar.
 *
 * Kullanım:
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
 * Sözlükten çeviri fonksiyonu üretir.
 * fallback: anahtar bulunamazsa fallback sözlüğe (EN) bakılır;
 * o da yoksa anahtarın kendisi döner (build kırılmaz, eksik görünür olur).
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

/** URL'den locale çözer: /tr/menu → "tr", /menu → "en" (default) */
export function localeFromUrl(pathname: string): Locale {
  const seg = pathname.split("/").filter(Boolean)[0];
  return (LOCALES as string[]).includes(seg) ? (seg as Locale) : DEFAULT_LOCALE;
}

/** Locale-öneki üretir: localizePath("tr", "/menu") → "/tr/menu" */
export function localizePath(locale: Locale, path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return locale === DEFAULT_LOCALE ? clean : `/${locale}${clean}`;
}

/**
 * Which font files the layout preloads (`<link rel="preload" as="font">`).
 *
 * The fonts are chosen in the `:root` block of src/styles/global.css (yours).
 * A preload is only worth its bytes for a font the page actually uses, so the
 * build reads the two font tokens from that file and preloads a shipped file
 * only while its family is the token's first choice: change
 * `--ts-font-display` to another family and the Unbounded preload leaves the
 * page by itself.
 * The same approach as theme-color.ts: the value is read from the file, not
 * written down a second time.
 *
 * The packages stay installed: this file imports their URLs whether or not
 * they are preloaded.
 */
import globalCss from "../styles/global.css?raw";
// The Latin subset the demo content actually uses, one file per family.
// Importing them as URLs gives the same hashed files the stylesheet's
// @font-face rules already point at - Vite emits one asset each, not a second
// copy - so the preloads can name them. latin-ext is a further file per
// family that the shipped content never touches, and a preload nobody uses is
// pure waste.
import displayFontUrl from "@fontsource-variable/unbounded/files/unbounded-latin-wght-normal.woff2?url";
import textFontUrl from "@fontsource-variable/figtree/files/figtree-latin-wght-normal.woff2?url";

/* Comments are dropped first, so a commented-out old line is not read. If
   the token is written more than once, the last one wins, as in CSS. */
const css = globalCss.replace(/\/\*[\s\S]*?\*\//g, "");

/** The first family a font token names, without its quotes. */
function firstFamily(name: string): string {
  const matches = [...css.matchAll(new RegExp(`${name}\\s*:\\s*([^;]+);`, "g"))];
  const value = matches.at(-1)?.[1] ?? "";
  return value.split(",")[0].trim().replace(/^["']|["']$/g, "");
}

const display = firstFamily("--ts-font-display");
const sans = firstFamily("--ts-font-sans");

/* The display face (every heading, the title on the first screen) and the
   reading face. Preloaded only while the family is the token's first
   choice, in single or double quotes: a family named further down the list
   is a fallback and is rarely downloaded. */
export const FONT_PRELOADS: string[] = [
  ...(display === "Unbounded Variable" ? [displayFontUrl] : []),
  ...(sans === "Figtree Variable" ? [textFontUrl] : []),
];

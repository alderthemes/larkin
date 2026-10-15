/**
 * The color a phone browser paints its own bar in, next to the page.
 *
 * It is the bag's terracotta (`--ts-surface-invert`), read at build time from
 * the `:root` block of src/styles/global.css (yours): retint the bag there
 * and the browser bar follows, so the bar and the site's header still read
 * as one strip. A `<meta>` tag cannot read a CSS variable, so the value is
 * taken from the file itself rather than written down a second time. If the
 * token is missing or not a plain hex color, there is no meta tag and the
 * browser uses its own color.
 */
import globalCss from "../styles/global.css?raw";

/* Comments are dropped first, so a commented-out old line is not read. If
   the token is written more than once, the last one wins, as in CSS. */
const css = globalCss.replace(/\/\*[\s\S]*?\*\//g, "");
const value = [...css.matchAll(/--ts-surface-invert\s*:\s*([^;]+);/g)].at(-1)?.[1].trim() ?? "";

export const THEME_COLOR: string | undefined = /^#[0-9a-fA-F]{3,8}$/.test(value) ? value : undefined;

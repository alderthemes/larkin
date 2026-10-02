/**
 * headers.mjs - the managed block that lets /admin load the Sveltia editor.
 *
 * The site's Content-Security-Policy (public/_headers, netlify.toml) blocks
 * everything the editor needs: its script comes from unpkg, it talks to
 * api.github.com, and the protection against framing stays as it is.
 * The block below gives /admin alone a policy that allows exactly that.
 *
 * Verified (vendor docs, read 2026-09-29):
 *  - Cloudflare Pages: a request matching several _headers rules inherits all
 *    of their headers, and `! Header-Name` removes a header set by an earlier
 *    rule. So `! Content-Security-Policy` then a new one replaces the policy
 *    for /admin only.
 *  - Sveltia CMS security page: base policy (script-src unpkg, style-src,
 *    font-src, img-src blob:/data:, frame-src blob:, connect-src) as below.
 * NOT verified: how Netlify combines a _headers rule with a netlify.toml rule
 * for the same header, and whether Netlify reads the `!` line. Therefore
 * this tool never adds the block to netlify.toml (it updates or removes a block
 * you pasted): the block is printed for the developer to paste, and `check`
 * fails until it is there.
 */
import { SVELTIA_VERSION } from "./emit.mjs";

export const BEGIN = "# BEGIN content editor (managed by npm run cms)";
export const END = "# END content editor";

/** script-src names the pinned version's path; it changes together with SVELTIA_INTEGRITY (see emit.mjs). */
export function adminCsp(authUrl) {
  const auth = authUrl ? ` ${new URL(authUrl).origin}` : "";
  return [
    "default-src 'none'",
    `script-src 'self' https://unpkg.com/@sveltia/cms@${SVELTIA_VERSION}/`,
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' https://cdn.jsdelivr.net",
    "img-src 'self' blob: data: https://avatars.githubusercontent.com https://raw.githubusercontent.com",
    "media-src blob:",
    "frame-src blob:",
    "manifest-src blob:",
    `connect-src 'self' blob: data: https://unpkg.com https://api.github.com https://www.githubstatus.com${auth}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

export function headersBlock(authUrl) {
  const csp = adminCsp(authUrl);
  return [
    BEGIN,
    "/admin",
    "  ! Content-Security-Policy",
    `  Content-Security-Policy: ${csp}`,
    "/admin/*",
    "  ! Content-Security-Policy",
    `  Content-Security-Policy: ${csp}`,
    END,
  ].join("\n");
}

export function tomlBlock(authUrl) {
  return [
    BEGIN,
    "[[headers]]",
    '  for = "/admin/*"',
    "  [headers.values]",
    `    Content-Security-Policy = "${adminCsp(authUrl)}"`,
    END,
  ].join("\n");
}

const eolOf = (t) => (t.includes("\r\n") ? "\r\n" : "\n");

/** The managed block inside text, normalised to LF, or null. */
export function findBlock(text) {
  const t = text.replace(/\r\n/g, "\n");
  const s = t.indexOf(BEGIN);
  if (s < 0) return null;
  const e = t.indexOf(END, s);
  if (e < 0) return null;
  return t.slice(s, e + END.length);
}

/** Append (or replace in place) the block. Leaves everything else untouched. */
export function putBlock(text, block) {
  const eol = eolOf(text);
  const b = block.replace(/\n/g, eol);
  const cur = findBlock(text);
  if (cur !== null) {
    const s = text.indexOf(BEGIN);
    const e = text.indexOf(END, s) + END.length;
    return text.slice(0, s) + b + text.slice(e);
  }
  const lead = text === "" ? "" : text.endsWith("\n") ? eol : eol + eol;
  return text + lead + b + eol;
}

/** Remove the block and the blank separator putBlock added. */
export function removeBlock(text) {
  const s = text.indexOf(BEGIN);
  if (s < 0) return text;
  const endAt = text.indexOf(END, s);
  if (endAt < 0) return text;
  let e = endAt + END.length;
  const tail = text.slice(e);
  const m = /^\r?\n/.exec(tail);
  if (m) e += m[0].length;
  let st = s;
  const before = text.slice(0, s);
  const sep = /(\r?\n)(\r?\n)$/.exec(before);
  if (sep) st = s - sep[2].length;
  return text.slice(0, st) + text.slice(e);
}

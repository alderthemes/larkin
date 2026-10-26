#!/usr/bin/env node
/**
 * headers.mjs - writes public/_headers, the site's security headers.
 *
 *   npm run build            runs this first (before astro build) and writes the file
 *   npm run headers          prints the file instead of writing it
 *
 * The policy itself is ours and comes with every update (core/security/). What
 * is yours lives in your data files: hosts to allow and the Cloudflare Web
 * Analytics switch in src/data/headers.json, and the booking or form addresses
 * the site already reads. public/_headers is generated and not kept in git:
 * edit the data, not the file.
 *
 * The core is found by a path relative to this file, so the project folder can
 * be moved or renamed after `npm install` and this still works.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const site = join(here, "..");
const candidates = [
  join(site, "core", "security", "headers.mjs"),
  join(site, "..", "..", "packages", "core", "security", "headers.mjs"),
];
const lib = candidates.find((p) => existsSync(p));
if (!lib) {
  console.error("headers: the header generator was not found. Expected core/security/headers.mjs in the project folder.");
  process.exit(1);
}
const { buildKitHeaders } = await import(pathToFileURL(lib).href);

let result;
try {
  result = buildKitHeaders(site);
} catch (e) {
  console.error(e.message);
  process.exit(2);
}

if (process.argv.includes("--print")) {
  process.stdout.write(result.text);
} else {
  mkdirSync(join(site, "public"), { recursive: true });
  writeFileSync(join(site, "public", "_headers"), result.text);
  const notes = [result.editor ? "with the /admin policy (editor on)" : "editor off", result.demoFraming ? "demo framing" : null].filter(Boolean);
  console.log(`headers: public/_headers written (${notes.join(", ")}; inputs ${result.digest}).`);
}

#!/usr/bin/env node
/**
 * cms.mjs - the content editor for this site: on, off, regenerated, checked.
 *
 *   npm run cms -- status
 *   npm run cms -- enable sveltia --repo owner/name [--auth-url URL] [--branch main]
 *   npm run cms -- disable sveltia
 *   npm run cms -- generate
 *   npm run cms -- check
 *
 * The tool itself lives in the shared core (core/cms/). What is specific to this
 * site - collections, field labels and options - is in cms/fields.json.
 *
 * The core is found by a path relative to this file, so the project folder can
 * be moved or renamed after `npm install` and this still works.
 */
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const candidates = [
  join(here, "..", "core", "cms", "cli.mjs"),
  join(here, "..", "..", "..", "packages", "core", "cms", "cli.mjs"),
];
const cli = candidates.find((p) => existsSync(p));
if (!cli) {
  console.error("cms: the content editor tool was not found. Expected core/cms/cli.mjs in the project folder.");
  process.exit(1);
}
await import(pathToFileURL(cli).href);

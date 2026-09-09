// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import { loadEnv } from "vite";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * Resolve `@studio/core` from the copy that ships inside this folder.
 *
 * The package embeds core as a real `./core` directory and package.json points
 * at it with `file:./core`. npm turns that into a link whose target is an
 * ABSOLUTE path, so renaming or moving the project folder — the first thing
 * anyone does — breaks it. The build then fails with a resolver stack trace
 * that says nothing about the real cause, and only `npm install` repairs it.
 *
 * Aliasing the import to the folder next to this file removes that dependency
 * for the build. The subpaths are read from core's own package.json `exports`
 * map rather than restated here, so the two cannot drift apart.
 *
 * Returns nothing when there is no `./core` beside this file, which is the
 * case while the template is being developed rather than delivered.
 */
function coreAlias() {
  const coreUrl = new URL("./core/", import.meta.url);
  const pkgUrl = new URL("package.json", coreUrl);
  if (!existsSync(pkgUrl)) return [];
  const dir = fileURLToPath(coreUrl);
  const map = JSON.parse(readFileSync(pkgUrl, "utf8")).exports ?? {};
  return Object.entries(map)
    .filter(([, target]) => typeof target === "string")
    .map(([sub, target]) => {
      const from = "@studio/core" + sub.slice(1);
      const to = dir + target.slice(2);
      return sub.includes("*")
        ? { find: new RegExp("^" + from.replace("*", "(.*)") + "$"), replacement: to.replace("*", "$1") }
        : { find: from, replacement: to };
    });
}

/**
 * The live address of the site.
 *
 * Set it in .env (see .env.example) or as a build environment variable on your
 * host — both work, because this config reads .env itself. Astro does not do
 * that for you: config files run before Vite loads .env, so without loadEnv a
 * SITE line in .env is read by nothing and silently ignored.
 *
 * The fallback is deliberate. A wrong domain that looks right is worse than
 * one that is obviously unset, so the placeholder stays visible in canonical
 * tags, Open Graph URLs, robots.txt and sitemap.xml.
 */
const env = loadEnv(process.env.NODE_ENV ?? "production", process.cwd(), "");
const PLACEHOLDER_SITE = "https://example.com";
const site = process.env.SITE || env.SITE || PLACEHOLDER_SITE;

/* An unset SITE used to leave no trace at all: the build was green, every
   canonical tag said example.com, and nothing said so until someone read the
   deployed HTML. One line in the build log is what turns a deliberate default
   into a visible one. BaseLayout also ships noindex while this holds. */
if (site === PLACEHOLDER_SITE) {
  console.warn(
    "\n  [larkin] SITE is not set — canonical tags, sitemap.xml and robots.txt\n" +
      "           will say example.com, and every page will ship noindex.\n" +
      "           Set it in .env (SITE=https://your-domain.com) or in your\n" +
      "           host's build environment, then build again.\n"
  );
}

// https://astro.build/config
export default defineConfig({
  site,
  vite: {
    plugins: [tailwindcss()],
    resolve: { alias: coreAlias() },
  },
});

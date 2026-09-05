/**
 * Crawl surfaces — the three files a crawler looks for before it reads a page.
 *
 * These render the files; they do not decide what is in them. The list of
 * routes is genuinely different in every template (a hotel has rooms, a café
 * has a menu), so the paths stay with the template. What was worth sharing is
 * the part that was wrong in three places at once: only one of the three
 * templates shipped a sitemap at all, and the one that did hardcoded its
 * Sitemap line to example.com, so the published demo pointed a crawler at
 * somebody else's domain.
 *
 * Every function takes the site origin from Astro rather than a constant. The
 * buyer sets `site` in astro.config.mjs, which is a file they already edit, and
 * the demo build passes SITE at the command line. Neither has to remember a
 * second place.
 */

/** One entry in the sitemap. `priority` is optional; crawlers treat it as a hint. */
export interface SitemapEntry {
  path: string;
  priority?: string;
}

/**
 * Priority from the shape of the path, so a template does not have to hand-tune
 * numbers it will never revisit. The home page leads, legal pages trail, and
 * everything else sits in the middle where it belongs.
 */
export function defaultPriority(path: string): string {
  if (path === "/") return "1.0";
  if (path.startsWith("/legal/")) return "0.2";
  return "0.7";
}

/**
 * Absolute URLs are required by the sitemap protocol, so a missing `site`
 * would silently produce a file full of relative paths that no crawler
 * accepts. Rather than emit that, this throws: a build that fails is fixable,
 * a sitemap that is quietly wrong is not noticed for months.
 */
function origin(site: URL | undefined): string {
  if (!site) {
    throw new Error(
      "sitemap: `site` is not set in astro.config.mjs, so absolute URLs cannot be built"
    );
  }
  return site.toString().replace(/\/$/, "");
}

/** `/sitemap.xml` body. */
export function sitemapXml(site: URL | undefined, entries: SitemapEntry[]): string {
  const base = origin(site);
  const urls = entries
    .map(
      (e) => `  <url>
    <loc>${base}${e.path}</loc>
    <priority>${e.priority ?? defaultPriority(e.path)}</priority>
  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

/**
 * `/robots.txt` body.
 *
 * Generated rather than shipped as a static file. As a static file its Sitemap
 * line has to name a domain, which means either a placeholder that ships to
 * production or a step in the setup guide that a buyer can skip. Reading the
 * origin from the build removes the choice.
 */
export function robotsTxt(site: URL | undefined): string {
  return `# Everything here is meant to be read, by people and by crawlers alike.
User-agent: *
Allow: /

Sitemap: ${origin(site)}/sitemap.xml
`;
}

/** Response helper: the right content type, spelled once. */
export function textResponse(body: string, contentType: string): Response {
  return new Response(body, { headers: { "Content-Type": contentType } });
}

export const xmlResponse = (body: string) =>
  textResponse(body, "application/xml; charset=utf-8");

export const plainResponse = (body: string) =>
  textResponse(body, "text/plain; charset=utf-8");

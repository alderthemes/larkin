/**
 * /sitemap.xml — every page this site has.
 *
 * Written here rather than pulled in as an integration. The map is six static
 * routes; a dependency to produce that is a dependency the buyer has to keep
 * updated, and this file is short enough to read in one go.
 *
 * The list is deliberately in `src/`. The studio's own theme.json knows these
 * routes too, but it is an internal manifest and is not part of the package a
 * buyer receives -- importing it here would build fine in the monorepo and
 * fail the moment somebody unzips the theme.
 */
import type { APIRoute } from "astro";
import { sitemapXml, xmlResponse } from "@studio/core/utils/crawl";

const PATHS = [
  { path: "/" },
  { path: "/menu/" },
  { path: "/about/" },
  { path: "/contact/" },
  { path: "/legal/privacy/" },
  { path: "/legal/terms/" },
];

export const GET: APIRoute = ({ site }) => xmlResponse(sitemapXml(site, PATHS));

/**
 * /sitemap.xml — every page this site has.
 *
 * Written here rather than pulled in as an integration. The map is six static
 * routes; a dependency to produce that is a dependency the buyer has to keep
 * updated, and this file is short enough to read in one go.
 *
 * The list lives in this file so it travels with the theme. Add a static page
 * and add its path here; nothing else needs to know about it.
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

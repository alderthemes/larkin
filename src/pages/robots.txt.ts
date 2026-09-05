/**
 * /robots.txt — generated, so the Sitemap line always names the site actually
 * being built.
 *
 * This used to be a static file in one template and absent in the other two.
 * The static one hardcoded example.com, which shipped: the published demo told
 * crawlers to fetch a sitemap from a domain we do not own. A generated file
 * reads the origin from the build and cannot drift.
 */
import type { APIRoute } from "astro";
import { robotsTxt, plainResponse } from "@studio/core/utils/crawl";

export const GET: APIRoute = ({ site }) => plainResponse(robotsTxt(site));

/**
 * /robots.txt — generated, so the Sitemap line always names the site actually
 * being built rather than whatever domain was hardcoded when the file was
 * written.
 */
import type { APIRoute } from "astro";
import { robotsTxt, plainResponse } from "@studio/core/utils/crawl";

export const GET: APIRoute = ({ site }) => plainResponse(robotsTxt(site));

/**
 * /llms.txt — a machine-readable summary of the business for AI assistants.
 * Generated from site.ts, the locations collection and the i18n files, so it
 * updates itself when a shop is added and cannot fall behind the site.
 */
import type { APIRoute } from "astro";
import { t, business } from "../lib/site";
import { getLocations, formatAddress } from "../lib/locations";

export const GET: APIRoute = async ({ site }) => {
  const base = site?.toString().replace(/\/$/, "") ?? "";
  const locations = await getLocations();

  const locationBlocks = locations
    .map((loc) => {
      const hours = loc.data.hours
        .map((h) => `${h.dayOfWeek.join(", ")}: ${h.opens}-${h.closes}`)
        .join("; ");
      const amenities = [
        loc.data.wifi ? "free Wi-Fi" : null,
        loc.data.outlets ? "power outlets" : null,
        loc.data.laptopFriendly ? "laptop-friendly" : null,
      ]
        .filter(Boolean)
        .join(", ");
      return `### ${loc.data.name}

- Address: ${formatAddress(loc)}, ${loc.data.addressCountry}
- Hours: ${hours}
- Amenities: ${amenities || "n/a"}`;
    })
    .join("\n\n");

  const body = `# ${business.name}

> ${t("about.summary")}

- Type: cafe / coffee shop
- Serves: ${business.servesCuisine.join(", ")}
- Phone: ${business.phone}
- Email: ${business.email}
- Price range: ${business.priceRange}
- Reservations: not accepted, walk-in only
- Operating since: ${business.foundingYear}

## Locations

${locationBlocks}

## Pages

- [Home](${base}/): ${t("site.tagline")}
- [Menu](${base}/menu/): ${t("menu.pageSubtitle")}
- [About](${base}/about/): ${t("about.title")}
- [Contact](${base}/contact/): ${t("contact.subtitle")}
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};

/**
 * /llms.txt — a machine-readable summary of the business for AI assistants.
 * Generated from site.ts, the locations collection and the i18n files, so it
 * updates itself when a shop is added and cannot fall behind the site.
 */
import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { t, business } from "../lib/site";
import { getLocations, formatAddress } from "../lib/locations";
import { availableByCategory, formatPrice } from "../lib/menu";

export const GET: APIRoute = async ({ site }) => {
  const base = site?.toString().replace(/\/$/, "") ?? "";
  const locations = await getLocations();

  const locationBlocks = locations
    .map((loc) => {
      const hours = loc.data.hours
        .map((h) => `${h.dayOfWeek.join(", ")}: ${h.opens}-${h.closes}`)
        .join("; ");
      const amenities = [
        loc.data.wifi ? t("location.wifi") : null,
        loc.data.outlets ? t("location.outlets") : null,
        loc.data.laptopFriendly ? t("location.laptopFriendly") : null,
      ]
        .filter(Boolean)
        .join(", ");
      return `### ${loc.data.name}

- Address: ${formatAddress(loc)}, ${loc.data.addressCountry}
- Hours: ${hours}
- Amenities: ${amenities || "n/a"}`;
    })
    .join("\n\n");

  /* The menu and the questions, in full. An assistant asked "do they have
     oat milk?" or "can I bring a laptop?" answers from this file or not at
     all; a one-line pointer to /menu/ is the same as no answer. Both blocks
     read the collections, so they cannot fall behind the site. */
  const menuBlocks = availableByCategory(await getCollection("menu"))
    .map(
      (group) => `### ${t(`menu.categories.${group.category}`)}

${group.items
  .map((i) => {
    const parts = [
      `- ${i.data.name}`,
      formatPrice(i.data.price, i.data.currency),
      i.data.description,
    ].filter(Boolean);
    const marks = [
      i.data.seasonal ? "seasonal" : null,
      ...i.data.tags,
    ].filter(Boolean);
    return parts.join(" — ") + (marks.length ? ` (${marks.join(", ")})` : "");
  })
  .join("\n")}`
    )
    .join("\n\n");

  const faqBlocks = (await getCollection("faq"))
    .sort((a, b) => a.data.order - b.data.order)
    .map((entry) => `**${entry.data.question}** ${entry.data.answer}`)
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

## Menu

${menuBlocks}

## FAQ

${faqBlocks}

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

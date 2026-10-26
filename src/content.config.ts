import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import { legalCollection } from "@studio/core/utils/legal";
import { hoursSchema } from "@studio/core/utils/hours";

/**
 * The menu categories, in the order they appear on the page.
 *
 * SINGLE SOURCE. The schema below validates against it and both menu
 * surfaces (MenuList.astro and pages/menu/index.astro) import it. Each of
 * those used to keep its own copy of the list, undocumented: adding a
 * category to the schema left the build green and the item invisible.
 *
 * To add a category: add it here, then add its label under "menu.categories"
 * in every src/i18n/*.json file. Nothing else.
 */
/**
 * The tag vocabulary for menu items.
 *
 * A free-form string list let a typo through in silence: the badge rendered
 * from whatever was written, and the schema layer quietly dropped anything
 * it did not recognize. An enum turns that into a build error naming the
 * file and the allowed values.
 *
 * Which of these reach structured data is decided in core (DIET_MAP), not
 * here: diet tags become suitableForDiet, the rest are page-only labels.
 * To add a tag: add it here, then add its label under "menu.tags" in every
 * src/i18n/*.json file.
 */
export const MENU_TAGS = ["plant-based", "vegetarian", "vegan", "gluten-free", "decaf"] as const;

export const MENU_CATEGORIES = ["espresso", "brew", "food", "seasonal"] as const;


/**
 * menu — the menu collection, grouped by category.
 * A cafe menu is small and rotates: mark an item `seasonal: true` and it
 * carries a badge in the list. Adding a drink is adding a .md file.
 */
const menu = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/menu" }),
  schema: z.object({
    name: z.string(),
    description: z.string().default(""),
    price: z.number().positive(),
    currency: z.string().default("USD"),
    /** To add a category, extend this enum and add its label under
        "menu.categories" in each src/i18n/*.json file. */
    category: z.enum(MENU_CATEGORIES),
    /** plant-based / vegetarian / gluten-free / decaf */
    tags: z.array(z.enum(MENU_TAGS)).default([]),
    /** Seasonal badge — the part of the menu regulars come back to check */
    seasonal: z.boolean().default(false),
    order: z.number().int().default(100),
    available: z.boolean().default(true),
    featured: z.boolean().default(false),
  }),
});

/**
 * One shop's week, as the content editor writes it: every day has an opening
 * time, a closing time and a "Closed all day" switch, each optional, because
 * the editor's form keeps all three. Checked against core's `hoursSchema`
 * (the same week format as every theme: { open, close } or { closed: true };
 * a ticked switch wins and the times beside it are ignored), so a missing
 * day, a time not written "HH:MM" or the same opening and closing time stops
 * the build with the file and the day. The plain shape is what the editor's
 * form is built from; core's form builder reads objects, not alternatives.
 */
const editableDay = z.strictObject({
  open: z.string().optional(),
  close: z.string().optional(),
  closed: z.boolean().optional(),
});
/* The rows format the shops used before (2.x): [{ dayOfWeek: ["Monday", …],
   opens, closes }], a day in no row closed. Read into the week so an older
   location file keeps building with the hours it showed before;
   src/lib/locations.ts prints a warning naming the file and how to rewrite
   it. What the old schema let through is read the way the old site read it:
   a day in two rows takes the later row (the old table did), `hours: []` is
   a week with every day closed, a one-digit hour ("7:00") is "07:00", and a
   day name in another case ("monday") is that day. Anything else (an unknown
   day name, a row without dayOfWeek) is left as it is, and the week schema
   below rejects it with the file and the field. */
const LEGACY_DAYS: Record<string, string> = {
  monday: "mon",
  tuesday: "tue",
  wednesday: "wed",
  thursday: "thu",
  friday: "fri",
  saturday: "sat",
  sunday: "sun",
};
const legacyTime = (t: unknown) => (typeof t === "string" && /^\d:\d\d$/.test(t.trim()) ? `0${t.trim()}` : t);
export function weekFromRows(value: unknown): unknown {
  if (!Array.isArray(value)) return value;
  const week: Record<string, { open?: unknown; close?: unknown; closed?: boolean }> = {};
  for (const key of Object.values(LEGACY_DAYS)) week[key] = { closed: true };
  for (const row of value) {
    if (!row || typeof row !== "object" || !Array.isArray(row.dayOfWeek)) return value;
    for (const name of row.dayOfWeek) {
      const key = typeof name === "string" ? LEGACY_DAYS[name.trim().toLowerCase()] : undefined;
      if (!key) return value;
      week[key] = { open: legacyTime(row.opens), close: legacyTime(row.closes) };
    }
  }
  return week;
}

const shopWeek = z
  .strictObject({
    mon: editableDay,
    tue: editableDay,
    wed: editableDay,
    thu: editableDay,
    fri: editableDay,
    sat: editableDay,
    sun: editableDay,
  })
  .superRefine((week, ctx) => {
    const checked = hoursSchema.safeParse(week);
    if (!checked.success) for (const issue of checked.error.issues) ctx.addIssue({ code: "custom", path: issue.path, message: issue.message });
  });

/**
 * locations — the shop collection. Multiple locations are supported from
 * the start rather than retrofitted. With one file the site reads as a
 * single shop; add a second and the home page grows an "all locations"
 * link and the contact page becomes a grid of cards. No code changes.
 */
const locations = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/locations" }),
  schema: z.object({
    name: z.string(),
    streetAddress: z.string(),
    addressLocality: z.string(),
    addressRegion: z.string(),
    postalCode: z.string(),
    addressCountry: z.string().default("US"),
    phone: z.string().optional(),
    /** Map link — where the "Get directions" button goes */
    mapUrl: z.string().url().optional(),
    /** The shop's week: mon…sun, each { open: "07:00", close: "18:00" } or
        { closed: true } (shopWeek above). All seven days are required, so a
        day cannot be forgotten. The time zone is the café's, in
        src/data/business.json. schema.org openingHoursSpecification is
        built from this. */
    hours: z.preprocess(weekFromRows, shopWeek),
    /** The "can I work here?" facts. An honest no is still an answer. */
    wifi: z.boolean().default(true),
    outlets: z.boolean().default(true),
    laptopFriendly: z.boolean().default(true),
    /** The main shop: the home page card and the schema.org entry use it */
    primary: z.boolean().default(false),
    order: z.number().int().default(100),
  }),
});

/**
 * faq — the questions collection. Wired into FAQPage schema automatically
 * and written out to /llms.txt, so a question answered here is a question an
 * answer engine can quote. This is the cheapest structured data on the site.
 */
const faq = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/faq" }),
  schema: z.object({
    question: z.string(),
    answer: z.string(),
    order: z.number().int().default(100),
  }),
});

/**
 * legal — the privacy and terms pages. The body is markdown and is meant to
 * be replaced with your own text; the shipped copy is a starting structure,
 * not legal advice. See docs/legal-templates.md before publishing it.
 */
const legal = legalCollection({
  /* One sentence about what this page covers. It becomes the meta
     description; without it the description repeated the title. Required
     here, optional in core. */
  extend: { description: z.string() },
});

export const collections = { menu, locations, faq, legal };

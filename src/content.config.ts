import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

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
    category: z.enum(["espresso", "brew", "food", "seasonal"]),
    /** plant-based / vegetarian / gluten-free / decaf */
    tags: z.array(z.string()).default([]),
    /** Seasonal badge — the part of the menu regulars come back to check */
    seasonal: z.boolean().default(false),
    order: z.number().int().default(100),
    available: z.boolean().default(true),
    featured: z.boolean().default(false),
  }),
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
    /** Weekly hours. schema.org openingHoursSpecification is built from this. */
    hours: z
      .array(
        z.object({
          dayOfWeek: z.array(z.string()),
          opens: z.string(),
          closes: z.string(),
        })
      )
      .default([]),
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
 * faq — the questions collection. Wired into FAQPage schema automatically,
 * GEO'nun ana yemi (docs/seo-geo-playbook.md).
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
 * not legal advice. See docs/README.md before publishing it.
 */
const legal = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/legal" }),
  schema: z.object({
    title: z.string(),
    updated: z.string(),
  }),
});

export const collections = { menu, locations, faq, legal };

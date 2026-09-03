/**
 * Helpers for titles, canonical URLs and schema.org output.
 * Each template calls the schema builder for its own sector; the JSON-LD is
 * written by BaseLayout inside a <script type="application/ld+json">.
 */

export interface SEOProps {
  title: string;
  description: string;
  /** Site name — joined as "Page — Site" */
  siteName: string;
  url?: string;
  image?: string;
  locale?: string;
  type?: "website" | "article";
  noindex?: boolean;
}

export function buildTitle(pageTitle: string, siteName: string): string {
  return pageTitle === siteName ? pageTitle : `${pageTitle} — ${siteName}`;
}

/* ---------------- schema.org builders ---------------- */

export interface OpeningHoursSpec {
  /** e.g. ["Monday","Tuesday"] */
  dayOfWeek: string[];
  opens: string; // "12:00"
  closes: string; // "23:00"
}

export interface LocalBusinessInput {
  name: string;
  description?: string;
  url?: string;
  telephone?: string;
  email?: string;
  streetAddress?: string;
  addressLocality?: string;
  addressRegion?: string;
  postalCode?: string;
  addressCountry?: string;
  image?: string;
  priceRange?: string;
  openingHours?: OpeningHoursSpec[];
  geo?: { latitude: number; longitude: number };
}

function baseLocalBusiness(type: string, input: LocalBusinessInput) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": type,
    name: input.name,
  };
  if (input.description) schema.description = input.description;
  if (input.url) schema.url = input.url;
  if (input.telephone) schema.telephone = input.telephone;
  if (input.email) schema.email = input.email;
  if (input.image) schema.image = input.image;
  if (input.priceRange) schema.priceRange = input.priceRange;
  if (input.streetAddress) {
    schema.address = {
      "@type": "PostalAddress",
      streetAddress: input.streetAddress,
      addressLocality: input.addressLocality,
      addressRegion: input.addressRegion,
      postalCode: input.postalCode,
      addressCountry: input.addressCountry,
    };
  }
  if (input.geo) {
    schema.geo = {
      "@type": "GeoCoordinates",
      latitude: input.geo.latitude,
      longitude: input.geo.longitude,
    };
  }
  if (input.openingHours?.length) {
    schema.openingHoursSpecification = input.openingHours.map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: h.dayOfWeek,
      opens: h.opens,
      closes: h.closes,
    }));
  }
  return schema;
}

export interface RestaurantInput extends LocalBusinessInput {
  servesCuisine?: string[];
  acceptsReservations?: boolean;
  menuUrl?: string;
}

/** Fields shared by the FoodEstablishment family (Restaurant, CafeOrCoffeeShop, Bakery). */
function foodEstablishment(type: string, input: RestaurantInput) {
  const schema = baseLocalBusiness(type, input);
  if (input.servesCuisine?.length) schema.servesCuisine = input.servesCuisine;
  if (input.acceptsReservations !== undefined)
    schema.acceptsReservations = input.acceptsReservations;
  if (input.menuUrl) schema.hasMenu = input.menuUrl;
  return schema;
}

export function restaurantSchema(input: RestaurantInput) {
  return foodEstablishment("Restaurant", input);
}

/**
 * The cafe type, and deliberately not Restaurant. To a search engine and to
 * an AI assistant, "somewhere to get coffee" and "somewhere to eat" are
 * different intents, and CafeOrCoffeeShop is a separate entity type.
 * `acceptsReservations: false` is a signal rather than an omission: cafes do
 * not take bookings, and claiming otherwise brings the wrong visitor.
 */
export function cafeSchema(input: RestaurantInput) {
  return foodEstablishment("CafeOrCoffeeShop", input);
}

/** Dental and aesthetic clinics — the sectors queued next */
export function medicalClinicSchema(input: LocalBusinessInput) {
  return baseLocalBusiness("MedicalClinic", input);
}

/** Hotels — the sector queued next */
export function hotelSchema(input: LocalBusinessInput) {
  return baseLocalBusiness("Hotel", input);
}

/* ---------------- Menu schema (Restaurant dikeyi) ---------------- */

const DIET_MAP: Record<string, string> = {
  vegetarian: "https://schema.org/VegetarianDiet",
  vegan: "https://schema.org/VeganDiet",
  "gluten-free": "https://schema.org/GlutenFreeDiet",
};

export interface MenuItemInput {
  name: string;
  description: string;
  price: number;
  currency: string;
  tags?: string[];
}

export interface MenuSectionInput {
  name: string;
  items: MenuItemInput[];
}

/**
 * Builds schema.org Menu/MenuSection/MenuItem: the machine-readable form of
 * the menu collection. Answer engines read menu items one at a time, so a
 * menu that exists only as styled text is a menu they cannot quote.
 */
export function menuSchema(sections: MenuSectionInput[], url?: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Menu",
    ...(url ? { url } : {}),
    hasMenuSection: sections.map((section) => ({
      "@type": "MenuSection",
      name: section.name,
      hasMenuItem: section.items.map((item) => {
        const diets = (item.tags ?? [])
          .map((t) => DIET_MAP[t])
          .filter((d): d is string => Boolean(d));
        return {
          "@type": "MenuItem",
          name: item.name,
          description: item.description,
          offers: {
            "@type": "Offer",
            price: item.price.toFixed(2),
            priceCurrency: item.currency,
          },
          ...(diets.length ? { suitableForDiet: diets } : {}),
        };
      }),
    })),
  };
}

export interface FAQItem {
  question: string;
  answer: string;
}

export function faqSchema(items: FAQItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({
      "@type": "Question",
      name: i.question,
      acceptedAnswer: { "@type": "Answer", text: i.answer },
    })),
  };
}

/** For the store's product pages */
export interface ProductInput {
  name: string;
  description: string;
  url?: string;
  image?: string;
  price: number;
  priceCurrency?: string;
}

export function productSchema(input: ProductInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    description: input.description,
    ...(input.url ? { url: input.url } : {}),
    ...(input.image ? { image: input.image } : {}),
    offers: {
      "@type": "Offer",
      price: input.price.toFixed(2),
      priceCurrency: input.priceCurrency ?? "USD",
      availability: "https://schema.org/InStock",
    },
  };
}

export function jsonLd(schema: unknown): string {
  // Serialize safely: an unescaped </script> inside JSON-LD closes the tag
  return JSON.stringify(schema).replace(/</g, "\\u003c");
}

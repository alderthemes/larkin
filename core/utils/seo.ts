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

export interface HotelInput extends LocalBusinessInput {
  numberOfRooms?: number;
  /** "16:00" */
  checkinTime?: string;
  /** "11:00" */
  checkoutTime?: string;
  /** Free text rather than a boolean: "dogs in two ground-floor rooms" is a
   *  better answer than yes, and the property accepts a string. */
  petsAllowed?: string | boolean;
  /** What the house has, and what it does not. A false entry is a claim too:
   *  a guest searching for step-free access is served by an explicit no. */
  amenities?: { name: string; value: boolean }[];
}

/**
 * Hotels, inns and guesthouses. The check-in and check-out times are here
 * rather than in prose because they are the first thing an answer engine is
 * asked for, and the amenity list carries its false entries on purpose.
 */
export function hotelSchema(input: HotelInput) {
  const schema = baseLocalBusiness("Hotel", input);
  if (input.numberOfRooms) schema.numberOfRooms = input.numberOfRooms;
  if (input.checkinTime) schema.checkinTime = input.checkinTime;
  if (input.checkoutTime) schema.checkoutTime = input.checkoutTime;
  if (input.petsAllowed !== undefined) schema.petsAllowed = input.petsAllowed;
  if (input.amenities?.length) {
    schema.amenityFeature = input.amenities.map((a) => ({
      "@type": "LocationFeatureSpecification",
      name: a.name,
      value: a.value,
    }));
  }
  return schema;
}

export interface HotelRoomInput {
  name: string;
  description?: string;
  url?: string;
  image?: string;
  /** How many people sleep in it at the quoted rate. */
  occupancy?: number;
  floorSizeSqm?: number;
  bed?: { type: string; count?: number };
  amenities?: string[];
  /** The lowest nightly rate, matching the "from" price on the page. */
  minPrice: number;
  priceCurrency?: string;
  /** The hotel this room belongs to. */
  hotelName?: string;
}

/**
 * One room type.
 *
 * `offers.availability` is deliberately absent. A static site does not know
 * what is free tonight, and a schema that claims InStock on a room that is
 * booked is worse than no schema: it produces a result the guest cannot act
 * on and a hotel that has to apologize for it. The price is published as a
 * minimum, which is what the page says too.
 */
export function hotelRoomSchema(input: HotelRoomInput) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "HotelRoom",
    name: input.name,
  };
  if (input.description) schema.description = input.description;
  if (input.url) schema.url = input.url;
  if (input.image) schema.image = input.image;
  if (input.hotelName) {
    schema.containedInPlace = { "@type": "Hotel", name: input.hotelName };
  }
  if (input.occupancy) {
    schema.occupancy = { "@type": "QuantitativeValue", maxValue: input.occupancy };
  }
  if (input.floorSizeSqm) {
    schema.floorSize = {
      "@type": "QuantitativeValue",
      value: input.floorSizeSqm,
      unitCode: "MTK",
    };
  }
  if (input.bed) {
    schema.bed = {
      "@type": "BedDetails",
      typeOfBed: input.bed.type,
      ...(input.bed.count ? { numberOfBeds: input.bed.count } : {}),
    };
  }
  if (input.amenities?.length) {
    schema.amenityFeature = input.amenities.map((name) => ({
      "@type": "LocationFeatureSpecification",
      name,
      value: true,
    }));
  }
  schema.offers = {
    "@type": "Offer",
    priceSpecification: {
      "@type": "PriceSpecification",
      minPrice: input.minPrice,
      priceCurrency: input.priceCurrency ?? "EUR",
    },
  };
  return schema;
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
  /**
   * Whether the item can actually be bought right now. This is not a detail:
   * the offer block is a machine-readable commercial claim, and a page that
   * reads "In production" to a person while telling a crawler the product is
   * in stock at $59 is making two contradictory statements about the same
   * thing. Search engines and answer engines read the second one.
   *
   * So availability follows the checkout, not the catalog entry. Defaults to
   * false, because the honest answer before a payment provider is connected
   * is "you cannot buy this yet".
   */
  sellable?: boolean;
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
      availability: input.sellable
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };
}

export function jsonLd(schema: unknown): string {
  // Serialize safely: an unescaped </script> inside JSON-LD closes the tag
  return JSON.stringify(schema).replace(/</g, "\\u003c");
}

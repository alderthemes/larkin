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

/** Aesthetic and general medical clinics. */
export function medicalClinicSchema(input: LocalBusinessInput) {
  return baseLocalBusiness("MedicalClinic", input);
}

export interface DentistInput extends LocalBusinessInput {
  /** What the practice does, as plain service names. These become
   *  `availableService`, which is what an answer engine reads when it is
   *  asked whether somewhere does root canals. */
  services?: { name: string; url?: string; description?: string }[];
  /** Whether the practice is taking new patients. A practice with a closed
   *  list that says nothing gets phone calls it cannot answer, so the state
   *  is published rather than implied. */
  acceptingNewPatients?: boolean;
}

/**
 * A dental practice, and deliberately not MedicalClinic. Dentist is its own
 * schema.org type and it is the one a local search resolves against; a
 * practice described as a generic clinic competes in the wrong set.
 *
 * There is no price on this entity and none on the procedures below. A price
 * band on a page is a guide a patient reads next to the sentence that says it
 * is a guide. The same number inside structured data is a machine-readable
 * offer with none of that sentence attached, and health pricing is regulated
 * differently in every market the buyer might be in.
 */
export function dentistSchema(input: DentistInput) {
  const schema = baseLocalBusiness("Dentist", input);
  if (input.services?.length) {
    schema.availableService = input.services.map((s) => ({
      "@type": "MedicalProcedure",
      name: s.name,
      ...(s.url ? { url: s.url } : {}),
      ...(s.description ? { description: s.description } : {}),
    }));
  }
  if (input.acceptingNewPatients !== undefined) {
    schema.isAcceptingNewPatients = input.acceptingNewPatients;
  }
  return schema;
}

export interface MedicalProcedureInput {
  name: string;
  description: string;
  url?: string;
  /** schema.org MedicalProcedureType. "NoninvasiveProcedure" covers a filling
   *  or a clean; "SurgicalProcedure" covers an extraction. */
  procedureType?: "NoninvasiveProcedure" | "SurgicalProcedure";
  /** What happens during it, in the patient's words. */
  howPerformed?: string;
  /** What to do beforehand. */
  preparation?: string;
  /** What to expect afterward. This is the field most practice sites leave
   *  empty and the one patients ask about first. */
  followup?: string;
  /** The practice that performs it, by name. */
  providerName?: string;
}

export function medicalProcedureSchema(input: MedicalProcedureInput) {
  const schema: Record<string, unknown> = {
    "@type": "MedicalProcedure",
    name: input.name,
    description: input.description,
  };
  if (input.url) schema.url = input.url;
  if (input.procedureType) {
    schema.procedureType = `https://schema.org/${input.procedureType}`;
  }
  if (input.howPerformed) schema.howPerformed = input.howPerformed;
  if (input.preparation) schema.preparation = input.preparation;
  if (input.followup) schema.followup = input.followup;
  if (input.providerName) {
    schema.provider = { "@type": "Dentist", name: input.providerName };
  }
  return schema;
}

export interface PersonInput {
  name: string;
  jobTitle?: string;
  /** The organization they work for, by name. */
  worksForName?: string;
  worksForType?: string;
  /** Degree, diploma, or registration, as free text. */
  qualification?: string;
  languages?: string[];
  image?: string;
  url?: string;
}

/**
 * A named practitioner. Used on team pages in the regulated verticals, where
 * who is treating you is the first thing a visitor checks.
 *
 * `image` is optional and stays that way. A practice that has not photographed
 * its team yet is better served by a card with no photograph than by a stock
 * one, and structured data should not claim a picture that is not of them.
 */
export function personSchema(input: PersonInput) {
  const schema: Record<string, unknown> = { "@type": "Person", name: input.name };
  if (input.jobTitle) schema.jobTitle = input.jobTitle;
  if (input.worksForName) {
    schema.worksFor = { "@type": input.worksForType ?? "Organization", name: input.worksForName };
  }
  if (input.qualification) schema.hasCredential = input.qualification;
  if (input.languages?.length) schema.knowsLanguage = input.languages;
  if (input.image) schema.image = input.image;
  if (input.url) schema.url = input.url;
  return schema;
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

export interface SoftwareApplicationInput {
  name: string;
  description: string;
  url?: string;
  image?: string;
  /** schema.org applicationCategory: "BusinessApplication",
   *  "DeveloperApplication", and so on. Matched against a query rather than
   *  read as prose, so the accurate value beats the flattering one. */
  applicationCategory?: string;
  operatingSystem?: string;
  /** The publisher, by name. */
  providerName?: string;
  /**
   * The tier range, from the plan collection rather than typed in.
   *
   * A price written into a layout is a second copy of a number that already
   * exists in content, and structured data is where that copy is least likely
   * to be noticed when it goes stale: nothing on the page looks wrong, and the
   * wrong figure is the one a search result shows. Pass `offerCount` so the
   * range is not read as a single price.
   *
   * Tiers with no published price are excluded by the caller, which is why
   * this takes numbers rather than the plan objects: "talk to us" is not a
   * low price of zero.
   */
  offers?: {
    lowPrice: number;
    highPrice: number;
    priceCurrency: string;
    offerCount: number;
  };
}

/**
 * A software product.
 *
 * There is deliberately no `aggregateRating`. It is the most common piece of
 * invented structured data in this category — a rating and a review count for
 * reviews that do not exist anywhere on the page — and it is both a policy
 * violation and a claim the buyer would be making about their own product. A
 * template that ships one teaches the wrong habit on day one.
 */
export function softwareApplicationSchema(input: SoftwareApplicationInput) {
  const schema: Record<string, unknown> = {
    "@type": "SoftwareApplication",
    name: input.name,
    description: input.description,
  };
  if (input.url) schema.url = input.url;
  if (input.image) schema.image = input.image;
  if (input.applicationCategory) schema.applicationCategory = input.applicationCategory;
  if (input.operatingSystem) schema.operatingSystem = input.operatingSystem;
  if (input.providerName) {
    schema.provider = { "@type": "Organization", name: input.providerName };
  }
  if (input.offers) {
    schema.offers = {
      "@type": "AggregateOffer",
      lowPrice: input.offers.lowPrice.toFixed(2),
      highPrice: input.offers.highPrice.toFixed(2),
      priceCurrency: input.offers.priceCurrency,
      offerCount: input.offers.offerCount,
    };
  }
  return schema;
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

/* ────────────────────────────────────────────────────────────────────────
   Site-level schema: who publishes this, and where the visitor is
   ──────────────────────────────────────────────────────────────────────── */

/**
 * Drops fields that carry nothing, so an absent value never becomes an empty
 * one in the output.
 *
 * Structured data is a machine-readable statement, and a field present but
 * blank reads as a claim about nothing. Whether a given value counts as real is
 * the caller's judgment -- a studio may hold placeholders for details that do
 * not exist yet, and it filters those before calling rather than teaching this
 * helper its own conventions.
 */
function omitEmpty<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    if (typeof v === "string" && v.trim() === "") continue;
    out[k] = v;
  }
  return out as Partial<T>;
}

export interface OrganizationInput {
  name: string;
  url: string;
  logo?: string;
  email?: string;
  telephone?: string;
  address?: { line1?: string; line2?: string; country?: string };
  sameAs?: string[];
}

/**
 * The publisher behind the site.
 *
 * Only fields that are true today. Nothing here asserts a legal identity: trade
 * name, tax number and register entries are deliberately absent until they
 * exist, rather than present and empty.
 */
export function organizationSchema(input: OrganizationInput) {
  const address = input.address
    ? omitEmpty({
        "@type": "PostalAddress",
        streetAddress: input.address.line1,
        addressLocality: input.address.line2,
        addressCountry: input.address.country,
      })
    : undefined;

  return {
    "@type": "Organization",
    ...omitEmpty({
      name: input.name,
      url: input.url,
      logo: input.logo,
      email: input.email,
      telephone: input.telephone,
      sameAs: input.sameAs && input.sameAs.length > 0 ? input.sameAs : undefined,
      address: address && Object.keys(address).length > 1 ? address : undefined,
    }),
  };
}

/** The site itself, tied to its publisher. No SearchAction: there is no search. */
export function websiteSchema(input: { name: string; url: string; publisherName: string }) {
  return {
    "@type": "WebSite",
    name: input.name,
    url: input.url,
    publisher: { "@type": "Organization", name: input.publisherName },
  };
}

/**
 * Where the visitor is in the catalog.
 *
 * Positions are 1-based and the list includes the current page, which is what
 * lets a result show the path rather than a bare title.
 */
export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/** An ordered set of pages, for a listing. The order is the one on the page. */
export function itemListSchema(items: { name: string; url: string }[]) {
  return {
    "@type": "ItemList",
    numberOfItems: items.length,
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      url: item.url,
    })),
  };
}

/**
 * Several schemas on one page, as one graph.
 *
 * Emitting two separate script blocks works, but a graph lets the nodes
 * reference each other and is what validators expect when a page is both a
 * listing and a step in a breadcrumb.
 */
export function graph(...nodes: unknown[]) {
  return { "@context": "https://schema.org", "@graph": nodes.filter(Boolean) };
}

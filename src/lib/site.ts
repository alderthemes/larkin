/**
 * Site settings: the schema and the reader. This file is ours; an update
 * replaces it. Your values live in data files an update never touches: the
 * language and the map on the contact page in src/data/site.json, the
 * business details (name, e-mail, phone, the contact form address) in
 * src/data/business.json, the addresses and opening hours in the
 * src/content/locations/ collection, the interface strings in
 * src/i18n/*.json.
 */
import { createT } from "@studio/core/utils/i18n";
import { businessSchema, readBusiness } from "@studio/core/utils/business";
import { z } from "astro/zod";
import businessData from "../data/business.json";
import siteData from "../data/site.json";
import en from "../i18n/en.json";
import tr from "../i18n/tr.json";

/* The dictionaries. A new language: copy src/i18n/en.json, translate the
   values, add it here (this file is ours, so keep a note of the change for
   the next update) and set `locale` in src/data/site.json. */
const dicts = { en, tr };
type SiteLocale = keyof typeof dicts;
const siteLocales = Object.keys(dicts) as [SiteLocale, ...SiteLocale[]];

/**
 * src/data/site.json. Strict: a key the schema does not know stops the build,
 * so a misspelt setting never silently keeps the default.
 *
 *  - locale: the active language, one of the dictionaries above. "tr" and
 *    the whole interface switches.
 *  - mapEmbedUrl: the map on the contact page. Paste the `src` of your
 *    provider's embed iframe here (in Google Maps: Share -> Embed a map ->
 *    copy the src). Leave it empty ("") and the section does not render at
 *    all, so the page never shows an empty gray box where a map should be.
 *    The build allows the address's host in the Content-Security-Policy's
 *    `frame-src` by itself (public/_headers is generated from this file);
 *    without that the browser would block the embed and the map would stay
 *    blank.
 */
export const siteSchema = z.strictObject({
  locale: z.enum(siteLocales),
  mapEmbedUrl: z.string(),
});

/**
 * Checks the site settings and returns them. On a wrong or missing field the
 * build stops with the file, every field that is wrong and what each one
 * needs, instead of a page that silently falls back to English.
 */
export function readSite(data: unknown, { file }: { file: string }): z.infer<typeof siteSchema> {
  const result = siteSchema.safeParse(data);
  if (result.success) return result.data;
  const lines = result.error.issues.flatMap((issue) => {
    if (issue.code === "unrecognized_keys")
      return issue.keys.map((key) => `    - ${key}: not a site setting. Check the spelling; the settings are declared in src/lib/site.ts.`);
    const field = issue.path.length ? issue.path.join(".") : "(the whole file)";
    return [`    - ${field}: ${issue.message}`];
  });
  throw new Error(["", `  ${file}: the site settings are not valid.`, "", ...lines, "", "  Fix the file and build again.", ""].join("\n"));
}

const site = readSite(siteData, { file: "src/data/site.json" });

/** Active language, from src/data/site.json → locale. */
export const LOCALE: SiteLocale = site.locale;

/** The map on the contact page, from src/data/site.json → mapEmbedUrl. */
export const mapEmbedUrl = site.mapEmbedUrl;

const translate = createT(dicts[LOCALE], en);

/** A dictionary string. `{name}` in any string is the business name from
 *  src/data/business.json, so a sentence that mentions the café never keeps
 *  an old name after the owner changes it. */
export const t = (key: string, params?: Record<string, string | number>): string =>
  translate(key, { name: business.name, ...params });

/**
 * The café's own fields on top of core's business details. The addresses
 * and opening hours are not here: they come from the location files, which
 * is what makes opening a second shop a matter of adding one markdown file.
 */
const cafeSchema = businessSchema.extend({
  /* Required in core for the address; here every address (with its
     country) is a location file's, and nothing reads this one. */
  addressCountry: businessSchema.shape.addressCountry.optional(),
  /* Optional in core, printed here (footer, contact page, structured data,
     /llms.txt): required, so a missing one stops the build instead of
     printing "undefined". */
  phone: z.string().min(1),
  priceRange: z.string().min(1),
  /** Year founded, used on the about page and in schema.org. */
  foundingYear: businessSchema.shape.foundingYear.unwrap(),
  /** Shown as the cuisine line in the structured data and /llms.txt. */
  servesCuisine: z.array(z.string().min(1)).min(1),
  /* The café's time zone (IANA name, e.g. "America/Los_Angeles"). The "Today"
     line and the "Open now" badge are worked out for it, not for the
     visitor's clock. One for the café; every shop's week is read in it. */
  timeZone: businessSchema.shape.timeZone.unwrap(),
  /**
   * Where the contact form posts. Cloudflare does not process form posts on
   * its own, and with "#" the form goes nowhere: put a form service endpoint
   * here (Formspree, Basin, or similar). The step is in docs/README.md. The
   * build adds the address's host to the Content-Security-Policy's
   * `form-action` by itself; not shown in the content editor, because
   * changing the form service is a set-up step, not an edit.
   */
  formAction: z.string(),
});

/* Name, e-mail, phone, price range, founding year, what the café serves, the
   time zone and the contact form address live in src/data/business.json (the "Business
   details" form in the content editor) and are checked here; a wrong or
   missing field stops the build. */
export const business = readBusiness(businessData, { file: "src/data/business.json", schema: cafeSchema });

/* The demo's contact details are placeholders: a `.example` address can never
   receive mail, and +1 503 555 01xx is a range reserved for fiction. Unlike
   example.com they look real to anyone who does not know those conventions,
   and they are not decoration — they are declared in three JSON-LD nodes and
   in /llms.txt, so shipping them publishes a phone number that does not ring
   and an address that bounces. The build says so once. */
const DEMO_CONTACT = {
  email: "hello@example.com",
  phone: "+1 503 555 0142",
};

if (import.meta.env.PROD) {
  const stale = (Object.keys(DEMO_CONTACT) as Array<keyof typeof DEMO_CONTACT>).filter(
    (key) => business[key] === DEMO_CONTACT[key]
  );
  if (stale.length > 0) {
    console.warn(
      `\n  [larkin] Still the demo's ${stale.join(" and ")} in src/data/business.json.\n` +
        `           These are published in structured data and in /llms.txt.\n`
    );
  }
}

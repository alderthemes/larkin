/**
 * Site configuration, written to be the only file you have to edit.
 * Interface strings live in src/i18n/*.json, and addresses and hours live in
 * the src/content/locations/ collection. What is left here is the identity
 * of the business itself.
 */
import { createT, DEFAULT_LOCALE, type Locale } from "@studio/core/utils/i18n";
import en from "../i18n/en.json";
import tr from "../i18n/tr.json";

/** Active language. Set it to "tr" and the whole interface switches. */
export const LOCALE: Locale = DEFAULT_LOCALE;

const dicts: Record<Locale, typeof en> = { en, tr };
export const t = createT(dicts[LOCALE], en);

/**
 * Where the contact form posts. On a host other than Cloudflare or Netlify,
 * put a form service endpoint here — Formspree, Basin, or similar. The step
 * is in docs/README.md.
 */
export const contactFormAction = "#";

/**
 * The map on the contact page.
 *
 * Paste the `src` of your provider's embed iframe here (in Google Maps:
 * Share -> Embed a map -> copy the src). Leave it empty and the section does
 * not render at all, so the page never shows an empty gray box where a map
 * should be.
 *
 * The shipped Content-Security-Policy allows `frame-src https:`, so any
 * https provider works without editing public/_headers.
 */
export const mapEmbedUrl = "";

/**
 * The identity of the business, feeding the schema.org LocalBusiness
 * fields. Addresses and hours come from the location files instead, which
 * is what makes opening a second shop a matter of adding one markdown file.
 */
export const business = {
  name: t("site.name"),
  email: "hello@fernandfilter.example",
  phone: "+1 503 555 0142",
  priceRange: "$",
  servesCuisine: ["Coffee", "Light bites"],
  /** Year founded — used on the about page and in schema.org */
  foundingYear: "2019",
};

/* The demo's contact details are placeholders: a `.example` address can never
   receive mail, and +1 503 555 01xx is a range reserved for fiction. Unlike
   example.com they look real to anyone who does not know those conventions,
   and they are not decoration — they are declared in three JSON-LD nodes and
   in /llms.txt, so shipping them publishes a phone number that does not ring
   and an address that bounces. The build says so once. */
const DEMO_CONTACT = {
  email: "hello@fernandfilter.example",
  phone: "+1 503 555 0142",
};

if (import.meta.env.PROD) {
  const stale = (Object.keys(DEMO_CONTACT) as Array<keyof typeof DEMO_CONTACT>).filter(
    (key) => business[key] === DEMO_CONTACT[key]
  );
  if (stale.length > 0) {
    console.warn(
      `\n  [larkin] Still the demo's ${stale.join(" and ")} in src/lib/site.ts.\n` +
        `           These are published in structured data and in /llms.txt.\n`
    );
  }
}

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
 * The identity of the business, feeding the schema.org LocalBusiness
 * fields. Addresses and hours come from the location files instead, which
 * is what makes opening a second shop a matter of adding one markdown file.
 */
export const business = {
  name: en.site.name,
  email: "hello@fernandfilter.example",
  phone: "+1 503 555 0142",
  priceRange: "$",
  servesCuisine: ["Coffee", "Light bites"],
  /** Handle for the Instagram embed slot. Leave it empty and the section
   *  does not render. */
  instagramHandle: "",
  /** Year founded — used on the about page and in schema.org */
  foundingYear: "2019",
};

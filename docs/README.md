# Larkin / Café — Documentation

A complete five-page café website: a seasonal menu, one or many locations,
honest workspace information, FAQ and legal pages. Built with Astro 7,
Tailwind CSS 4 and TypeScript. No JavaScript framework, no build-time surprises.

**This theme is free.** Same quality bar as the paid catalog, same license
terms for client work. If your client needs table reservations and a deeper
multi-course menu, that is Bramley.

---

## 1. Quick start

```bash
# Requirements: Node 22+ (check with `node -v`)
npm install
npm run dev      # http://localhost:4321
```

Other commands:

```bash
npm run build    # production build -> dist/
npm run preview  # serve the production build locally
npm run check    # TypeScript + Astro diagnostics
```

If port 4321 is taken, Astro picks the next free port and prints it.

---

## 2. Make it yours (the 15-minute pass)

You only ever need to touch **four places**. Nothing is hardcoded in components.

| What | Where |
|---|---|
| Business identity, email, phone | `src/lib/site.ts` |
| Every visible string / language | `src/i18n/en.json` |
| Menu, locations, FAQ, legal pages | `src/content/` |
| Colors, fonts, corner radius | the `:root` block in `src/styles/global.css` |

### Step 1: Business identity (`src/lib/site.ts`)

```ts
export const business = {
  name: en.site.name,                       // comes from the i18n file
  email: "hello@fernandfilter.example",     // your email
  phone: "+1 503 555 0142",                 // your phone
  priceRange: "$",                          // $, $$, $$$
  servesCuisine: ["Coffee", "Light bites"],
  foundingYear: "2019",
};
```

The contact form target lives in the same file:

```ts
export const contactFormAction = "#";       // see section 6
```

Addresses and opening hours are **not** here. They live in the locations
collection, because a café can have more than one shop (section 4).

### Step 2: Wording (`src/i18n/en.json`)

Every string on the site is in this one file, grouped by area:

```json
{
  "site": { "name": "Fern & Filter", "tagline": "Specialty coffee and light bites…" },
  "hero": { "title": "Good coffee, no rush", "lead": "…" },
  "workspace": { "laptopBody": "Welcome all day. On weekends we ask…" }
}
```

Change `site.name` and the header, footer, page titles, schema.org data and
`llms.txt` all follow. There is no second place to edit.

### Step 3: Content (`src/content/`)

One markdown file per item. To add a drink, copy an existing file:

```bash
cp src/content/menu/cappuccino.md src/content/menu/cortado.md
```

```markdown
---
name: "Cortado"
description: "Equal parts espresso and steamed milk."
price: 4.5
category: "espresso"     # espresso | brew | food | seasonal
tags: ["decaf"]          # plant-based | vegetarian | gluten-free | decaf
seasonal: false          # true adds the "Seasonal" badge
order: 35                # position inside its category
featured: false          # true also shows it on the home page
available: true          # false hides it without deleting the file
---
```

Save; the dev server reloads. The menu page, the home page highlights and the
`Menu`/`MenuItem` schema.org markup all update from this one file.

### Step 4: Colors & fonts (`src/styles/global.css`)

The whole visual identity is one `:root` block. Change the eleven primary
values and the three accent values and the entire site re-themes:

```css
:root {
  --ts-color-primary-900: #1a1917;  /* headings, buttons */
  --ts-color-accent-600:  #a6522f;  /* eyebrows, focus ring, seasonal badge */
  --ts-surface:           #f8f7f4;  /* page background */
  --ts-surface-alt:       #efede8;  /* alternating sections, cards */
  --ts-color-success:     #166534;  /* the "Open now" dot and its label */
  --ts-font-display: "Instrument Sans Variable", ui-sans-serif, system-ui, sans-serif;
  --ts-font-sans: var(--ts-font-display);  /* an alias, not a second font */
}
```

One file keeps its own copy of two of these: `public/favicon.svg` is a
standalone image, so its two colors are written into it as hex. Open it in any
text editor and change them to match if you re-theme.

**Check contrast after changing colors.** Body text on the background must be
at least 4.5:1, and `--ts-color-accent-600` is used for small text, so it needs
4.5:1 too. Use any contrast checker; the shipped palette passes with room to
spare (16.4:1 for body text, 5.1:1 for the accent).

`--ts-font-sans` is an alias of `--ts-font-display`, not a second family: this
template sets one typeface. Point it at another variable to run two.

To change fonts, install the family and swap the import at the top of the file:

```bash
npm install @fontsource-variable/figtree
```

```css
@import "@fontsource-variable/figtree";
/* then set --ts-font-display: "Figtree Variable", …; */
```

Fonts are self-hosted. There are no requests to Google Fonts, which keeps the
site GDPR-friendly and removes a render-blocking round trip.

### Step 5: Images

Replace the files in `src/assets/images/` keeping the same names:

| File | Where it appears | Suggested size |
|---|---|---|
| `01-hero-room.jpg` | Home hero | 1800px wide, 4:3 |
| `02-bar.jpg` | Gallery + About page | 1400px wide, 3:2 |
| `03-latte.jpg` … `07-detail.jpg` | Gallery strip | 1400px wide, 3:2 |
| `public/og.jpg` | Social sharing preview | exactly 1200×630 |
| `public/favicon.svg` | Browser tab icon | any square SVG; its colors are written in the file |

Astro converts them to WebP at several widths during build, so ship the
originals at the sizes above and let the build do the rest.

**If an image is missing, its section disappears rather than breaking.** Delete
all seven and the site still renders correctly, just without photography. That
also means you can go live before the client photoshoot.

The demo photographs are AI-generated and licensed for use in sites you build
with this template. See `IMAGE-LICENSE.md`.

---

## 3. Switching language

Two files ship: `src/i18n/en.json` and `src/i18n/tr.json`. To switch the whole
site, change one line in `src/lib/site.ts`:

```ts
export const LOCALE: Locale = "tr";   // "en" | "tr"
```

To add a language, copy `en.json` to e.g. `de.json` and translate the values
(never the keys). Registering it takes **two** files, not one — this is the
single exception to the "four places" rule in section 2.

First widen the language list in `core/utils/i18n.ts`:

```ts
export type Locale = "en" | "tr" | "de";
export const LOCALES: Locale[] = ["en", "tr", "de"];
```

Then register the dictionary in `src/lib/site.ts`:

```ts
import de from "../i18n/de.json";
const dicts: Record<Locale, typeof en> = { en, tr, de };
export const LOCALE: Locale = "de";
```

Skip the first file and the second one does not compile: `Locale` is a fixed
list of the languages the theme knows about, so `"de"` is not one of them yet.
`astro build` does not type-check, so it stays green and publishes English
text under `<html lang="de">` — run `npm run check` after this change and you
will see the two errors instead.

Any key you leave out falls back to English rather than rendering blank.

One number worth knowing before you choose: the shipped font is split by
character range, and Turkish reaches into the second file. Four of its
letters (U+011F, U+0130, U+015E, U+015F) sit outside the Latin range, so a
Turkish page downloads the latin-ext file as
well — 11 KB on top of the 30 KB the Latin file costs. English pages never
fetch it. Nothing to fix; it is the price of the alphabet.

---

## 4. Content collections

### Menu (`src/content/menu/`)

Categories are fixed to `espresso`, `brew`, `food`, `seasonal`. They are
declared once, at the top of `src/content.config.ts`, and everything else —
the schema, the menu page, the sticky navigation — reads that list:

```ts
export const MENU_CATEGORIES = ["espresso", "brew", "food", "seasonal", "bottles"] as const;
```

Add the matching label under `menu.categories` in each i18n file at the same
time; a category with no label renders its own key.

Empty categories show a short "nothing here yet" line instead of an empty gap,
and disappear from the sticky category navigation.

### Locations (`src/content/locations/`)

**One file per shop.** With a single file the site reads as a single-location
café. Add a second file and the home page grows an "All locations" link, the
contact page switches to a two-column card grid, and the footer lists both.
No code changes.

```markdown
---
name: "SE Division"
streetAddress: "4400 SE Division St"
addressLocality: "Portland"
addressRegion: "OR"
postalCode: "97206"
addressCountry: "US"
phone: "+1 503 555 0143"
mapUrl: "https://www.google.com/maps/search/?api=1&query=…"
hours:
  - dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    opens: "07:00"
    closes: "18:00"
  - dayOfWeek: ["Saturday", "Sunday"]
    opens: "08:00"
    closes: "17:00"
wifi: true
outlets: true
laptopFriendly: true
primary: false      # only one location should be primary
order: 20
---
```

The `primary` location supplies the address and hours used in the home page
card and in the schema.org markup.

Opening hours drive the "Today: 07:00 – 18:00 · Open now" line. That status is
computed in the visitor's browser from their own clock, and falls back to the
plain hours line when JavaScript is off, so it is never wrong or blank.

### FAQ (`src/content/faq/`)

```markdown
---
question: "Do you take reservations?"
answer: "We don't. Fern & Filter is walk-in only…"
order: 10
---
```

These feed the home page accordion and the `FAQPage` schema, which is what AI
assistants and search engines quote when someone asks about your café.

### Legal pages (`src/content/legal/`)

`privacy.md` and `terms.md` render at `/legal/privacy/` and `/legal/terms/`.
Adding `cookies.md` creates `/legal/cookies/` automatically and it appears
nowhere in the navigation until you link it.

> **The supplied legal text is a template, not legal advice.** Adapt it to your
> business and to the law that applies to you (GDPR, CCPA, KVKK or equivalent),
> and have a lawyer review it before you publish.

---

## 5. What this theme deliberately does not do

**No reservation system.** Cafés take walk-ins. Bolting restaurant booking
logic onto a café site is the most common mistake in this vertical: it adds a
funnel nobody uses and makes the "just come in" promise ambiguous. The site
says "walk-ins only, no reservations" out loud, because that answer is what the
visitor is actually looking for.

If your client genuinely needs bookings, Bramley ships that flow properly
(date/time/party-size form plus an embed slot for an external widget).

**No dark mode.** A café is a daytime identity. The token architecture supports
adding it later; nothing here blocks it.

---

### Lockfiles and reproducible installs

`package-lock.json` ships with the template and pins every dependency to the
version this template was built and tested against. Keep it in version
control, and on a build server run `npm ci` rather than `npm install` — it
installs exactly what the lockfile says and fails instead of silently
resolving something newer.

---

## 6. The contact form

The form posts to whatever you set in `contactFormAction`. It ships as `"#"`,
which means the form renders but goes nowhere — set this before launch.

| Host | What to use |
|---|---|
| Netlify | Add `netlify` to the `<form>` in `src/pages/contact.astro`; Netlify Forms picks it up |
| Cloudflare, Vercel, static hosts | A form service: Formspree, Basin, Web3Forms |
| Your own backend | Any URL that accepts a POST |

Example with Formspree:

```ts
export const contactFormAction = "https://formspree.io/f/your-form-id";
```

**Then add the service's origin to the Content-Security-Policy.** The policy
ships with `form-action 'self'`, which means the browser blocks a submission to
any other origin — **silently**. The page stays put, no error is shown, and the
message goes nowhere. Edit the `form-action` directive in both `public/_headers`
and `netlify.toml`:

```
form-action 'self' https://formspree.io
```

(Netlify Forms needs no change: the post stays on your own origin.)

The form already includes a hidden honeypot field named `company`. Most form
services can be configured to reject submissions where it is filled in — that
removes the bulk of bot spam without a CAPTCHA.

---

## 7. SEO and schema.org

Generated automatically from your content, with nothing to maintain by hand:

| Page | Structured data |
|---|---|
| Home | `CafeOrCoffeeShop` (address, hours, price range, `acceptsReservations: false`) + `FAQPage` |
| Menu | `Menu` → `MenuSection` → `MenuItem` with prices and dietary tags |
| About, Contact | `CafeOrCoffeeShop` |
| All pages | canonical URL, unique title and description, Open Graph, Twitter card |

`/llms.txt` is generated too: a plain-text summary of the business, its
locations, hours and amenities for AI assistants that cite local businesses.

### Site URL

**This is the one setting you cannot skip.** Canonical tags, Open Graph URLs,
`robots.txt`, `sitemap.xml` and `llms.txt` are all built from it.

Copy `.env.example` to `.env` and put your domain in:

```bash
SITE=https://your-cafe.com
```

On a host, set the same thing as a build environment variable — Netlify under
`[build.environment]` in `netlify.toml`, Cloudflare under Settings → Build →
Variables. Either way the build reads it; you do not have to edit
`astro.config.mjs`.

Leave it unset and two things happen, both on purpose:

- the build prints a warning naming the file and the variable;
- every page ships `<meta name="robots" content="noindex">`.

The second one looks drastic and is the safer failure. A site indexed under
`example.com` hands its pages to a domain that is not yours, and undoing that
takes weeks. `noindex` shows up in Search Console as "excluded by noindex" and
one environment variable reverses it.

---

## 8. Deploying

The build output is a plain static `dist/` folder. It works anywhere.

### Cloudflare Pages / Workers

Framework preset **Astro**, build command `npm run build`, output `dist`.
Node version comes from the included `.node-version`. A `wrangler.jsonc` is
included; change `name` to your project.

### Netlify

`netlify.toml` is included with the build command, publish directory, Node
version and security headers already set. Connect the repo and deploy.

### Vercel

Framework preset **Astro**; defaults are correct.

### Any other host

```bash
npm run build
# upload the contents of dist/ to your host
```

### Before you go live: security checklist

- `public/_headers` (Cloudflare) and `netlify.toml` ship with a strict
  Content-Security-Policy, HSTS, `X-Content-Type-Options` and a restrictive
  `Permissions-Policy`. **If you add a third-party embed (a map, an Instagram
  feed, analytics), you must widen the CSP for that origin** or the browser
  will block it.
- Any `<iframe>` you paste in should keep `sandbox` and `referrerpolicy`.
- Set `astro.config.mjs` `site` to your real domain.
- Replace the legal template text.

---

## 9. Updating

Your customizations live in four places (section 2). Everything else can be
replaced wholesale when a new version ships.

```bash
# if you cloned the repo:
git fetch origin
git merge origin/main
# resolve conflicts in your four customization files only
```

Check `CHANGELOG.md` before updating; breaking changes are listed with a
migration note.

---

## 10. File reference

```
src/
  assets/images/         demo photography (replace with your own)
  components/            site-specific components
    SiteHeader.astro     sticky nav + CSS-only mobile menu
    SiteFooter.astro     brand, links, hours, locations
    LocationCard.astro   address + today's hours + amenities + directions
    OpenStatus.astro     "Today: 07:00 – 18:00 · Open now"
    MenuList.astro       categorized menu list with seasonal badges
    WorkspaceInfo.astro  wifi / power / noise / laptop policy block
    GalleryStrip.astro   horizontal photo strip (hides itself if empty)
    FaqList.astro        accordion, zero JavaScript
  content/               YOUR CONTENT — menu, locations, faq, legal
  i18n/                  YOUR WORDING — en.json, tr.json
  layouts/BaseLayout.astro   meta, Open Graph, JSON-LD, page shell
  lib/
    site.ts              YOUR BUSINESS IDENTITY
    locations.ts         location helpers (hours, address, schema)
  pages/                 routes; add a .astro file to add a page
  styles/global.css      YOUR COLORS AND FONTS (the :root block)
core/                    shared design tokens and components
public/
  favicon.svg            browser tab icon (colors are written in the file)
  og.jpg                 social sharing preview, 1200×630
  _headers               security headers + cache rules (Cloudflare, Netlify)
  open-status.js         puts today's hours on the badge, in the visitor's clock
  menu-close.js          closes the mobile menu on Escape
.env.example             copy to .env and set SITE before your first deploy
```

---

## 11. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `Cannot find module 'astro'` | dependencies not installed | `npm install` |
| Port 4321 already in use | another dev server is running | Astro auto-picks the next port; or `npm run dev -- --port 4322` |
| Fonts look wrong / fall back | font package not installed | `npm install` again; check the `@import` lines at the top of `global.css` |
| A menu item does not appear | `available: false`, or an invalid `category` | check the frontmatter against the enum in `src/content.config.ts` |
| Gallery section is missing | no images in `src/assets/images/` | add the files, or leave it: the section hides itself by design |
| "Open now" never appears | JavaScript disabled, or no `hours` on the primary location | the plain hours line is the intended fallback; add `hours` to the location file |
| Map embed does not load | Content-Security-Policy blocks the origin | add the embed origin to `frame-src` in `public/_headers` and `netlify.toml` |
| Form submits but nothing happens, and there is no error | Content-Security-Policy `form-action` does not list the form service | add its origin to `form-action` in `public/_headers` and `netlify.toml` |
| Build fails after renaming the project folder | the link npm made to `./core` still points at the old path | `npm install` (the build itself no longer needs it; `npm run check` does) |
| `npm run check` reports a type error | a TypeScript error in your edits | the file and line are in the output; `npm run build` does not run this check, so a type error never blocks a build |
| `npm ls` says "extraneous" for `@emnapi/*`, `tslib` or `@img/sharp-wasm32` | a known friction between npm and the image library's optional WASM packages | nothing to fix — the install is not broken, and `npm ci` reports the same |
| A build error on Windows ends with `Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)` | a Node crash artifact printed after the real error | read the error ABOVE that line; that one is the actionable message. The build still exits non-zero, so automated deploys still fail correctly |
| Pages say `noindex` and canonical URLs read `example.com` | `SITE` is not set | see section 7, "Site URL" — set it in `.env` or in your host's build variables |

---

## 12. Support

Email support is included with this theme. Please send: what you were doing,
what you expected, what happened, and your Node version (`node -v`).

Seasonal menus go stale. If you hand this site to a client, agree who updates
the seasonal items and when — the whole point of the content collection is that
it takes two minutes and no developer.

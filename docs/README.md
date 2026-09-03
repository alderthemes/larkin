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

### Step 1 — Business identity (`src/lib/site.ts`)

```ts
export const business = {
  name: en.site.name,                       // comes from the i18n file
  email: "hello@fernandfilter.example",     // your email
  phone: "+1 503 555 0142",                 // your phone
  priceRange: "$",                          // $, $$, $$$
  servesCuisine: ["Coffee", "Light bites"],
  instagramHandle: "",                      // leave empty to hide the section
  foundingYear: "2019",
};
```

The contact form target lives in the same file:

```ts
export const contactFormAction = "#";       // see section 6
```

Addresses and opening hours are **not** here. They live in the locations
collection, because a café can have more than one shop (section 4).

### Step 2 — Wording (`src/i18n/en.json`)

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

### Step 3 — Content (`src/content/`)

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

### Step 4 — Colors & fonts (`src/styles/global.css`)

The whole visual identity is one `:root` block. Change the eleven primary
values and the three accent values and the entire site re-themes:

```css
:root {
  --ts-color-primary-900: #231e18;  /* headings, buttons */
  --ts-color-accent-600:  #956048;  /* eyebrows, focus ring, seasonal badge */
  --ts-surface:           #faf8f5;  /* page background */
  --ts-surface-alt:       #f3efe8;  /* alternating sections, cards */
  --ts-font-display: "Bricolage Grotesque Variable", ui-sans-serif, sans-serif;
  --ts-font-sans:    "Inter Variable", ui-sans-serif, system-ui, sans-serif;
}
```

**Check contrast after changing colors.** Body text on the background must be
at least 4.5:1, and `--ts-color-accent-600` is used for small text, so it needs
4.5:1 too. Use any contrast checker; the shipped palette passes with room to
spare (16.5:1 for body text, 4.9:1 for the accent).

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

### Step 5 — Images

Replace the files in `src/assets/images/` keeping the same names:

| File | Where it appears | Suggested size |
|---|---|---|
| `01-hero-room.jpg` | Home hero | 1800px wide, 4:3 |
| `02-bar.jpg` | Gallery + About page | 1400px wide, 3:2 |
| `03-latte.jpg` … `07-detail.jpg` | Gallery strip | 1400px wide, 3:2 |
| `public/og.jpg` | Social sharing preview | exactly 1200×630 |

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

To add a language, copy `en.json` to e.g. `de.json`, translate the values
(never the keys), then register it:

```ts
import de from "../i18n/de.json";
const dicts: Record<Locale, typeof en> = { en, tr, de };
```

Any key you leave out falls back to English rather than rendering blank.

---

## 4. Content collections

### Menu (`src/content/menu/`)

Categories are fixed to `espresso`, `brew`, `food`, `seasonal`. To rename or
add one, edit the enum in `src/content.config.ts` and add the matching label
under `menu.categories` in each i18n file:

```ts
category: z.enum(["espresso", "brew", "food", "seasonal", "bottles"]),
```

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

Set your real domain before launch, in `astro.config.mjs`:

```js
export default defineConfig({
  site: "https://your-cafe.com",
});
```

This is what canonical URLs, Open Graph URLs and `llms.txt` are built from. It
ships as `https://example.com` on purpose so that a forgotten value is obvious
rather than silently wrong.

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

### Before you go live — security checklist

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
public/                  favicon, og.jpg, _headers
```

---

## 11. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `Cannot find module 'astro'` | dependencies not installed | `npm install` |
| Port 4321 already in use | another dev server is running | Astro auto-picks the next port; or `npm run dev -- --port 4322` |
| Fonts look wrong / fall back | font package not installed | `npm install` again; check the `@import` lines at the top of `global.css` |
| A menu item does not appear | `available: false`, or an invalid `category` | check the frontmatter against the enum in `src/content.config.ts` |
| Gallery section is missing | no images in `src/assets/images/` | add the files, or leave it — the section hides itself by design |
| "Open now" never appears | JavaScript disabled, or no `hours` on the primary location | the plain hours line is the intended fallback; add `hours` to the location file |
| Map embed does not load | Content-Security-Policy blocks the origin | add the embed origin to `frame-src` in `public/_headers` and `netlify.toml` |
| Build fails on `astro check` | a TypeScript error in your edits | run `npm run check` for the exact file and line |

---

## 12. Support

Email support is included with this theme. Please send: what you were doing,
what you expected, what happened, and your Node version (`node -v`).

Seasonal menus go stale. If you hand this site to a client, agree who updates
the seasonal items and when — the whole point of the content collection is that
it takes two minutes and no developer.

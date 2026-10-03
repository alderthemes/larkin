# Larkin / Café — Documentation

A complete five-page café website: a seasonal menu, one or many locations,
honest workspace information, FAQ and legal pages. Built with Astro 7,
Tailwind CSS 4 and TypeScript. No JavaScript framework, no build-time surprises.

**This theme is free.** Same quality bar as the paid catalog, same license
terms for client work. If your client needs table reservations and a deeper
multi-course menu, that is Bramley.

---

## Launch guide (do these in order)

From the zip to a live site that your client edits in a web form. Ten steps.
Each one needs something the step before it made, so keep the order. Each one
ends with what you should see when it worked.

Steps marked **You do this (needs your account)** need a sign-in, a permission
screen or a secret key. An AI coding tool cannot do them for you. `AGENTS.md`
tells it to stop at those steps and tell you what to click.

1. [Install it and run it on your computer](#launch-1)
2. [Make it yours](#launch-2)
3. [Put it in a private GitHub repository](#launch-3)
4. [Put the site live, with `SITE` set](#launch-4)
5. [Deploy the login service](#launch-5)
6. [Create the GitHub OAuth app](#launch-6)
7. [Give the login service its keys](#launch-7)
8. [Turn the editor on and push](#launch-8)
9. [Sign in at `/admin` and change one menu item](#launch-9)
10. [Give your client a login](#launch-10)

The editor is turned on at step 8, after the login service works. The enable
command needs the login service's address, and doing it last means `/admin`
never goes live pointing at a login service that is not ready.

<a id="launch-1"></a>

### Step 1. Install it and run it on your computer

```bash
npm install
npm run dev
```

**You should see:** the site at http://localhost:4321. A "SITE is not set" box
in the terminal is normal on your computer. If something fails, see the
[troubleshooting table](#12-troubleshooting).

<a id="launch-2"></a>

### Step 2. Make it yours

Put in the café's own details and words. [Section 2](#2-make-it-yours-the-15-minute-pass)
walks through the files: `src/lib/site.ts` (e-mail, phone),
`src/i18n/en.json` (the name and every visible sentence),
`src/content/locations/` (addresses and opening hours, one file per shop) and
`src/content/menu/` (one file per item). Menu items, questions and shops
(addresses, opening hours) can also wait until the editor works (step 9). The
e-mail and phone in `src/lib/site.ts` cannot: they stay in that file.

```bash
npm run build
```

**You should see:** your name, shop and menu on http://localhost:4321, and
`npm run build` ends without an error.

<a id="launch-3"></a>

### Step 3. Put it in a private GitHub repository

**You do this (needs your account).** On GitHub, create an empty **Private**
repository (no README, no license, no `.gitignore`). Then run the commands in
[From the zip to your own GitHub repository](#zip-to-repo) in the project
folder.

**You should see:** your project's files on the repository's page on GitHub.
Write down its name as `owner/name`, for example `your-name/your-repo`. Step 8
needs it.

<a id="launch-4"></a>

### Step 4. Put the site live, with `SITE` set

**You do this (needs your account).** Connect the repository to Cloudflare,
which rebuilds the site on every push. The editor saves by pushing, so a host
where you upload files by hand will not work.

**Cloudflare (the package's `wrangler.jsonc`).** In Cloudflare, open
Workers & Pages and create a new application from your GitHub repository.
Cloudflare's guide names the buttons **Create application**, then **Get
started** next to **Import a repository**
([Cloudflare's Workers Builds guide](https://developers.cloudflare.com/workers/ci-cd/builds/), read 2026-10-03);
the dashboard's wording changes from time to time, so follow the screen that
offers a Git repository. Pick the Git account that owns the repository, select
it, and on the set-up screen fill in:

- **Worker name** (the dashboard may call it the project name) is filled in
  with the repository's name. It must be the same as `"name"` in
  `wrangler.jsonc` (it ships as `larkin`), or the build fails: the same guide says
  the two must match. Change one of the two so they match.
- **Build command**: `npm run build`.
- **Deploy command**: `npx wrangler deploy` (fill it in if it is not already
  there).
- A build variable named `SITE` with your live address as its value, for
  example `https://your-domain.com`. Set before the first deploy, the very
  first build already uses it. If the set-up screen gives you no place for
  it, deploy first, then add it under the Worker's **Settings**, **Build**
  (build variables and secrets; [Cloudflare's build settings](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/), read 2026-10-03)
  and push again.
- Node version: Cloudflare reads the `.node-version` file
  ([build image](https://developers.cloudflare.com/workers/ci-cd/builds/build-image/), read 2026-09-30).

Then deploy. A build can wait in a queue for several minutes when your
account has other builds waiting. If you push again while one waits, the
older build is listed as **Skipped** ("This build was skipped") and the
newest one runs. That is normal.

Other hosts are in [section 9](#9-deploying).

If the first build ran before `SITE` was set, push any new commit to build
again. Without `SITE` every page ships `noindex` ([section 7](#site-url)).

**You should see:** the build finishes and the site opens at its live address.
In the page source of the home page, the `canonical` link starts with your
address and there is no `noindex` line.

<a id="launch-5"></a>

### Step 5. Deploy the login service

**You do this (needs your account).** The editor signs people in with GitHub
through a small login service,
[sveltia-cms-auth](https://github.com/sveltia/sveltia-cms-auth), which runs
on Cloudflare Workers. One login service can serve
every site you build. If you already have one, skip to step 7 and add this
site's address to `ALLOWED_DOMAINS`.

1. Open the "Deploy to Cloudflare" link:
   https://deploy.workers.cloudflare.com/?url=https://github.com/sveltia/sveltia-cms-auth
2. On the set-up screen: choose your Git account, choose to create a private
   Git repository, keep the name `sveltia-cms-auth`, leave the build command
   empty, and keep the deploy command the dashboard fills in (we saw
   `pnpm run deploy` there on 2026-09-30; the dashboard's wording and defaults
   can change). Then deploy.
3. If it says your GitHub authorization has expired, reconnect GitHub from the
   Git account list and try again.
4. The build can sit in **Initializing** for several minutes when your account
   has other builds waiting. It is not stuck.

**You should see:** the deployment finishes. The login service's address is
`https://sveltia-cms-auth.<your-account-subdomain>.workers.dev`. Your
subdomain is shown in Cloudflare, Workers & Pages. Write the full address
down. The steps below call it `<worker-url>`.

<a id="launch-6"></a>

### Step 6. Create the GitHub OAuth app

**You do this (needs your account).** On GitHub: Settings, Developer settings,
OAuth Apps, **New OAuth App**
([GitHub's steps](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app), read 2026-09-30).

- **Application name**: a name your client will recognize, for example
  "Your Café website editor". GitHub shows it on the sign-in screen.
- **Homepage URL**: your live address.
- **Redirect URI**: `<worker-url>/callback`. (GitHub's documentation calls
  this field "Authorization callback URL".)
- **Enable Device Flow**: leave it off.
- **Expire user access tokens**: on by default. The login service does not
  renew tokens, so with it on, editors are asked to sign in again after some
  hours. You can leave it on.

Press **Register application**. Copy the **Client ID**. Press
**Generate a new client secret** and copy the secret now: GitHub shows it only
once.

**You should see:** the app's page with a Client ID and one client secret.

<a id="launch-7"></a>

### Step 7. Give the login service its keys

**You do this (needs your account).** In Cloudflare, open Workers & Pages,
then the `sveltia-cms-auth` Worker, then **Settings**, then
**Variables & Secrets** (that is the name Cloudflare's build settings page
gives it, read 2026-10-03; the dashboard may word it as runtime variables).
Add one variable per row below.

This is not the build variables box under **Settings**, **Build**. That box is
for the build only, and the running login service cannot read it
([Cloudflare's build settings](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/), read 2026-10-03).

| Name | Type | Value |
|------|------|-------|
| `GITHUB_CLIENT_ID` | Text | the Client ID from step 6 |
| `GITHUB_CLIENT_SECRET` | tick **Secret** | the client secret from step 6 |
| `ALLOWED_DOMAINS` | Text | your live hostname, without `https://`, for example `your-domain.com`. Several are separated by commas: `your-domain.com,www.your-domain.com`. Add `127.0.0.1,localhost` only if you want to sign in from your own computer. |

Save them, and deploy if the dashboard asks you to.

**You should see:** the three names listed under **Variables & Secrets**.

<a id="launch-8"></a>

### Step 8. Turn the editor on and push

In the project folder, with `owner/name` from step 3 and `<worker-url>` from
step 5:

```bash
npm run cms -- enable sveltia --repo owner/name --auth-url <worker-url>
npm run cms -- check
npm run build
```

Add `--branch <name>` if your branch is not `main`. The command writes
`public/admin/` and adds a marked block to `public/_headers`
([details](#sveltia-cms-setup-on-your-own-address)). If you leave `--auth-url` out, the command still
succeeds, but the editor has no login service and sign-in cannot work. Run it
again with the address from step 5.

Then save and push (the push needs your GitHub sign-in):

```bash
git add .
git commit -m "Turn on the content editor"
git push
```

**You should see:** `check` prints "Editor config up to date", the build
passes, and your host rebuilds after the push. Then
`https://your-domain.com/admin` shows a **Sign In with GitHub** button.

<a id="launch-9"></a>

### Step 9. Sign in at `/admin` and change one menu item

**You do this (needs your account).** Open `https://your-domain.com/admin` and
choose **Sign In with GitHub**. GitHub shows **Authorize** and your app's
name. It asks for access to repositories (public and private) and to personal
user data. Under **Organization access** there are **Grant** buttons: do not
press them, unless the site's repository belongs to that organization.
Authorize the app. If you authorized this app before, GitHub does not ask
again and the editor opens straight away.

**You should see:** the editor with **Menu**, **Locations** and **Questions**.
Open **Menu**, then **Almond Croissant** (or any item you kept), change its price,
and save. The save appears in your repository as a commit named
`Update Menu “almond-croissant”` (the item's file name), and your host starts
a new build. After a few minutes, reload the live `/menu/` page: the new price
is there.

If it says **You don't have access to the “owner/name” repository**, the
repository was renamed or deleted, or your GitHub account cannot write to it.
Check the name and run step 8 again with the right `--repo`.

If the price has not changed after ten minutes, open your host's build log.
A build that stops keeps the old site live ([A bad save](#a-bad-save),
section 8).

<a id="launch-10"></a>

### Step 10. Give your client a login

**You do this (needs your account).** Your client creates a free GitHub
account and sends you the username. You add it to the repository as a
collaborator with write access (Settings, Collaborators, Add people; the full
steps are in [Sveltia CMS setup](#sveltia-cms-setup-on-your-own-address),
step 6). GitHub emails your client an invitation.

Tell your client what the editor covers and what it does not (the two lists
in [section 8](#8-let-your-client-edit-the-menu)), and who to message if a
change does not appear after ten minutes.

**You should see:** your client listed as a collaborator once they accept,
and able to sign in at `/admin` and see the menu.

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
  --ts-surface:           #f9f6f0;  /* page background */
  --ts-surface-alt:       #f1ece3;  /* alternating sections, cards */
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
spare (16.3:1 for body text, 5.0:1 for the accent, both on the page background).

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

Fonts are self-hosted: the font files are served from your own site, and no
request goes to Google Fonts or any other font server.

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

Interface strings switch; content files do not translate themselves. The
menu, the locations, the questions and the legal pages in `src/content/` stay
in the language you wrote them in. Translate those too.

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
name: "SE Wrenhollow"
streetAddress: "2240 SE Wrenhollow St"
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

Once the editor is on, the café can change all of this in the form
([section 8](#8-let-your-client-edit-the-menu)). Day names must be the English
ones above, spelled out in full: the form offers exactly those.

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
Google shows the FAQ rich result only for well-known government and health
websites (Google's FAQPage documentation, read 2026-10-03), so do not expect
one for a café. The data is kept for assistants and other engines that read
it.

### Legal pages (`src/content/legal/`)

`privacy.md` and `terms.md` render at `/legal/privacy/` and `/legal/terms/`.
Adding `cookies.md` creates `/legal/cookies/` automatically and it appears
nowhere in the navigation until you link it.

> **The supplied legal text is a short, neutral starting text, not legal
> advice.** Read [`docs/legal-templates.md`](legal-templates.md) before you
> publish: it holds the fuller structure of both pages and says which setting
> each shipped sentence depends on.

---

## 5. What this theme deliberately does not do

**No reservation system.** Cafés take walk-ins. Restaurant booking logic on a
café site adds a step a walk-in visitor does not need and makes the "just come
in" promise ambiguous. The site
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
| Cloudflare | A form service: Formspree, Basin, Web3Forms |
| Your own backend | Any URL that accepts a POST |

Example with Formspree:

```ts
export const contactFormAction = "https://formspree.io/f/your-form-id";
```

**Then add the service's origin to the Content-Security-Policy.** The policy
ships with `form-action 'self'`, which means the browser blocks a submission to
any other origin — **silently**. The page stays put, no error is shown, and the
message goes nowhere. Edit the `form-action` directive in `public/_headers`:

```
form-action 'self' https://formspree.io
```

The form already includes a hidden honeypot field named `company`. It only
catches anything if the service that receives the form treats that field as a
trap: Formspree, for example, ignores a submission whose `_gotcha` field is
filled in (its help page on honeypot filtering, undated, read 2026-10-03) and
does nothing special with `company`. Read your service's documentation and
rename the field to what it expects; that removes the bulk of bot spam without
a CAPTCHA.

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

On Cloudflare, set the same thing as a build environment variable, under
Settings → Build → Variables. The build reads it; you do not have to edit
`astro.config.mjs`.

Leave it unset and two things happen, both on purpose:

- the build prints a warning naming the file and the variable;
- every page ships `<meta name="robots" content="noindex">`.

The second one looks drastic and is the safer failure. A site indexed under
`example.com` hands its pages to a domain that is not yours, and undoing that
takes weeks. `noindex` shows up in Search Console as "excluded by noindex" and
one environment variable reverses it.

### AI crawlers

The generated `robots.txt` allows every crawler (`User-agent: *`, `Allow: /`),
and that includes the crawlers run by AI companies: OpenAI's `GPTBot`
("may be used in training", OpenAI's bot page, undated, read 2026-10-03),
Anthropic's `ClaudeBot` ("could potentially contribute to their training",
Anthropic's crawler article, updated 2026-04-07) and Google's
`Google-Extended` token, which controls training and grounding for Gemini and
"does not impact a site's inclusion in Google Search" (Google's crawler
documentation, updated 2026-07-14). This is a choice, and it is yours. With
the default, the site can be read and quoted by assistants, and `/llms.txt` is
written for the same readers. To refuse a crawler, write the rule into
`src/pages/robots.txt.ts`: that file hands the shared `robotsTxt()` output
back as the response, so append your lines to that string, for example:

```
User-agent: GPTBot
Disallow: /
```

Each company documents its crawler names and what each one does; read the
current lists before you choose, because the names and purposes change.

---

## 8. Let your client edit the menu

The café can change menu items, prices, tags, availability, shops with their
opening hours, and the FAQ in a web form instead of in files. The form reads and writes the same files as
this guide describes. Nothing about the site changes: there is still no
database, and every save is a change to a file in your repository.

**The editor is Sveltia CMS.** Your client signs in with a free GitHub account
at `your-site/admin`. You, the person setting it up, also need a GitHub
account. The editor ships turned off: `npm run cms -- status` says
`sveltia: off` until you run the enable command in
[Launch guide, step 8](#launch-8).

What you set up, once (the [Launch guide](#launch-guide-do-these-in-order)
has the steps, in order):

- A GitHub repository connected to your host.
- A small login service (deployed once, it can serve every site you build) and
  a GitHub OAuth app.
- The editor and its `/admin` security headers (`npm run cms -- enable sveltia`).
- Your client's GitHub account, added to the repository as a collaborator.

**Before you start.** The editor saves by committing to a Git repository, and
your host rebuilds the site from it. So the site must live in a Git repository
that is connected to the host. If you have the zip, put it in your own
repository first (next box), then continue. Run `npm install` in the project
once before using `npm run cms`.

<a id="zip-to-repo"></a>

**From the zip to your own GitHub repository.** First create an empty
repository on GitHub (no README, no license, no `.gitignore`) and copy its URL.
Then run this in the project folder:

```bash
git init
git add .
git commit -m "Larkin kit"
git branch -M main
git remote add origin <your repo URL>
git push -u origin main
```

Replace `<your repo URL>` with the address you copied, for example
`https://github.com/your-name/your-repo.git`. If git asks who you are, run
`git config --global user.name "Your Name"` and
`git config --global user.email you@example.com` once, then commit again. The zip includes a `.gitignore`
that keeps `node_modules` and `dist` out of the commit.

Three things you may see. On Windows, git may print "LF will be replaced by
CRLF". That is a line-ending notice, not an error. The first `git push` may
open a browser window so you can sign in to GitHub. And create the repository
as **Private**: it holds your client's content.

**Who does what.** You (the agency or developer) set the editor up, once. The
café owner accepts an invitation and opens the editor.

**What the owner can edit:**

- **Menu items**: name, short description, price, menu section, tags,
  seasonal badge, position in the section, shown on the menu or hidden, shown
  on the home page. They can also add an item or delete one.
- **Locations** (one per shop): name, address, country code, directions
  link, opening hours, the Wi-Fi, power and laptop facts, which shop is the
  main one, position, and private notes. They can also add a shop or delete
  one.
- **Questions** (the FAQ): question, answer, position.

The form is in English; to change its labels edit `cms/fields.json`, then run
`npm run cms -- generate`. The menu sections and tags in the form come from
`src/i18n/en.json` (`menu.categories`, `menu.tags`), so the form uses the same
names as the site.

What to tell the owner about locations:

- **Opening hours** are rows: pick the days that share the same hours, then
  type the opening and closing time as 24-hour time with a colon, for example
  `07:00` and `18:00`. A day that is in no row has no hours on the site.
  Removing every row leaves the shop without opening hours. The day names in
  the form are the English ones the site reads; the site still prints the
  days in its own language.
- **Directions link** is required: it is where the "Get directions" button
  goes. It must be a full web address starting with `https://`, or the
  build stops.
- **Main shop**: switch it on for one shop only. The home page card and the
  details search engines read come from it.
- **Shop phone** and **Notes** are kept in the shop's file, but the site does
  not show them: the phone number on the site is the one in
  `src/lib/site.ts`.
- **Keep at least one shop.** The address and opening hours on the site come
  from the shops.

**What the owner cannot edit, on purpose:**

- **Wording and business details** (`src/i18n/en.json`, `src/lib/site.ts`).
- **Privacy and terms** (`src/content/legal/`). These are legal text.
- **Currency.** It is not in the form. Every item uses the default in
  `src/content.config.ts` (`USD`) unless its file says otherwise. If the café
  prices in another currency, change that default before you hand the site
  over.
- **Photographs.** The editor has no image field in this kit; photographs
  stay in `src/assets/images/` ([section 2](#step-5-images)).

<a id="a-bad-save"></a>

**A bad save.** The editor does not run the build, and it does not tell the
owner if the build fails. A save that breaks the build (a value the schema
rejects) is committed anyway, and the build stops. A host normally keeps
serving the previous version when a build fails, so the live site keeps what
it had before, but check that in your host's own documentation. The owner
will see no error, and the change will not appear. Tell them to message you
if nothing changes after ten minutes. Turn on your host's notification for
failed builds and send it to yourself, so you hear about it before the café
does. Cloudflare's notification list has a "Project updates" alert for Pages
projects only ([Cloudflare's notification list](https://developers.cloudflare.com/notifications/notification-available/),
read 2026-10-03). If you deployed with the Launch guide (Workers), we found
no failed-build notification in that list. When a change does not appear,
open the Worker in the Cloudflare dashboard, then **Settings**, **Builds**,
and read the failed build's log.

### Sveltia CMS setup (on your own address)

Sveltia CMS runs inside your site at `/admin`. It signs editors in through
GitHub, so each editor needs a GitHub account with access to the repository.
It is off until you run the enable command, because it needs the repository
name and your login service address. GitHub sign-in goes through a small
login service that you deploy once; the same service can serve every site
you build.

The [Launch guide](#launch-guide-do-these-in-order) at the top of this file
walks through these steps in a safe order, with the screen names as Cloudflare's and GitHub's own
documentation give them (steps 5 to 10). The list below is the short reference.

1. Deploy [sveltia-cms-auth](https://github.com/sveltia/sveltia-cms-auth) to
   Cloudflare Workers, following its README (read 2026-09-29). Note the Worker
   URL.
2. In GitHub, go to Settings, Developer settings, OAuth apps, New OAuth App
   ([GitHub's steps](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app)).
   Its authorization callback URL is `<YOUR_WORKER_URL>/callback` (per the
   sveltia-cms-auth README). Copy the Client ID and Client Secret.
3. In the Worker's settings, under **Settings**, **Variables & Secrets** (not
   the build variables under **Build**), add `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` (tick
   **Secret** for the secret). The README also describes an optional
   `ALLOWED_DOMAINS` variable for your site's hostname, which it recommends.
4. In the project, turn the editor on:

   ```bash
   npm run cms -- enable sveltia --repo owner/name --auth-url https://your-worker-url
   ```

   Add `--branch <name>` if your branch is not `main`. This writes
   `public/admin/config.yml` and `public/admin/index.html`, and adds a marked
   block to `public/_headers` (see below).
5. Build and deploy. The editor is at `/admin`.
6. Give the owner access. The owner creates a free GitHub account. You add
   that account to the site's repository as a collaborator. For a repository
   in a personal account, GitHub's steps are: open the repository, Settings,
   then Collaborators in the Access section, Add people, pick the person, and
   confirm ([GitHub docs](https://docs.github.com/en/account-and-profile/how-tos/setting-up-and-managing-your-personal-account-on-github/managing-access-to-your-personal-repositories/inviting-collaborators-to-a-personal-repository),
   read 2026-09-29). GitHub emails the owner an invitation, and access starts
   once they accept. The editor saves by committing, so the owner needs
   permission to write to the repository. For a repository owned by an
   organization, pick a role that can write; see GitHub's repository roles
   page.
7. The owner opens `https://your-site/admin` and signs in with GitHub.

**Test it on the live site.** `npm run dev` does not serve the editor at
`/admin` in this kit (only at `/admin/index.html`), and sign-in needs the
login service and a GitHub account with access to the repository either way.

**The site's security policy blocks the editor unless `/admin` gets its own.**
The site-wide Content-Security-Policy allows nothing the editor needs (it loads
from unpkg and talks to api.github.com). `enable sveltia` therefore adds a
block between `# BEGIN content editor` and `# END content editor` to
`public/_headers`, for `/admin` only. It uses Cloudflare's `!` line to
replace the policy on that path; Cloudflare documents that a request matching
several rules gets all their headers and that a line made of an exclamation mark and a header name removes an earlier
one (read 2026-09-29). The rest of the site keeps its policy, and
`X-Frame-Options` is unchanged.

`npm run cms -- disable sveltia` removes the marked blocks and the `/admin`
files.

### Commands

```bash
npm run cms -- status              # whether Sveltia is on, and what "on" means
npm run cms -- enable sveltia --repo owner/name --auth-url URL
npm run cms -- disable sveltia     # remove public/admin/ and the /admin header blocks
npm run cms -- generate            # rewrite the editor config after a schema change
npm run cms -- check               # exit 1 if a config is out of date
```

The editor config is generated from `src/content.config.ts` and
`cms/fields.json` (labels and hints). If you change a collection's fields, run
`npm run cms -- generate`; do not edit `public/admin/config.yml` by hand.
`generate`, `check` and `enable` run Astro's own sync themselves first, so a
new category or field is always picked up; if that sync fails they stop with
exit 2.

---

## 9. Deploying

Cloudflare is the supported host. The build output is a plain static
`dist/` folder.

**The `workers.dev` address.** A Worker whose `wrangler.jsonc` has no
`routes` is also served at `<name>.<your-subdomain>.workers.dev`: Wrangler's
configuration reference says `workers_dev` defaults to `true` when there is
no `route` or `routes` (read 2026-10-03). So the site answers there as well
as on your domain; canonical links still point at `SITE`. Once your own
domain is connected and working, you can switch that address off by adding
`"workers_dev": false` to `wrangler.jsonc` and deploying again. Do not do it
before the domain works: with no domain and no `workers.dev` address, there
is nothing left to open the site at.

**If the owner will use the content editor, connect Cloudflare to your Git
repository** (below). A host where you only upload `dist/` by hand cannot
rebuild the site when the owner saves.

### Cloudflare Pages / Workers

Framework preset **Astro**, build command `npm run build`, output `dist`.
Node version comes from the included `.node-version`. A `wrangler.jsonc` is
included; change `name` to your project. For a Worker built from your GitHub
repository, the screens are in [Launch guide, step 4](#launch-4).

### Any other host

The site is plain static files, so it also runs on other static hosts. The
security headers (`public/_headers`), the content editor setup and the steps
in this guide are written for Cloudflare: on another host you set up the
headers yourself.

```bash
npm run build
# upload the contents of dist/ to your host
```

### Before you go live: security checklist

- `public/_headers` (Cloudflare) ships with a strict
  Content-Security-Policy, HSTS, `X-Content-Type-Options` and a restrictive
  `Permissions-Policy`. **If you add a third-party embed (a map, an Instagram
  feed, analytics), you must widen the CSP for that origin** or the browser
  will block it.
- Any `<iframe>` you paste in should keep `sandbox` and `referrerpolicy`.
- Set `SITE` to your real domain ([section 7](#site-url)).
- Adapt the legal pages (`docs/legal-templates.md`).

---

## 10. Updating

Each new version is a new zip at the same download link you used the first
time. The files you changed to make the site yours stay yours; the rest of
the kit is ours, and an update replaces it.

Your files (an update never overwrites these):

- `src/content/`: every content file (section 4)
- `src/i18n/*.json`: your wording, in every language file
- `src/lib/site.ts`: your site details and switches
- `src/styles/global.css`: the `:root` block is yours; if a release changes this
  file, carry your `:root` values into the new copy
- `cms/fields.json`: the content editor's labels and hints
- `src/assets/images/`: your photographs
- `public/og.jpg`: your social sharing image
- `public/favicon.svg`: your browser tab icon
- `public/_headers`: your security headers, including any host you allowed

`package.json` is a special case. Every release lists it under "Your files",
because you may have added packages or scripts of your own: merge it by hand,
keeping what you added and taking our `version`, `scripts` and dependency
versions. Everything else is our files: components, layouts, pages, scripts
and configuration.

1. Read `CHANGELOG.md` in the new zip. Each release lists "Your files" (the
   files above that changed in that release) and "Our files" (everything
   else that changed).
2. Download the new zip from the same link and extract it to a fresh folder.
   Do not extract it over your site.
3. Copy our files from the new folder over your site, and keep your files.
   Merge one of your files by hand only if the release lists it under "Your
   files": open your copy and the new one side by side and carry the change
   across. A file the release lists as "(removed)" is one you delete from
   your site.
4. Run `npm install`, then `npm run cms -- generate` so the content editor
   matches the new files (it says so and does nothing if the editor is off),
   `npm run cms -- check` to confirm, and `npm run build`. A build that passes
   is the sign the update is done.

If you work from a clone of the public repository, you can pull instead of
downloading the files again. The same two lists tell you where to expect a
conflict: in a file the release lists under "Your files".

---

## 11. File reference

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
  _headers               security headers + cache rules (Cloudflare)
  open-status.js         puts today's hours on the badge, in the visitor's clock
  menu-close.js          closes the mobile menu on Escape
.env.example             copy to .env and set SITE before your first deploy
```

---

## 12. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `Cannot find module 'astro'` | dependencies not installed | `npm install` |
| `npm install` ends with "high severity vulnerabilities" (2 on 2026-10-03) | A package Astro's build depends on (`http-cache-semantics`, advisory GHSA-ch52-4w7c-c8xp). No fixed release exists yet. As far as we can see in Astro's code it is used only while the site builds, to cache remote images; the published site is static files | Do **not** run `npm audit fix --force`: it replaces Astro 7 with an old Astro 2 release and the build stops. Leave the warning; it goes away with a kit update once Astro ships a fix |
| Port 4321 already in use | another dev server is running | Astro auto-picks the next port; or `npm run dev -- --port 4322` |
| Fonts look wrong / fall back | font package not installed | `npm install` again; check the `@import` lines at the top of `global.css` |
| A menu item does not appear | `available: false`, or an invalid `category` | check the frontmatter against the enum in `src/content.config.ts` |
| Gallery section is missing | no images in `src/assets/images/` | add the files, or leave it: the section hides itself by design |
| "Open now" never appears | JavaScript disabled, or no `hours` on the primary location | the plain hours line is the intended fallback; add `hours` to the location file |
| Map embed does not load | Content-Security-Policy blocks the origin | replace `'none'` in `frame-src` in `public/_headers` with the embed origin |
| Form submits but nothing happens, and there is no error | Content-Security-Policy `form-action` does not list the form service | add its origin to `form-action` in `public/_headers` |
| Build fails after renaming the project folder | the link npm made to `./core` still points at the old path | `npm install` (the build itself no longer needs it; `npm run check` does) |
| `npm run check` reports a type error | a TypeScript error in your edits | the file and line are in the output; `npm run build` does not run this check, so a type error never blocks a build |
| `npm ls` says "extraneous" for `@emnapi/*`, `tslib` or `@img/sharp-wasm32` | a known friction between npm and the image library's optional WASM packages | nothing to fix — the install is not broken, and `npm ci` reports the same |
| A build error on Windows ends with `Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)` | a Node crash artifact printed after the real error | read the error ABOVE that line; that one is the actionable message. The build still exits non-zero, so automated deploys still fail correctly |
| Pages say `noindex` and canonical URLs read `example.com` | `SITE` is not set | see section 7, "Site URL" — set it in `.env` or in your host's build variables |

---

## 13. Support

Larkin is free and comes without a support obligation (see `LICENSE.md`).
You can still write to support@alderthemes.com. Please send: what you were doing,
what you expected, what happened, and your Node version (`node -v`).

Seasonal menus go stale. If you hand this site to a client, agree who updates
the seasonal items and when — the whole point of the content collection is that
it takes two minutes and no developer.

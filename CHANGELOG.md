# Changelog — Larkin

## 1.0.2 — 2026-10-03

- Fixed: `package.json` no longer carries a `repository` link to our private
  source repository, which returned "not found" for buyers.
- Fixed: where the contact form and the booking form share a page, each form's
  hidden spam-trap field now has its own id.
- Fixed: `npm run cms -- disable` removes `public/admin/` when the folder is
  left empty; a file of yours in that folder is kept.
- Fixed: in Larkin, the footer navigation's screen-reader label comes from
  the language file, so it reads in Turkish when the site is in Turkish.
- Fixed: in Larkin, the note above `mapEmbedUrl` in `src/lib/site.ts` now says
  the shipped policy blocks every embed (`frame-src 'none'`) and that you
  replace `'none'` with your map provider's host; it used to say any https
  map works without editing `public/_headers`.
- Fixed: where the guides tell you to allow a booking widget or map in
  `frame-src`, they now say to replace `'none'` with the provider's host.
- Changed: the Launch guide names Cloudflare's screens the way Cloudflare's
  own documentation does (**Create application**, **Import a repository**,
  **Settings**, **Variables & Secrets**) and says where the dashboard's
  wording may differ, instead of quoting labels we saw once.
- Changed: the failed-build note says Cloudflare's "Project updates" alert
  exists for Pages projects only; for a Worker, read the build log under the
  Worker's **Settings**, **Builds**.
- New: a troubleshooting entry for the "high severity vulnerabilities" line
  that `npm install` prints, and why `npm audit fix --force` must not be run
  on the kit.
- New: in Updating, `package.json` is always merged by hand, and a file the
  release lists as "(removed)" is one you delete from your site.
- New: `npm run cms -- enable sveltia` without `--auth-url` succeeds but
  leaves the editor without a login service; the guide now says so.
- New: Deploying explains the `workers.dev` address a Worker also answers on,
  and how to switch it off once your own domain works.
- New: an "AI crawlers" section in the SEO chapter: what the default
  `robots.txt` allows, and how to refuse a crawler.
- Changed: the language chapter says content files do not translate
  themselves when `LOCALE` changes.
- Changed: kits with a questions collection say Google shows the FAQ rich
  result only for government and health websites.
- Changed: the demo business now has an invented street address. The town,
  region and postal-code area are real; the street does not exist anywhere,
  so the sample cannot be mistaken for a real building or business. Your own
  address goes in `src/lib/site.ts` under `business` (Larkin: the location
  file in its content collection, see the README), and every page, the
  structured data and `/llms.txt` read it from there.
- Changed: the dictionaries (`src/i18n/*.json`) no longer carry a street or
  village name. Sentences such as the parking answer, the "finding us" text and
  the photo descriptions now describe the place without naming the street.
- Changed (Larkin): the demo location has no `mapUrl`, so no "Get directions"
  link renders until you add your own. The README's second-location example
  uses an invented street as well.
- Fixed: `IMAGE-LICENSE.md` says that Article 50 of the AI Act applies from 2 August 2026 rather than that the Act entered into force then; names each model as the platform's job records name it (several portraits and later frames were made on `nano_banana_flash`, not Nano Banana 2; one generation date corrected); and no longer mentions the plan the images were generated under.
- Fixed: the sample privacy page says the "no analytics, no cookies" sentence covers the site's own code. `docs/legal-templates.md` gained two rows: the host's own cookie, and what to add when the editor is on (`/admin` loads Sveltia CMS from unpkg.com and signs editors in through GitHub).
- Fixed (corsham, halwell, larkin, wardlow, wickmere): the sample terms page says the site's text and images are used with permission instead of claiming to own them; the demo images are AI-generated and `IMAGE-LICENSE.md` grants use, not ownership. `docs/legal-templates.md` gained a row for that sentence.
- Fixed: the Support section said email support is included. Larkin is free
  and comes without a support obligation, as `LICENSE.md` says; you can still
  write to support@alderthemes.com.
- Fixed: the Updating section spoke of asking for access to a delivery
  repository. Larkin's repository is public; if you work from a clone, you can
  pull.
- Changed: a correction to the 0.3.0 entry. Two items there described terms of
  the paid Personal License (liability limited to the amount you paid, and an
  "If something is wrong with the Template" section about refunds). Larkin's
  `LICENSE.md` is the Free License and has neither; read it for Larkin's terms.
- Fixed: the color example in section 2 lists the shipped background colors
  (`#f9f6f0`, `#f1ece3`) and their measured contrast (16.3:1 for body text,
  5.0:1 for the accent); `public/favicon.svg` uses the same background color.
- Changed: `public/_headers` sets `frame-src 'none'` instead of `frame-src https:`. No page in the kit embeds a frame by default, so nothing changes until you add one. When you paste an embed or switch the booking section to widget mode, add that host to `frame-src` — the exact host, as the comments in the file say.
- Migration: if you had already added an embed and relied on `frame-src https:`, name its host in `public/_headers` before deploying.
- Fixed: the main navigation's screen-reader label (`aria-label`) was the English word "Main" in every language. It is now the dictionary key `a11y.mainNav` in `src/i18n/en.json` and `tr.json`.
- Fixed (core `sections/Contact.astro`): on a 320px-wide screen the contact section's grid column grew to the form's intrinsic width and the page scrolled sideways by 15px. The columns now use `minmax(0, 1fr)` and the inputs fill their field.
- Fixed (core `sections/Contact.astro`): passing a `labels` object without `required` removed the "(required)" marker instead of keeping the default. Defaults are now merged key by key for `labels`, `errors` and `infoLabels`.
- Changed (`npm run cms -- enable sveltia`): running it without `--auth-url` still succeeds, and now prints a warning that signing in cannot work until the login service address is given. A `--repo` value that is not `owner/name` is reported as malformed, not as missing. The URL error names http:// as accepted for local testing only.
- Fixed: the README's first line no longer says "Zero JavaScript by default" for every kit. It is read from the kit: a kit with no `public/*.js` says no JavaScript is sent to the browser; a kit that ships scripts names them and says each page still works with JavaScript turned off.
- Fixed: the README's "Make it yours" list pointed the business name at `src/lib/site.ts`. The line is now read from `site.ts`: where the name is `t("site.name")` it points at `src/i18n/en.json` (and `tr.json`), and it lists only the business fields that file holds.
- Fixed: the `.gitignore` the kit ships now ignores `.wrangler/`, the folder `npx wrangler pages dev dist` leaves behind.
- Changed: README headings and labels use American spelling ("License", "Colors").
- Changed: a correction to an earlier note. The 2026-10-02 entry called the
  images' synthetic-content signal "built-in". `IMAGE-LICENSE.md` is the
  accurate text: the generation service may embed such a signal, and we do
  not promise it is present in every image.

Your files (merge by hand): `cms/fields.json`, `package.json` (merge: keep dependencies you added; take our version, scripts and dependency versions), `public/_headers`, `public/favicon.svg`, `src/content/legal/privacy.md`, `src/content/legal/terms.md`, `src/content/locations/nw-23rd.md` (removed), `src/content/locations/nw-thimbleberry.md`, `src/i18n/en.json`, `src/i18n/tr.json`, `src/lib/site.ts`

Our files (copy over): `AGENTS.md`, `IMAGE-LICENSE.md`, `core/cms/cli.mjs`, `core/cms/emit.mjs`, `core/sections/Contact.astro`, `docs/README.md`, `docs/legal-templates.md`, `src/components/SiteFooter.astro`, `src/components/SiteHeader.astro`

Run `npm run cms -- generate`, then `npm run cms -- check`.

## 1.0.1 — 2026-10-02

- Changed: the AI disclosure notice in `IMAGE-LICENSE.md` describes the
  images' built-in synthetic-content signal more carefully. See that file.

Your files (merge by hand): `package.json` (merge: keep dependencies you added; take our version, scripts and dependency versions)

Our files (copy over): `IMAGE-LICENSE.md`

## 1.0.0 — 2026-10-02

- The minimum Astro version is now 7.3.5 (was 7.3.4), a patch release. Run
  `npm install` after updating; nothing in the template's own code changes.
- Changed: Cloudflare is the one supported host. `netlify.toml` is no longer
  in the kit, `docs/README.md` no longer has Netlify steps, and the comments
  in `public/_headers` no longer mention Netlify. `public/_headers` is one of
  your files, so an update does not replace your copy. The site is
  plain static files and also runs on other static hosts, but the security
  headers (`public/_headers`), the content editor setup and the guide's steps
  are written for Cloudflare.
- Migration: if you deploy to Netlify, your own `netlify.toml` stays where it
  is when you update. `npm run cms` no longer reads or changes it, so if you
  pasted the editor's `/admin` block into it, keep that block up to date
  yourself.
- Fixed: the setup notes no longer say Cloudflare handles form posts on its
  own. It does not. Put a form service endpoint (Formspree, Basin, or similar)
  in the form's address in `src/lib/site.ts`, then add that service's host to
  `form-action` in `public/_headers`. Until you set the address, the form
  goes nowhere.

Your files (merge by hand): `package.json` (merge: keep dependencies you added; take our version, scripts and dependency versions), `public/_headers`, `src/lib/site.ts`

Our files (copy over): `AGENTS.md`, `core/cms/cli.mjs`, `core/cms/headers.mjs`, `core/sections/Contact.astro`, `docs/README.md`, `docs/legal-templates.md`, `netlify.toml` (removed)

## 0.3.0 — 2026-10-01

- Changed: refined color, typography and spacing. Content, pages and
  navigation are unchanged.
- Changed: a warmer cream background and an espresso footer. The footer reads
  `--ts-c-footer-bg` and `--ts-c-footer-text`, so setting them in `global.css`
  changes it, and the home page's menu and workspace sections place the
  heading beside the content on wide screens.
- Changed: the Updating section starts from the zip download and lists the
  files that are yours to keep (`package.json` → `alderthemes.yourFiles`).
- New: the content editor tools (`core/cms/`) can describe more kinds of
  fields in `cms/fields.json`: photos, dates, lists of short texts, links to
  entries in another collection, grouped fields and lists of grouped fields,
  and data kept in one YAML file. A collection can also turn off creating or
  deleting entries in the editor. Your editor does not change: your theme's
  `cms/fields.json` does not use these kinds.
  A one-file data collection is refused while its YAML file has comments,
  because the editor removes comments when it saves; keep such notes in a
  separate file.
- Changed: the shared core includes the content editor tools (`core/cms/`).
  Nothing changes for you: a theme with a content editor runs them through
  `npm run cms` as before.
- New: the content editor tools (`npm run cms`) accept a number that may be
  empty, written in the content schema as `z.number().nullable()`, with or
  without a check on the number (for example `z.number().int().nullable()`).
  In the editor it is an optional number; emptied, it is saved as `null`. If
  your editor leaves empty fields out of the file, `npm run cms -- check`
  stops and asks you to add `.default(null)` to that number, or to mark the
  field required, so an emptied value still reads as empty.
- New: the content editor tools (`npm run cms`) can open one data file as one
  form, such as business details in a JSON file or chosen groups of the page
  text in `src/i18n/<language>.json`. You list the fields under `"records"` in
  `cms/fields.json`, and the tool checks each one against the file: a
  misspelled key or a wrong type stops it with the exact path. The page text
  record follows the site's language setting, and the editor says that the
  other language file is not edited.
- New: `npm run cms -- order` puts such a file in the key order the editor
  writes, without changing any value, so your first save in the editor changes
  one line instead of the whole file. `npm run cms -- check` reminds you when
  a file needs it.
- New: shops are in the content editor. The café can change a shop's address,
  directions link, opening hours, the Wi-Fi, power and laptop facts and which
  shop is the main one at `/admin`, and add or delete a shop. Opening hours
  are rows: pick the days, then type the opening and closing time. The day
  names come from `cms/weekdays.yaml` and match the names the site reads.
- New: a content editor (Sveltia CMS). The café can change menu items, prices,
  tags, availability and the FAQ in a web form at `/admin`. It ships turned
  off; `npm run cms -- enable sveltia` turns it on.
- New: a launch guide at the top of `docs/README.md`. Ten steps in order, from
  the zip to a live site your client edits at `/admin`, each with what you
  should see when it worked. Steps that need your own account are marked.
- New: the package README starts with "Launch in order", linking to each step.
- New: `AGENTS.md` has a "Launch task" with the same order. An AI tool stops
  at the steps that need your account and tells you what to click.
- New: `cms/fields.json` joins "Your files": it holds the editor's labels and
  hints.
- Fixed: on wide screens the home image runs edge to edge instead of stopping
  short of the right side, and the photo row lines up with the header instead
  of running to the window edge.
- Fixed: the content editor tools (`npm run cms`) accept a bare
  `z.number().nullable()`, with no check on the number. It gives the same
  optional number field as a checked one such as `z.number().int().nullable()`,
  and the same request to add `.default(null)` when your editor leaves empty
  fields out of the file.
- Changed: wording edits in `docs/README.md`. Nothing about how the kit
  works has changed.
- Changed: the privacy and terms pages in `src/content/legal/` ship as a
  short, neutral starting text. Visitors no longer see a template notice,
  setup instructions, blanks or file paths on them.
- New: `docs/legal-templates.md` holds the fuller structure of both pages,
  the setup notes that used to sit on the pages, and which setting each
  shipped sentence depends on. It opens with a single notice that it is not
  legal advice.
- Migration: if you have already rewritten `privacy.md` or `terms.md`, keep
  your version and check it against `docs/legal-templates.md`.
- Changed: `LICENSE.md` has two new sections. "Sample legal pages" says that
  the privacy and terms pages in the template are sample text for the demo
  business, not legal advice, and that adapting them for the place where the
  website operates is up to you. "Governing law" names Turkish law, keeps the
  mandatory consumer law of your own country, and names the courts. Read
  `LICENSE.md` for the full terms.
- Changed: in `LICENSE.md`, "Warranty" is now "Warranty and liability". If you
  took the license as a consumer, nothing in it limits the rights your own
  country's mandatory law gives you, and the liability limit does not apply to
  you. If you took it for your trade, business or profession, liability is
  limited to the amount you paid, except for harm caused intentionally or by
  gross negligence.
- New: "If something is wrong with the Template" says where to write if the
  template does not install, build or match its product page and demo, and
  where a cancellation or partial refund request goes.
- Changed: "Governing law" no longer names a court for business buyers. Read
  `LICENSE.md` for the full terms.

Your files (merge by hand): `cms/fields.json`, `package.json` (merge: keep dependencies you added; take our version, scripts and dependency versions), `src/content/legal/privacy.md`, `src/content/legal/terms.md`, `src/styles/global.css`

Our files (copy over): `AGENTS.md`, `CLAUDE.md`, `LICENSE.md`, `cms/weekdays.yaml`, `core/cms/cli.mjs`, `core/cms/emit.mjs`, `core/cms/headers.mjs`, `core/cms/model.mjs`, `core/cms/record.mjs`, `core/cms/yaml.mjs`, `core/package.json`, `docs/README.md`, `docs/legal-templates.md`, `scripts/cms.mjs`, `src/components/FaqList.astro`, `src/components/GalleryStrip.astro`, `src/components/LocationCard.astro`, `src/components/MenuList.astro`, `src/components/SiteFooter.astro`, `src/components/SiteHeader.astro`, `src/components/WorkspaceInfo.astro`, `src/content.config.ts`, `src/pages/about.astro`, `src/pages/contact.astro`, `src/pages/index.astro`, `src/pages/legal/[id].astro`

Run `npm run cms -- generate`, then `npm run cms -- check`.

## 0.2.1 — 2026-09-26

- Pages: home, menu, about, contact, privacy, terms and a 404 page.
- The menu in `src/content/menu/` has four categories (espresso, brew, food, seasonal), and each item carries its price and diet tags. A seasonal item carries a badge.
- Each shop is a file in `src/content/locations/`: address, weekly hours, Wi-Fi, outlets, laptop policy. Add a second file and the contact page lists both shops.
- Structured data: CafeOrCoffeeShop, Menu and FAQPage JSON-LD, and a `/llms.txt` file that carries the whole menu and every FAQ answer.
- English and Turkish ship. Every interface string lives in one JSON file per language.
- The source is public at `github.com/alderthemes/larkin`. If your clone points anywhere else, `git remote set-url origin https://github.com/alderthemes/larkin.git` updates it.

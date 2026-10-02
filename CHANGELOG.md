# Changelog — Larkin

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

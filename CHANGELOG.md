# Changelog — Larkin

## 0.2.0 — 2026-09-09

- **Set `SITE` before you deploy, or the site ships `noindex`.** The theme has always defaulted to `example.com` so a forgotten domain is obvious. It was not obvious enough: 37 addresses went into the build, one of them the canonical tag. Now the build prints a warning naming the file and the variable, every page carries `noindex` while the placeholder is still there, and `.env.example` documents the one line you need. Being indexed under the wrong domain is harder to notice, and much harder to undo, than not being indexed.
- **`.env` works now.** A `SITE=` line in `.env` was read by nothing: Astro's config file runs before `.env` is loaded, so the value was silently ignored. Set it in `.env` or in your host's build variables — either reaches the build.
- **The contact page has a real map slot.** Paste your provider's embed URL into `mapEmbedUrl` in `src/lib/site.ts` and the section appears; leave it empty and it does not render, so the page never shows an empty box.
- **`/llms.txt` now carries the whole menu and every question.** It used to name the menu in one sentence. An assistant asked "do they have oat milk?" can answer from the file now: 18 items with prices, descriptions and seasonal marks, and all five FAQ answers.
- **The contact form says what is wrong.** Required fields are marked, each field carries its own message, and the message is tied to the field for screen readers. Before this the only feedback was the browser's own bubble, written in the browser's language rather than the page's.
- **Half the font is gone and the page no longer jumps.** The width-axis font file was 57 KB for a single effect; the weight axis is 30 KB and wider letter-spacing carries the same voice. The Latin subset is preloaded, and the hero heading's width no longer depends on the font — measured, the 64px reflow on first paint is now zero.
- **Photographs are cut to the shape they are shown in.** The gallery displayed 3:4 frames from files cut to width only, so every frame was scaled up 2x. The build cuts the crop now. The build also stopped emitting large renditions that no browser with `srcset` ever downloaded: `dist` fell from 1.79 MB to 1.13 MB with no visible change.
- Accessibility: the photo strip is a named region rather than an unlabelled tab stop, the menu button's name follows its state, `Escape` closes the mobile menu, fragment links move focus and not only the tab order, and the smallest targets grew to 44px.
- Structured data: one business identity across all three pages, an image and a founding date on it, seasonal items marked as seasonal, `lastmod` on the legal pages in the sitemap, Open Graph image dimensions, and no `FAQPage` when there are no questions.
- Prices follow the interface language: a Turkish site shows `₺1.250,75` rather than `TRY 1,250.75`.
- Documentation: the "add a language" recipe was two steps short and produced a green build that published English under `<html lang="de">`. It is complete, and it was tested by following it.

## 0.1.1 — 2026-09-08

- **The declared Node floor was wrong, and it could break your install.** The package shipped a `.node-version` of `22`, but Astro 7.3 needs at least `22.12`. On Node 22.0 to 22.11 the install could fail with nothing in the theme explaining why. The file now says `22.12.0`, and the README says the same.
- Astro moved to `^7.3.1`. The demo was rebuilt on it and re-measured: Performance, Accessibility, Best Practices and SEO all stay at 95 or above on mobile and desktop.

## 2026-09-03

- **Renamed from `cafe-01` to Larkin.** A lark is the first bird of the morning — a café is a morning business, and the template is built around what someone standing on the street at 8am actually needs to know.
- **Repository moved** to `github.com/alderthemes/larkin`. GitHub redirects the old address, but if you cloned it earlier, update your remote: `git remote set-url origin https://github.com/alderthemes/larkin.git`
- Demo address moves to `larkin.alderthemes.com`.

## 0.1.0 — 2026-09-02

- Initial build of the free café template: home, menu, about, contact and legal pages.
- **Locations collection** — address, hours, map link and laptop policy per shop. The same template serves a single café or a small chain without a rebuild.
- **Menu collection** with seasonal flags, espresso bar and drip & pour-over sections.
- `CafeOrCoffeeShop` + `Menu`/`MenuItem` + `FAQPage` schema.org markup on every page.
- Open/closed state and today's hours sit above the fold at every screen size — the thing a café visitor actually checks.
- No reservation logic by design: cafés do not take bookings, and pretending otherwise is the most common mistake in this vertical.

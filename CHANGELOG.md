# Changelog — Larkin

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

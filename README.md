# Larkin / Café

A café site built around the four things people actually check: where, when, what, and can I work here

Astro + Tailwind CSS 4 + TypeScript. Zero JavaScript by default.

**Live demo:** https://larkin.alderthemes.com

## Quick start

```bash
npm install
npm run dev    # http://localhost:4321
npm run build  # production build -> dist/
```

Node 22.19.0 or newer (see `.node-version` and `engines` in package.json).

On a build server use `npm ci` instead: `package-lock.json` ships with the
template and pins the exact tree this was tested against.

## Make it yours

1. **Business identity** (name, e-mail, phone) — `src/lib/site.ts`
2. **Addresses and opening hours** — `src/content/locations/`, one file per shop
3. **Every visible string** — `src/i18n/en.json` (Turkish included; switch with `LOCALE` in `site.ts`)
4. **Content** — `src/content/`, one markdown file per item
5. **Colours and fonts** — the `:root` block in `src/styles/global.css`

Full documentation: [`docs/README.md`](docs/README.md).

## Deploying

Set `site` in `astro.config.mjs` to your own domain, then deploy `dist/`.
Cloudflare and Netlify configs are included (`wrangler.jsonc`, `netlify.toml`).

## Licence

Free to use in unlimited projects, including client work. You may not republish it as a template. See [`LICENSE.md`](LICENSE.md).

Demo photography is AI-generated and covered by [`IMAGE-LICENSE.md`](IMAGE-LICENSE.md).

---

[Alder Themes](https://alderthemes.com) · support@alderthemes.com

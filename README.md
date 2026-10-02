# Larkin / Café

A café site built around the four things people check: where, when, what, and can I work here

Astro + Tailwind CSS 4 + TypeScript. Zero JavaScript by default.

**Live demo:** https://larkin.alderthemes.com

## Launch in order

From this zip to a live site your client can edit. Do the steps in this order; each link opens the step in the docs, with what you should see when it worked.

1. [Install it and run it on your computer](docs/README.md#launch-1)
2. [Make it yours](docs/README.md#launch-2)
3. [Put it in a private GitHub repository](docs/README.md#launch-3)
4. [Put the site live, with `SITE` set](docs/README.md#launch-4)
5. [Deploy the login service](docs/README.md#launch-5)
6. [Create the GitHub OAuth app](docs/README.md#launch-6)
7. [Give the login service its keys](docs/README.md#launch-7)
8. [Turn the editor on and push](docs/README.md#launch-8)
9. [Sign in at `/admin` and change one menu item](docs/README.md#launch-9)
10. [Give your client a login](docs/README.md#launch-10)

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

1. **Business identity** (name, e-mail, phone): `src/lib/site.ts`
2. **Addresses and opening hours**: `src/content/locations/`, one file per shop
3. **Every visible string**: `src/i18n/en.json` (Turkish included; switch with `LOCALE` in `site.ts`)
4. **Content**: `src/content/`, one markdown file per item
5. **Colours and fonts**: the `:root` block in `src/styles/global.css`

Full documentation: [`docs/README.md`](docs/README.md).

Let your client edit the menu → [docs section 8](docs/README.md#8-let-your-client-edit-the-menu).

## Working with an AI coding tool

`AGENTS.md` holds this kit's launch order and rules for an AI coding tool.

## Deploying

Set `SITE` to your own domain (see `.env.example`) and deploy `dist/`.
You do not need to edit `astro.config.mjs`.
Cloudflare and Netlify configs are included (`wrangler.jsonc` and `netlify.toml`).

## Licence

Free to use in unlimited projects, including client work. You may not republish it as a template. See [`LICENSE.md`](LICENSE.md).

Demo photography is AI-generated and covered by [`IMAGE-LICENSE.md`](IMAGE-LICENSE.md).

---

[Alder Themes](https://alderthemes.com) · support@alderthemes.com

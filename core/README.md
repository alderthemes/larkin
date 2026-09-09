# @studio/core

The shared layer every Alder Themes template is built on: design tokens, a
handful of components, and the helpers that produce structured data.

This folder ships **inside your package**, as a real directory rather than a
download, so the template builds with no registry access and nothing to
resolve. `package.json` points at it with `"@studio/core": "file:./core"`.

## Why there are files you never use

This package is shared across every template in the collection, and each
template uses the part of it that its vertical needs. In your copy you will
find components no page imports and, in `utils/seo.ts`, schema builders for
hotels, clinics and software as well as the one this theme uses. That is not
leftover code — it is the same library, and the parts your theme does not
call are the parts another theme does.

None of it reaches your site. Astro's build only includes what a page
actually imports, so an unused component costs nothing in `dist/`: it takes
space in the folder, not in the pages you serve.

## Editing it

You can. It is your copy. Two things to know before you do:

- An update to the theme replaces this folder wholesale, so an edit here is
  an edit you have to make again. The `:root` block in
  `src/styles/global.css` is designed to make most edits unnecessary: it
  overrides any token in `tokens/tokens.css` without touching this folder.
- If you need a change that tokens cannot express, copy the component into
  `src/components/` and import it from there. Then it is yours, and an update
  cannot overwrite it.

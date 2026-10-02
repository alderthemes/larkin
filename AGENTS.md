# AGENTS.md: Larkin (café)

This file is for the AI coding tool working in this repository, and for the
developer reviewing its changes. It holds the launch task: from the zip to a
live site the café edits in a web form. Where things live and how to change
them is in `docs/README.md`.

## 0. Before you call any task done

```bash
npm run build           # stops on a missing or mistyped content field
npm run cms -- check    # once the editor is on: the editor config matches the content
```

`npm run cms -- check` exits 0 when the editor config is up to date (or the
editor is off), 1 when it is out of date, 2 when it could not check. Treat 2
as a failure, never as clean. Fix 1 with `npm run cms -- generate`; never edit
`public/admin/config.yml` by hand.

## Launch task (from the zip to a live, editable site)

Use this when the user asks you to set the site up, put it live, or turn on
the content editor. Follow the same ten steps, in the same order, as
"Launch guide (do these in order)" at the top of `docs/README.md`. Each step
there says what the user should see when it worked; check that before moving
on.

Steps marked **STOP** need the user's account, a permission screen or a secret
key. At a STOP: do not try `gh`, do not create accounts, do not ask the user
to paste a client secret into the chat. Tell the user exactly what to click,
using the screen names from that step in `docs/README.md`, then wait for the
value you need back.

1. **You run:** `npm install`, then `npm run dev`. Confirm the site answers at
   http://localhost:4321. A "SITE is not set" box is normal here.
2. **You run:** put the café's details in `src/lib/site.ts`, wording in
   `src/i18n/*.json`, shops and opening hours in `src/content/locations/`,
   items in `src/content/menu/` (`docs/README.md` sections 2 and 4), then
   `npm run build`.
3. **STOP.** The user creates an empty **Private** GitHub repository (no
   README, no license, no `.gitignore`). You may run `git init`, `git add .`
   and `git commit` from the box in `docs/README.md` ("From the zip to your
   own GitHub repository"). The user runs `git push`: the first push may
   open a GitHub sign-in. **Get back:** the repository as `owner/name`.
4. **STOP.** The user connects the repository to a host that builds on every
   push. Cloudflare: Workers & Pages, **Create**, **Continue with GitHub**,
   **Select a repository**, **Next**; on **Set up your application** the
   **Project name** equal to `"name"` in `wrangler.jsonc`, **Build command**
   `npm run build`, **Deploy command** `npx wrangler deploy`, and under
   **Advanced settings** a variable `SITE` with the live address, before the
   first deploy. A build listed as **Skipped** is an older one replaced by a
   newer push. **Get back:** the live address.
   Confirm the home page's `canonical` link uses it and that there is no
   `noindex` line.
5. **STOP.** The user deploys the login service (sveltia-cms-auth) with the
   "Deploy to Cloudflare" link in `docs/README.md` step 5, ticking **Create
   private Git repository**, Build command empty, Deploy command
   `pnpm run deploy`. Tell them: an "authorization has expired" message means
   reconnecting GitHub from the Git account dropdown (**New GitHub
   connection**), and **Initializing** can last several minutes. **Get
   back:** the Worker URL (`https://sveltia-cms-auth.<subdomain>.workers.dev`).
   If they already have one from another site, skip to step 7.
6. **STOP.** The user creates a GitHub OAuth app: Settings, Developer
   settings, OAuth Apps, **New OAuth App**. **Redirect URI** is
   `<worker-url>/callback`; leave **Enable Device Flow** off. Then
   **Register application**, copy the Client ID, **Generate a new client
   secret** (shown once). Nothing comes back to you: the keys go straight
   into Cloudflare in step 7.
7. **STOP.** In Cloudflare, the `sveltia-cms-auth` Worker, Settings,
   **Runtime variables and secrets** (not the Build section), **Add
   variable**: `GITHUB_CLIENT_ID` (text), `GITHUB_CLIENT_SECRET` (tick
   **Secret**), `ALLOWED_DOMAINS` = the live hostname(s) without `https://`,
   comma-separated. Then **Add variable and deploy**. Wait for the user to
   say it is done.
8. **You run:**
   `npm run cms -- enable sveltia --repo owner/name --auth-url <worker-url>`,
   then `npm run cms -- check` (must print "Editor config up to date") and
   `npm run build`. Commit. **STOP** for the push: the user runs
   `git push`.
9. **STOP.** The user opens `https://<live address>/admin`, chooses **Sign In
   with GitHub** and authorizes the app. Tell them: do not press **Grant**
   under **Organization access** unless the repository belongs to that
   organization; if they authorized the app before, GitHub does not ask
   again. They open **Menu**, change one item's price and save; a commit
   `Update Menu “…”` appears in the repository and the host rebuilds. If
   they see "You don't have access to the “…” repository", the `--repo`
   value or their access is wrong: go back to step 8.
10. **STOP.** The user adds the client's GitHub account to the repository as
    a collaborator with write access, and tells the client what the editor
    covers (`docs/README.md` section 8).

Never reorder steps 5 to 8. The enable command needs the Worker URL, and
turning the editor on last means `/admin` never goes live before its login
service works.

## 1. What the editor covers

- **In the form:** menu items (`src/content/menu/`), locations with their
  opening hours (`src/content/locations/`) and questions
  (`src/content/faq/`). The fields and labels come from `cms/fields.json`;
  the day names for opening hours come from `cms/weekdays.yaml` and must stay
  the English names `src/lib/locations.ts` reads.
- **Not in the form, on purpose:** wording (`src/i18n/*.json`), business
  details (`src/lib/site.ts`), legal pages, currency and photographs.
- After any change to `src/content.config.ts` or `cms/fields.json`, run
  `npm run cms -- generate` if the editor is on, then `npm run cms -- check`.
  A new schema field with no entry in `cms/fields.json` makes `check` fail on
  purpose: add a label for it, or `"hidden": true` only if the field has a
  default in the schema.
- Tell the developer: a save that the build rejects leaves the live site
  unchanged, and the owner sees no error. Ask them to turn on their host's
  failed-build notification (`docs/README.md` section 8, "A bad save").

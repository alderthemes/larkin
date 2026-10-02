#!/usr/bin/env node
/**
 * core/cms/cli.mjs - the content editor for a theme: on, off, regenerated, checked.
 * The theme runs it through its own scripts/cms.mjs (`npm run cms`); everything
 * theme-specific comes from the theme folder: cms/fields.json (collections,
 * labels, option sources), src/content.config.ts (via astro sync) and
 * src/i18n/en.json (labels for "i18n:" option sources).
 *
 *   npm run cms -- status
 *   npm run cms -- enable sveltia --repo owner/name [--auth-url URL] [--branch main]
 *   npm run cms -- disable sveltia
 *   npm run cms -- generate                             after you change src/content.config.ts,
 *                                                       cms/fields.json, option lists or labels
 *   npm run cms -- check                                fails if a config is out of date;
 *                                                       warns if a record file is not in editor key order
 *   npm run cms -- order                                puts each record file (cms/fields.json "records")
 *                                                       in the key order the editor writes, so the owner's
 *                                                       first save changes one line, not the whole file
 *
 * Exit codes: 0 = done / up to date, 1 = a config is out of date, 2 = could not run.
 * A check that scans nothing is never "clean": with no editor enabled it says so
 * and scans nothing; with no schemas it exits 2.
 * The editors write the same Markdown files you edit by hand; turning one off
 * removes only its config, never content.
 */
import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  rmSync,
  readdirSync,
} from "node:fs";
import { resolve, join, relative, sep, dirname } from "node:path";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import {
  buildModel,
  CmsError,
  yamlCommentLines,
  commentedFileMessage,
} from "./model.mjs";
import {
  sveltiaConfig,
  sveltiaIndexHtml,
  HEADER,
  SVELTIA_VERSION,
} from "./emit.mjs";
import { toYaml } from "./yaml.mjs";
import { buildRecords, readLocale, orderPlan, siteReader, siteLister } from "./record.mjs";
import {
  headersBlock,
  findBlock,
  putBlock,
  removeBlock,
} from "./headers.mjs";

const args = process.argv.slice(2);
const cmd = args[0];
const opt = (name) => {
  const i = args.indexOf(`--${name}`);
  const v = i > 0 ? args[i + 1] : undefined;
  return v === undefined || v.startsWith("--") ? undefined : v;
};
const root = resolve(opt("root") ?? process.cwd());
const SV_CFG = join(root, "public/admin/config.yml");
const SV_HTML = join(root, "public/admin/index.html");
const HDR = join(root, "public/_headers");
const rd = (p) => (existsSync(p) ? readFileSync(p, "utf8") : null);

/**
 * Sveltia needs its own policy on /admin. public/_headers is edited (Cloudflare
 * semantics verified, see cms/headers.mjs). Cloudflare is the only supported
 * host, so this is the only file that carries the block.
 */
function syncHeaders(authUrl) {
  const h = rd(HDR) ?? "";
  write(HDR, putBlock(h, headersBlock(authUrl)));
}

function staleHeaders(sv) {
  const out = [];
  const h = rd(HDR);
  const hb = h === null ? null : findBlock(h);
  if (hb !== headersBlock(sv.authUrl)) out.push("public/_headers");
  return out;
}

/** Files that still carry a managed /admin block while Sveltia is off (public/admin deleted by hand). */
function leftoverBlocks() {
  return [["public/_headers", HDR]]
    .filter(([, p]) => {
      const t = rd(p);
      return t !== null && findBlock(t) !== null;
    })
    .map(([name]) => name);
}

function die(code, msg) {
  console.error(msg);
  process.exit(code);
}

/**
 * Runs Astro's own sync so the schemas are never older than src/content.config.ts.
 * No shell: `shell: true` on Windows makes Node 24 print DEP0190, so Astro's CLI
 * entry is run with the current Node instead of `npx`.
 * CMS_SYNC_SCRIPT (tests only) replaces that entry with another Node script.
 */
function syncSchemas() {
  let entry = process.env.CMS_SYNC_SCRIPT;
  if (!entry) {
    try {
      const req = createRequire(join(root, "package.json"));
      const pkgPath = req.resolve("astro/package.json");
      const bin = JSON.parse(readFileSync(pkgPath, "utf8")).bin;
      entry = resolve(dirname(pkgPath), typeof bin === "string" ? bin : bin.astro);
    } catch {
      die(2, "Run `npm install` first.");
    }
  }
  const r = spawnSync(process.execPath, [entry, ...(process.env.CMS_SYNC_SCRIPT ? [] : ["sync"])], {
    cwd: root,
    stdio: "inherit",
  });
  if (r.status !== 0)
    die(2, "astro sync failed (see above). Fix the error, then run the command again; the schemas were not refreshed.");
}

function loadSchemas() {
  // Given --schemas DIR the caller owns the schemas. Otherwise they are always
  // refreshed first: .astro/collections is left behind by dev/build and goes stale.
  if (!opt("schemas")) syncSchemas();
  const dir = resolve(opt("schemas") ?? join(root, ".astro/collections"));
  if (!existsSync(dir))
    die(2, `No generated schemas in ${dir}. Run npm run build once, then try again.`);
  const out = {};
  for (const f of readdirSync(dir))
    if (f.endsWith(".schema.json"))
      out[f.replace(/\.schema\.json$/, "")] = JSON.parse(
        readFileSync(join(dir, f), "utf8"),
      );
  if (Object.keys(out).length === 0)
    die(2, `No *.schema.json files in ${dir}. Nothing to generate from.`);
  return out;
}

/** Exit 1 (or 2 for a stored value) instead of a TypeError from new URL(). */
function checkAuthUrl(v, label, code = 1) {
  let u;
  try {
    u = new URL(v);
  } catch {
    die(code, `${label}: "${v}" is not a valid URL (expected e.g. https://auth.example.com).`);
  }
  if (u.protocol !== "https:" && u.protocol !== "http:")
    die(code, `${label}: "${v}" must start with https://.`);
}

/**
 * A YAML list of `- id: …` / `label: …` entries, e.g. cms/fields.json
 * "options": { "sizes": "src/data/sizes.yaml" }.
 */
function loadYamlList(name, file) {
  if (typeof file !== "string" || !/\.ya?ml$/.test(file))
    die(2, `cms/fields.json options.${name}: expected a path to a .yaml file, got ${JSON.stringify(file)}.`);
  const p = join(root, file);
  if (!existsSync(p)) die(2, `cms/fields.json options.${name}: ${file} does not exist.`);
  const list = [
    ...readFileSync(p, "utf8").matchAll(/^- id:\s*([\w-]+)\s*\n\s+label:\s*(.+)$/gm),
  ].map((m) => ({
    value: m[1],
    label: m[2].trim().replace(/^["']|["']$/g, ""),
  }));
  if (list.length === 0) die(2, `${file} has no \`- id:\` / \`label:\` entries.`);
  return list;
}

function loadOptions() {
  const hints = JSON.parse(readFileSync(join(root, "cms/fields.json"), "utf8"));
  const out = {};
  for (const [name, file] of Object.entries(hints.options ?? {}))
    out[name] = loadYamlList(name, file);
  let en;
  // Nested "fields" (objects, lists of objects) can name option lists too.
  const allHints = (fields) =>
    Object.values(fields ?? {}).flatMap((h) =>
      h && typeof h === "object" ? [h, ...allHints(h.fields)] : [],
    );
  for (const [name, c] of Object.entries(hints.collections ?? {})) {
    if (typeof c.file === "string") {
      if (!existsSync(join(root, c.file)))
        die(2, `cms/fields.json: ${c.file} does not exist.`);
      if (/\.ya?ml$/.test(c.file)) {
        const lines = yamlCommentLines(readFileSync(join(root, c.file), "utf8"));
        if (lines.length) die(1, commentedFileMessage(name, c.file, lines));
      }
    }
    for (const h of allHints(c.fields)) {
      if (h.optionsFrom?.startsWith("i18n:")) {
        en ??= JSON.parse(readFileSync(join(root, "src/i18n/en.json"), "utf8"));
        const obj = h.optionsFrom
          .slice(5)
          .split(".")
          .reduce((o, k) => o?.[k], en);
        if (!obj) die(2, `${h.optionsFrom}: not found in src/i18n/en.json.`);
        out[h.optionsFrom] = Object.entries(obj).map(([value, label]) => ({
          value,
          label,
        }));
      }
    }
  }
  return { options: out, hints };
}

function readSveltiaSettings() {
  const t = readFileSync(SV_CFG, "utf8");
  const get = (k) => new RegExp(`\\n\\s+${k}: "([^"]*)"`).exec(t)?.[1];
  const repo = get("repo");
  if (!repo)
    die(
      2,
      "public/admin/config.yml: could not read the repository setting - re-run `npm run cms -- enable sveltia --repo owner/name`.",
    );
  const authUrl = get("base_url");
  if (authUrl !== undefined)
    checkAuthUrl(authUrl, "public/admin/config.yml base_url", 2);
  return {
    repo,
    branch: get("branch") ?? "main",
    authUrl,
  };
}

/**
 * cms/fields.json "records" checked against their files. The active language
 * (for a "{locale}" path) is read from src/lib/site.ts, and DEFAULT_LOCALE from
 * the core's utils/i18n.ts beside this tool.
 */
function loadRecords(hints, omitEmpty) {
  const read = siteReader(root);
  let coreI18n = null;
  try {
    coreI18n = readFileSync(new URL("../utils/i18n.ts", import.meta.url), "utf8");
  } catch {
    // readLocale reports it, and only a "{locale}" record needs it.
  }
  const cols = Object.entries(hints.collections ?? {});
  return buildRecords(hints.records, {
    read,
    listDir: siteLister(root),
    locale: readLocale(read("src/lib/site.ts"), coreI18n),
    takenNames: cols.map(([n]) => n),
    takenFiles: cols.map(([, c]) => c?.file).filter((f) => typeof f === "string"),
    omitEmpty,
  });
}

function render(sv) {
  const { options, hints } = loadOptions();
  let model;
  try {
    model = buildModel({ schemas: loadSchemas(), hints, options });
    model.records = loadRecords(hints, model.omitEmpty);
  } catch (e) {
    if (e instanceof CmsError) die(e.code === "scope" ? 2 : 1, e.message);
    throw e;
  }
  const files = new Map();
  files.set(SV_CFG, HEADER + toYaml(sveltiaConfig(model, sv)));
  files.set(SV_HTML, sveltiaIndexHtml(SVELTIA_VERSION));
  return { files, model };
}

function write(path, text) {
  mkdirSync(resolve(path, ".."), { recursive: true });
  writeFileSync(path, text);
}

const on = { sveltia: existsSync(SV_CFG) };

if (cmd === "status") {
  console.log(
    on.sveltia
      ? "sveltia: on (public/admin present — editor at /admin after deploy)"
      : "sveltia: off (run npm run cms -- enable sveltia --repo owner/name to turn on)",
  );
} else if (cmd === "enable" && args[1] === "sveltia") {
  const sv = {
    repo: opt("repo"),
    branch: opt("branch") ?? "main",
    authUrl: opt("auth-url"),
  };
  if (sv.authUrl !== undefined) checkAuthUrl(sv.authUrl, "--auth-url");
  let out;
  try {
    out = render(sv);
  } catch (e) {
    die(1, e.message);
  }
  write(SV_CFG, out.files.get(SV_CFG));
  write(SV_HTML, out.files.get(SV_HTML));
  try {
    syncHeaders(sv.authUrl);
  } catch (e) {
    die(1, `--auth-url: ${e.message}`);
  }
  console.log(
    "Sveltia: on (public/admin/). The editor opens at /admin after the next deploy.",
  );
} else if (cmd === "disable" && args[1] === "sveltia") {
  rmSync(SV_CFG, { force: true });
  rmSync(SV_HTML, { force: true });
  const ht = rd(HDR);
  if (ht !== null && findBlock(ht) !== null) write(HDR, removeBlock(ht));
  console.log("sveltia: off. Content files were not touched.");
} else if (cmd === "generate" || cmd === "check") {
  if (!on.sveltia) {
    const left = leftoverBlocks();
    if (left.length) {
      const msg = left
        .map(
          (f) =>
            `${f} still has a content-editor block; run \`npm run cms -- disable sveltia\` or delete the block between the markers.`,
        )
        .join("\n");
      if (cmd === "check") die(1, msg);
      console.error(msg);
    }
    console.log("No editor enabled - nothing to " + cmd + ".");
    process.exit(0);
  }
  const sv = readSveltiaSettings();
  const { files, model } = render(sv);
  const targets = [...files];
  const recFields = (fs) => fs.reduce((n, f) => n + (f.fields ? recFields(f.fields) : 1), 0);
  const scope =
    `${model.scanned.collections} collections, ${model.scanned.fields} fields` +
    (model.records.length
      ? `, ${model.records.length} record${model.records.length === 1 ? "" : "s"} (${model.records.reduce((n, r) => n + recFields(r.fields), 0)} fields)`
      : "");
  // A warning, not a failure: the site builds the same either way; only the
  // owner's first save is noisier.
  for (const r of model.records) {
    const plan = orderPlan(r);
    if (!plan.inOrder)
      console.error(
        `Warning: ${r.file} is not in the key order the editor writes, so the owner's first save in the editor will rewrite the whole file. ` +
          "Run `npm run cms -- order` once and commit the result (values do not change).",
      );
  }
  if (cmd === "generate") {
    for (const [p, t] of targets) write(p, t);
    syncHeaders(sv.authUrl);
    console.log(`Generated (${scope}).`);
  } else {
    const stale = targets
      .filter(
        ([p, t]) =>
          !existsSync(p) ||
          readFileSync(p, "utf8").replace(/\r\n/g, "\n") !== t,
      )
      .map(([p]) => relative(root, p).split(sep).join("/"));
    for (const f of staleHeaders(sv)) stale.push(f);
    if (stale.length)
      die(
        1,
        "Out of date: " + stale.join(", ") + ". Run `npm run cms -- generate`. (" + scope + ")",
      );
    console.log(`Editor config up to date (${scope}).`);
  }
} else if (cmd === "order") {
  // Needs no editor and no schemas: only cms/fields.json "records" and their files.
  const hints = JSON.parse(readFileSync(join(root, "cms/fields.json"), "utf8"));
  let records;
  try {
    records = loadRecords(hints, false);
  } catch (e) {
    if (e instanceof CmsError) die(1, e.message);
    throw e;
  }
  if (records.length === 0) {
    console.log('No "records" in cms/fields.json - no file was checked or changed.');
    process.exit(0);
  }
  for (const r of records) {
    const plan = orderPlan(r);
    if (plan.changed) write(join(root, r.file), plan.next);
    console.log(
      !plan.changed
        ? `${r.file}: already in editor order.`
        : `${r.file}: ${plan.inOrder ? "whitespace" : "keys"} rewritten in editor order; no value changed.` +
            (plan.reformats && !plan.inOrder ? " (Its whitespace was also normalized to JSON with its own indentation.)" : ""),
    );
  }
} else {
  die(
    2,
    "Usage: cms.mjs status | enable sveltia --repo owner/name [--auth-url URL] | disable sveltia | generate | check | order",
  );
}

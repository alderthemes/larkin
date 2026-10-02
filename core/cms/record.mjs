/**
 * record.mjs - "records": one data file that holds ONE object, edited as one
 * form (Business details, the page text in src/i18n/<locale>.json). cms/fields.json:
 *
 *   "records": {
 *     "business": {
 *       "label": "Business details",
 *       "file": "src/data/business.json",
 *       "fields": {
 *         "name": { "label": "Business name" },
 *         "address": { "label": "Address", "fields": { "street": { "label": "Street" } } },
 *         "deliveryFee": { "label": "Delivery fee", "kind": "number", "nullable": true }
 *       }
 *     },
 *     "pageText": { "label": "Page text", "file": "src/i18n/{locale}.json", "fields": { ... } }
 *   }
 *
 * These files have no Astro schema (a dictionary, a plain data file), so the
 * declaration is the contract, and it is checked against the file itself:
 * every declared key must be in the file with the declared type. Keys the form
 * does not show are kept by the editor (measured live 2026-09-30, Sveltia
 * 0.223.0: saving en.json with only hero + about in the form kept all 86 values).
 *
 * Kinds: "string" (the default), "text", "number", "integer", "boolean",
 * "list" (a list of text), and an object when "fields" is given.
 * "nullable": true on a number: the file may hold null, the editor shows an
 * optional number and writes null when it is emptied (measured live 2026-09-30).
 *
 * Key order. The editor rewrites the whole file on save, in its own key order
 * (Sveltia 0.223.0, src/lib/services/contents/draft/save/serialize.js,
 * finalizeContent): the file is flattened to key paths, the paths of the form's
 * fields are written first in form order, then every other path sorted with
 * Intl.Collator(numeric, sensitivity "base") (@sveltia/utils 0.12.2 string.js,
 * `compare`), and the result is unflattened. editorOrder() does the same, so
 * `npm run cms -- order` can put a file in that order before the owner's first
 * save, and that save is then a one-line diff. Measured live the same day: the
 * first save of en.json moved form fields first and sorted the rest, recursively.
 * The editor writes JSON.stringify(value, null, 2) (file/format.js formatJSON);
 * the order command keeps the file's own indentation and line endings.
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { CmsError, yamlCommentLines, commentedFileMessage } from "./model.mjs";

const fail = (msg) => {
  throw new CmsError("unknown-field", msg);
};
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

const RECORD_KEYS = new Set(["label", "file", "hint", "fields"]);
const FIELD_KEYS = new Set(["label", "hint", "kind", "fields", "nullable"]);
const KINDS = new Set(["string", "text", "number", "integer", "boolean", "list", "object"]);
const LOCALE_TOKEN = "{locale}";

/** What a JSON value is, in the words the error messages use. */
function typeName(v) {
  if (v === null) return "null";
  if (Array.isArray(v)) return "a list";
  if (typeof v === "number") return Number.isInteger(v) ? "a whole number" : "a number";
  if (typeof v === "object") return "an object";
  return `a ${typeof v}`;
}

/**
 * The active language of a kit: `export const LOCALE ... = "tr"` or `= DEFAULT_LOCALE`
 * in src/lib/site.ts (all ten kits, read 2026-09-30), DEFAULT_LOCALE being the
 * core's utils/i18n.ts value. Anything else is "could not read", never a guess.
 * `coreI18n` is the text of utils/i18n.ts (the caller reads it next to this file).
 */
export function readLocale(siteTs, coreI18n) {
  if (siteTs === null) return { error: "src/lib/site.ts does not exist" };
  const m = [...siteTs.matchAll(/^export const LOCALE\b[^=\n]*=\s*([^;\n]+);/gm)];
  if (m.length !== 1)
    return { error: `src/lib/site.ts has ${m.length} \`export const LOCALE = ...;\` lines, expected exactly one` };
  const v = m[0][1].trim();
  const lit = /^["']([a-z]{2}(?:-[A-Za-z]{2,4})?)["']$/.exec(v);
  if (lit) return { locale: lit[1] };
  if (v === "DEFAULT_LOCALE") {
    const d = coreI18n && /^export const DEFAULT_LOCALE\b[^=\n]*=\s*["']([a-z]{2}(?:-[A-Za-z]{2,4})?)["'];/m.exec(coreI18n);
    if (d) return { locale: d[1] };
    return { error: "LOCALE is DEFAULT_LOCALE, but DEFAULT_LOCALE could not be read from the core's utils/i18n.ts" };
  }
  return { error: `LOCALE is set to ${v}, which this tool cannot read (expected "en", "tr", ... or DEFAULT_LOCALE)` };
}

/** Every key with a "." or an empty key: the editor stores key paths joined with ".", so it would split them. */
function badKeys(v, path, out = []) {
  if (Array.isArray(v)) v.forEach((x, i) => badKeys(x, `${path}.${i}`, out));
  else if (isObj(v))
    for (const [k, x] of Object.entries(v)) {
      if (k === "" || k.includes(".")) out.push(`${path}.${JSON.stringify(k)}`);
      badKeys(x, `${path}.${k}`, out);
    }
  return out;
}

/** One declared field, checked against the value the file holds at that key. */
function toField(path, name, hint, value, file) {
  if (!isObj(hint)) fail(`${path}: must be an object, e.g. { "label": "Title" }.`);
  for (const k of Object.keys(hint))
    if (!FIELD_KEYS.has(k))
      fail(`${path}: "${k}" is not a record field setting. Use: ${[...FIELD_KEYS].join(", ")}.`);
  const kind = hint.kind ?? (hint.fields !== undefined ? "object" : "string");
  if (!KINDS.has(kind))
    fail(`${path}: "kind": ${JSON.stringify(kind)} is not known in a record. Use one of: ${[...KINDS].join(", ")}.`);
  if (kind === "object" && hint.fields === undefined)
    fail(`${path}: an object needs "fields": a label for each part you want in the form.`);
  if (kind !== "object" && hint.fields !== undefined)
    fail(`${path}: "fields" only applies to an object.`);
  const numeric = kind === "number" || kind === "integer";
  if (hint.nullable !== undefined && (hint.nullable !== true || !numeric))
    fail(`${path}: "nullable": true is for a number that may be empty ("kind": "number" or "integer").`);
  const expected = {
    string: "text (a string)",
    text: "text (a string)",
    number: "a number",
    integer: "a whole number",
    boolean: "true or false",
    list: "a list of text",
    object: "an object",
  }[kind];
  const ok =
    (hint.nullable && value === null) ||
    {
      string: () => typeof value === "string",
      text: () => typeof value === "string",
      number: () => typeof value === "number",
      integer: () => Number.isInteger(value),
      boolean: () => typeof value === "boolean",
      list: () => Array.isArray(value) && value.every((x) => typeof x === "string"),
      object: () => isObj(value),
    }[kind]();
  if (!ok)
    fail(
      `${path}: cms/fields.json says ${expected}${hint.nullable ? " or null" : ""}, but ${file} holds ${typeName(value)} here` +
        (value === null && numeric ? ` (add "nullable": true if the value may be empty)` : "") +
        ". Fix the declaration or the file.",
    );
  const f = { name, label: hint.label ?? name, required: !hint.nullable, kind };
  if (hint.hint) f.hint = hint.hint;
  if (kind === "number") f.step = 0.01;
  if (hint.nullable) f.nullable = true;
  if (kind === "object") f.fields = fieldsFrom(path, hint.fields, value, file);
  return f;
}

function fieldsFrom(path, hintFields, obj, file) {
  if (!isObj(hintFields) || Object.keys(hintFields).length === 0)
    fail(`${path}: "fields" must be an object with at least one entry.`);
  return Object.entries(hintFields).map(([k, h]) => {
    if (!has(obj, k))
      fail(
        `${path}.${k}: in cms/fields.json but not in ${file}. Check the spelling; keys are case-sensitive` +
          ` (${path.includes(".") ? "this object" : "the file"} has: ${Object.keys(obj).slice(0, 12).join(", ")}${Object.keys(obj).length > 12 ? ", …" : ""}).`,
      );
    return toField(`${path}.${k}`, k, h, obj[k], file);
  });
}

/**
 * cms/fields.json "records" -> model records. `ctx`:
 *   read(path)       the text of a site file, or null when it does not exist
 *   locale           readLocale() result (only consulted for a "{locale}" path)
 *   takenNames       collection names already used
 *   takenFiles       files already edited as one-file collections
 *   omitEmpty        the editor's omit_empty_optional_fields switch (model.omitEmpty)
 *   listDir(dir)     file names in a site folder (for the "other languages" hint)
 */
export function buildRecords(records, ctx) {
  if (records === undefined) return [];
  if (!isObj(records)) fail(`"records" in cms/fields.json must be an object, one entry per record.`);
  const out = [];
  const files = new Map();
  for (const [name, r] of Object.entries(records)) {
    if (!/^[A-Za-z][\w-]*$/.test(name)) fail(`records.${name}: a record name is letters, digits, - and _.`);
    if (ctx.takenNames.includes(name))
      fail(`records.${name}: the same name is used by a collection; give the record another name.`);
    if (!isObj(r)) fail(`records.${name}: must be an object with "label", "file" and "fields".`);
    for (const k of Object.keys(r))
      if (!RECORD_KEYS.has(k)) fail(`records.${name}: "${k}" is not a record setting. Use: ${[...RECORD_KEYS].join(", ")}.`);
    const pattern = r.file;
    if (typeof pattern !== "string" || pattern.startsWith("/") || pattern.split("/").includes("..") || !/^[\w./{}-]+$/.test(pattern))
      fail(`records.${name}: "file" must be a path from the site root, e.g. "src/data/${name}.json".`);
    if (/\.ya?ml$/.test(pattern)) {
      const text = ctx.read(pattern);
      const lines = text === null ? [] : yamlCommentLines(text);
      if (lines.length) fail(commentedFileMessage(`records.${name}`, pattern, lines));
      fail(
        `records.${name}: a record is a .json file. YAML is not supported for records yet: this tool checks and orders ` +
          `the file's keys the way the editor writes them, and it reads JSON only. Use a .json file.`,
      );
    }
    if (!pattern.endsWith(".json")) fail(`records.${name}: "file" must be a .json file.`);
    const tokens = pattern.split(LOCALE_TOKEN).length - 1;
    if (tokens > 1 || (tokens === 0 && pattern.includes("{")))
      fail(`records.${name}: the only placeholder a "file" may hold is ${LOCALE_TOKEN}, once.`);
    let file = pattern;
    let others = [];
    if (tokens === 1) {
      if (ctx.locale?.locale === undefined)
        fail(
          `records.${name}: "${pattern}" needs the site's active language, and it could not be read: ${ctx.locale?.error ?? "unknown"}. ` +
            `Write the path with the language in it instead, e.g. "${pattern.replace(LOCALE_TOKEN, "en")}", and run \`npm run cms -- generate\` again whenever you change LOCALE.`,
        );
      file = pattern.replace(LOCALE_TOKEN, ctx.locale.locale);
      const [before, after] = basename(pattern).split(LOCALE_TOKEN);
      const dir = dirname(pattern);
      others = (ctx.listDir(dir) ?? [])
        .filter((f) => f.startsWith(before) && f.endsWith(after) && f.length > before.length + after.length)
        .map((f) => `${dir}/${f}`)
        .filter((f) => f !== file)
        .sort();
    }
    if (ctx.takenFiles.includes(file))
      fail(`records.${name}: ${file} is already a one-file collection. A file is edited in one place only.`);
    if (files.has(file))
      fail(
        `records.${name}: ${file} is also records.${files.get(file)}. Put all its fields in one record: the editor ` +
          `writes form fields first, so two forms over one file would reorder it on every save.`,
      );
    files.set(file, name);
    const text = ctx.read(file);
    if (text === null) fail(`records.${name}: ${file} does not exist.`);
    let value;
    try {
      value = JSON.parse(text);
    } catch (e) {
      fail(`records.${name}: ${file} is not valid JSON (${e.message}).`);
    }
    if (!isObj(value))
      fail(`records.${name}: ${file} holds ${typeName(value)}; a record file holds one object ({ ... }). A list of rows is a one-file collection ("file" under "collections").`);
    const bad = badKeys(value, name);
    if (bad.length)
      fail(
        `records.${name}: ${file} has keys the editor would split apart (a "." or an empty key): ${bad.slice(0, 3).join(", ")}. Rename them first.`,
      );
    const fields = fieldsFrom(name, r.fields, value, file);
    if (ctx.omitEmpty) {
      const walk = (fs, p) =>
        fs.forEach((f) => {
          if (!f.required)
            fail(
              `${p}.${f.name}: may be empty, but an optional image, date or link in a collection makes the editor leave empty fields out of the file, ` +
                `so emptying this number would remove the key from ${file} instead of writing null. Remove "nullable", or make those collection fields required.`,
            );
          if (f.fields) walk(f.fields, `${p}.${f.name}`);
        });
      walk(fields, name);
    }
    const label = r.label ?? name;
    let description = typeof r.hint === "string" ? r.hint : undefined;
    if (tokens === 1) {
      const note =
        `This edits ${file}, the site's active language.` +
        (others.length ? ` ${others.join(", ")} ${others.length === 1 ? "is" : "are"} not edited here.` : "");
      description = description ? `${description} ${note}` : note;
    }
    out.push({ name, label, file, pattern, fields, value, text, ...(description ? { description } : {}) });
  }
  return out;
}

/* ---------------- key order ---------------- */

const compare = new Intl.Collator("en", { numeric: true, sensitivity: "base" }).compare;

/** The file flattened to leaf key paths, the way the `flat` library does it (empty objects/lists are leaves). */
function flatten(v, prefix, out) {
  const kids = Array.isArray(v) ? v.map((x, i) => [String(i), x]) : isObj(v) ? Object.entries(v) : [];
  if (kids.length === 0) {
    if (prefix) out.set(prefix, v);
    return out;
  }
  for (const [k, x] of kids) flatten(x, prefix ? `${prefix}.${k}` : k, out);
  return out;
}

/** The form's key paths in form order; a list gets `path.*` (Sveltia key-path.js createKeyPathList). */
function keyPathList(fields, prefix = "", out = []) {
  for (const f of fields) {
    const p = prefix ? `${prefix}.${f.name}` : f.name;
    out.push(p);
    if (f.kind === "object") keyPathList(f.fields, p, out);
    if (f.kind === "list") out.push(`${p}.*`);
  }
  return out;
}

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * The value with its keys in the order the editor writes them. Values are not
 * touched: only the order of object keys changes (lists keep their order).
 */
export function editorOrder(value, fields) {
  const unsorted = flatten(value, "", new Map());
  const order = [];
  const take = (k) => {
    if (unsorted.has(k)) {
      order.push(k);
      unsorted.delete(k);
    }
  };
  for (const kp of keyPathList(fields)) {
    if (!kp.includes("*")) {
      take(kp);
      continue;
    }
    const re = new RegExp(`^(${esc(kp).replaceAll("\\*", "\\d+")})(?:\\.|$)`);
    const concrete = new Set([...unsorted.keys()].map((k) => re.exec(k)?.[1]).filter(Boolean));
    [...concrete].sort(compare).forEach(take);
  }
  [...unsorted.keys()].sort(compare).forEach(take);
  // Unflatten in that order, keeping each container's own type from the original.
  const root = {};
  for (const p of order) {
    const segs = p.split(".");
    let src = value;
    let dst = root;
    for (let i = 0; i < segs.length; i++) {
      const s = segs[i];
      const key = Array.isArray(src) ? Number(s) : s;
      const next = src[key];
      if (i === segs.length - 1) dst[key] = next;
      else {
        if (!(key in dst) || dst[key] === undefined) dst[key] = Array.isArray(next) ? [] : {};
        dst = dst[key];
      }
      src = next;
    }
  }
  return root;
}

/** Same keys in the same order, everywhere? (Values are equal by construction.) */
export const sameOrder = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** The file's own style: indentation, line ending, final newline. */
export function jsonStyle(text) {
  const nl = text.includes("\r\n") ? "\r\n" : "\n";
  const m = /\n([ \t]+)\S/.exec(text);
  const indent = m ? (m[1].startsWith("\t") ? "\t" : m[1].length) : 2;
  return { nl, indent, finalNewline: /\r?\n$/.test(text) };
}

export function formatJson(value, style) {
  const body = JSON.stringify(value, null, style.indent);
  return (style.nl === "\n" ? body : body.replace(/\n/g, "\r\n")) + (style.finalNewline ? style.nl : "");
}

/**
 * For one model record: is the file already in editor order, and what would the
 * order command write? `reformats` = the rewrite also changes whitespace (the
 * file was not laid out like JSON.stringify with its own indentation).
 */
export function orderPlan(record) {
  const ordered = editorOrder(record.value, record.fields);
  const style = jsonStyle(record.text);
  const next = formatJson(ordered, style);
  const inOrder = sameOrder(ordered, record.value);
  const reformats = formatJson(record.value, style) !== record.text;
  return { inOrder, next, changed: next !== record.text, reformats };
}

/** Reads a site file relative to root, or null. */
export const siteReader = (root) => (p) => {
  const f = join(root, p);
  return existsSync(f) ? readFileSync(f, "utf8") : null;
};
export const siteLister = (root) => (d) => {
  const f = join(root, d);
  return existsSync(f) ? readdirSync(f) : null;
};

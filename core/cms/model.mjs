/**
 * model.mjs - turns Astro's generated JSON Schema (.astro/collections/*.schema.json,
 * written by `astro sync` from src/content.config.ts) plus cms/fields.json into
 * a neutral field model that emit.mjs writes out for each editor.
 *
 * The schema says what is valid; the theme's cms/fields.json says what the site
 * owner reads (labels, hints) and which business rules the schema cannot express
 * (e.g. "required": false where the editor must allow an empty list).
 * Every schema field needs a hint entry and every hint needs a schema field, so
 * a field added to the schema is never silently missing from the panel.
 *
 * What each schema shape looks like in Astro's JSON Schema (measured 2026-09-30,
 * astro 7.3.4, `astro sync` on the kits):
 *   z.coerce.date()        {"type":"string","format":"date-time"}
 *   image()                {"type":"string"}  - the same as z.string(), so the
 *                          schema cannot tell an image from text: the hint says it
 *   reference("x")         {"anyOf":[number, string, {id,collection}, {slug,collection}]}
 *                          - the target collection is NOT in the schema: the hint names it
 *   z.array(z.object(..))  {"type":"array","items":{"type":"object","properties":..}}
 *   file("x.yaml") loader  {"anyOf":[{"type":"array","items":{..one row..}}, ..]}
 *   z.number().nullable()  {"type":["number","null"]}, listed in "required"
 *   z.number().int().nullable(), z.number().nonnegative().nullable() - any check on the number:
 *                          {"anyOf":[{"type":"integer"|"number",..},{"type":"null"}]}, listed in "required"
 *   ...nullable().default(null)
 *                          the same shape plus "default":null, NOT in "required"
 *                          (anyOf read 2026-09-30 from the kits' own `astro sync` output: meldon
 *                          plans.priceUsd, hopperton bakes.leadTimeDays; the type-list shape
 *                          measured 2026-10-01 on a copy of larkin, astro 7.3.4)
 */
export class CmsError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

const SAFE = Number.MAX_SAFE_INTEGER;
const fail = (msg) => {
  throw new CmsError("unknown-field", msg);
};

/** Hint keys this tool understands; anything else is a typo and fails. */
const KINDS = new Set(["text", "image", "date", "datetime", "list"]);

function choicesFor(path, enumValues, hint, options) {
  if (!hint.optionsFrom) {
    if (enumValues) return enumValues.map((v) => ({ value: v, label: v }));
    return undefined;
  }
  const source = options[hint.optionsFrom];
  if (!source)
    throw new CmsError(
      "unknown-option-source",
      `${path}: options source ${JSON.stringify(hint.optionsFrom)} was not loaded.` +
        (hint.optionsFrom.startsWith("i18n:")
          ? ""
          : ` Name its file under "options" in cms/fields.json, e.g. "options": { ${JSON.stringify(hint.optionsFrom)}: "src/data/${hint.optionsFrom}.yaml" }.`),
    );
  if (!enumValues) return source;
  const byValue = new Map(source.map((o) => [o.value, o]));
  return enumValues.map((v) => {
    const o = byValue.get(v);
    if (!o)
      fail(`${path}: value ${JSON.stringify(v)} has no label in ${hint.optionsFrom}.`);
    return o;
  });
}

/** Astro's reference(): a string id, or an {id, collection} object. */
export function isReference(p) {
  return (
    Array.isArray(p?.anyOf) &&
    p.anyOf.some((a) => a.type === "string") &&
    p.anyOf.some(
      (a) => a.type === "object" && a.properties?.id && a.properties?.collection,
    )
  );
}

const isDate = (p) => p?.type === "string" && p.format === "date-time";

/**
 * Line numbers (1-based) of YAML comments in a data file: whole-line `#` comments,
 * and a ` #` after a value on a line with no quotes (a quoted "#" is text).
 * Measured live 2026-09-30 (Sveltia 0.223.0, the studio's live walk site): saving a
 * one-file collection rewrote its YAML data file and removed all 22 of its
 * leading comment lines. So a commented file is refused for "file" collections.
 */
export function yamlCommentLines(text) {
  const out = [];
  text.split(/\r?\n/).forEach((line, i) => {
    if (/^\s*#/.test(line) || (!/["']/.test(line) && /\s#/.test(line))) out.push(i + 1);
  });
  return out;
}

/** The refusal message for a commented one-file collection (cli.mjs prints it). */
export function commentedFileMessage(name, file, lines) {
  const shown = lines.slice(0, 5).join(", ") + (lines.length > 5 ? ", …" : "");
  return (
    `${name}: ${file} has comment lines (line ${shown}). The editor removes every comment when it saves this file, ` +
    `so a "file" collection would silently delete them. Move the notes to a separate README or doc next to it, ` +
    `delete the comments from the data file, then run the command again.`
  );
}

/**
 * The media folder for an image hint, as a repository path, and the path the
 * editor must write so Astro's image() resolves it from the content file:
 * relative to the file's folder, e.g. src/content/menu -> ../../assets/images.
 */
function mediaFor(path, hint, baseFolder) {
  const m = hint.media;
  if (typeof m !== "string" || !m || m.startsWith("/") || m.split("/").includes(".."))
    fail(
      `${path}: an image field needs "media": the folder uploads go to, from the site root, e.g. "media": "src/assets/images".`,
    );
  const from = baseFolder.split("/").filter(Boolean);
  const to = m.split("/").filter(Boolean);
  let i = 0;
  while (i < from.length && i < to.length && from[i] === to[i]) i++;
  const rel = [...from.slice(i).map(() => ".."), ...to.slice(i)].join("/");
  return {
    mediaFolder: to.join("/"),
    // Always starts with "." so the editor keeps it relative (Sveltia
    // src/lib/services/config/folders/assets.js, normalizeAssetFolder).
    publicFolder: rel.startsWith("..") ? rel : `./${rel}`,
  };
}

function checkHintKeys(path, hint, prop) {
  if (hint.kind !== undefined && !KINDS.has(hint.kind))
    fail(
      `${path}: "kind": ${JSON.stringify(hint.kind)} is not known. Use one of: ${[...KINDS].join(", ")}.`,
    );
  if (hint.media !== undefined && hint.kind !== "image")
    fail(`${path}: "media" only applies to "kind": "image".`);
  if (hint.fields !== undefined) {
    const obj = prop.type === "object" || prop.items?.type === "object";
    if (!obj) fail(`${path}: "fields" only applies to an object or a list of objects in the schema.`);
  }
}

/**
 * The non-null half of z.X().nullable(), or undefined when the property is not nullable.
 * Astro writes it two ways (see the table at the top): with a check on the number
 * as anyOf [X, null], without one as type ["number", "null"]. The second is read as a
 * number only; other type lists (["string", "null"], ...) stay unsupported.
 */
function nullableInner(p) {
  if (Array.isArray(p?.type)) {
    if (p.type.length !== 2 || !p.type.includes("null")) return undefined;
    const t = p.type.find((x) => x !== "null");
    if (t !== "number" && t !== "integer") return undefined;
    const { type: _t, default: _d, ...rest } = p;
    return { ...rest, type: t };
  }
  if (!Array.isArray(p?.anyOf) || p.anyOf.length !== 2) return undefined;
  const i = p.anyOf.findIndex((a) => a.type === "null" && Object.keys(a).length === 1);
  return i < 0 ? undefined : p.anyOf[1 - i];
}

/**
 * A number that may be null ("no price: talk to us", "no lead time").
 *
 * What the editor writes when the owner empties it (Sveltia 0.223.0, tag v0.223.0):
 *   - the number input's empty value is stored as null for value_type int/float
 *     (src/lib/services/contents/fields/number/helpers.js, getNumberFieldValue), and a
 *     new entry starts as null (fields/number/defaults.js, getDefaultValueMap);
 *   - on save that null is written as `key: null` (draft/save/serialize.js, copyProperty),
 *     UNLESS output.omit_empty_optional_fields is on: then an optional field whose value is
 *     null is left out of the file (copyProperty + utils/object.js isValueEmpty).
 * So the field is an optional number in the editor, and the only unsafe case is
 * "key left out" reaching a schema that has no default: z.number().nullable() accepts
 * null but REJECTS a missing key. buildModel refuses that case (the switch is on and
 * the schema has no default) instead of emitting anything: the kit's schema, and so
 * its site, stays as it is, and the author picks the fix. A null default is not passed
 * to the editor: Sveltia turns `default: null` into no value at all (defaults.js keeps
 * only a whole/finite number), where leaving it out gives the null we want.
 */
function nullableNumber(path, name, prop, inner, required, hint, ctx) {
  if (inner.type !== "number" && inner.type !== "integer")
    fail(
      `${path}: a field that may be null (.nullable()) is supported for numbers only (z.number().nullable()). ` +
        `Use .optional() instead, or leave the value empty in another way the schema accepts.`,
    );
  if (hint.kind !== undefined)
    fail(`${path}: "kind" does not apply to a number that may be null.`);
  const withDefault = prop.default !== undefined && prop.default !== null ? { ...inner, default: prop.default } : inner;
  const f = toField(path, name, withDefault, false, hint, ctx);
  f.nullable = true;
  // In the schema's "required": the key must be in the file (null is fine, missing is not).
  f.keyRequired = required;
  return f;
}

/**
 * One schema property + its hint -> one model field. `ctx` carries what nested
 * fields need: the collection's folder (for image paths), the option lists and
 * the collections the editor will know about (for references).
 */
function toField(path, name, prop, required, hint, ctx) {
  const inner = nullableInner(prop);
  if (inner) return nullableNumber(path, name, prop, inner, required, hint, ctx);
  checkHintKeys(path, hint, prop);
  if (hint.required === false && required)
    fail(
      `${path}: the schema requires this field, so cms/fields.json cannot set "required": false.`,
    );
  const base = {
    name,
    label: hint.label ?? name,
    required: hint.required ?? required,
  };
  if (hint.hint) base.hint = hint.hint;
  if (prop.default !== undefined) base.default = prop.default;
  if (hint.emptyMeansAbsent) base.emptyMeansAbsent = true;
  const minItems = (p) =>
    typeof p.minItems === "number" && p.minItems > 0 ? { min: p.minItems } : {};

  if (prop.type === "array") {
    const items = prop.items ?? {};
    if (hint.kind === "image") {
      if (items.type !== "string")
        fail(`${path}: "kind": "image" on a list needs a list of image paths in the schema, e.g. z.array(image()).`);
      return { ...base, kind: "image", multiple: true, ...minItems(prop), ...mediaFor(path, hint, ctx.baseFolder) };
    }
    if (hint.collection !== undefined) {
      if (!isReference(items))
        fail(`${path}: "collection" needs reference(...) in the schema, e.g. z.array(reference(${JSON.stringify(hint.collection)})).`);
      return { ...base, kind: "relation", multiple: true, ...minItems(prop), ...relationTo(path, hint, ctx) };
    }
    if (items.type === "object") {
      if (!hint.fields)
        fail(`${path}: a list of objects needs "fields" in cms/fields.json: a label for each part of one item.`);
      return {
        ...base,
        kind: "objectList",
        ...minItems(prop),
        ...(hint.summary ? { summary: hint.summary } : {}),
        fields: fieldsFrom(path, items, hint.fields, ctx),
      };
    }
    if (hint.kind === "list") {
      if (items.type !== "string" || items.enum || isReference(items))
        fail(`${path}: "kind": "list" is a list of free text; the schema must be z.array(z.string()).`);
      return { ...base, kind: "list", ...minItems(prop) };
    }
    const choices = choicesFor(path, items.enum, hint, ctx.options);
    if (!choices)
      fail(
        `${path}: a list field needs choices (schema enum or optionsFrom), or "kind": "list" for free text, or "collection" for links to another collection.`,
      );
    return { ...base, kind: "select", multiple: true, choices };
  }
  if (hint.collection !== undefined) {
    if (!isReference(prop))
      fail(`${path}: "collection" needs reference(${JSON.stringify(hint.collection)}) in the schema.`);
    return { ...base, kind: "relation", ...relationTo(path, hint, ctx) };
  }
  if (hint.kind === "image") {
    if (prop.type !== "string")
      fail(`${path}: "kind": "image" needs image() in the schema.`);
    return { ...base, kind: "image", ...mediaFor(path, hint, ctx.baseFolder) };
  }
  if (isDate(prop)) {
    if (hint.kind !== undefined && hint.kind !== "date" && hint.kind !== "datetime")
      fail(`${path}: the schema holds a date, so "kind" can only be "date" or "datetime".`);
    return { ...base, kind: hint.kind === "datetime" ? "datetime" : "date" };
  }
  if (hint.kind === "date" || hint.kind === "datetime")
    fail(`${path}: "kind": ${JSON.stringify(hint.kind)} needs z.coerce.date() in the schema.`);
  if (prop.type === "object") {
    if (!hint.fields)
      fail(`${path}: schema type "object" needs "fields" in cms/fields.json: a label for each part.`);
    return { ...base, kind: "object", fields: fieldsFrom(path, prop, hint.fields, ctx) };
  }
  if (isReference(prop) && !hint.optionsFrom)
    fail(
      `${path}: reference() to another collection: name it with "collection", or give "optionsFrom" for a list of ids.`,
    );
  if (prop.enum || hint.optionsFrom)
    return {
      ...base,
      kind: "select",
      choices: choicesFor(path, prop.enum, hint, ctx.options),
    };
  if (prop.type === "boolean") return { ...base, kind: "boolean" };
  if (prop.type === "integer" || prop.type === "number") {
    const integer = prop.type === "integer";
    const step = integer ? 1 : 0.01;
    const f = { ...base, kind: integer ? "integer" : "number" };
    if (!integer) f.step = step;
    if (typeof prop.exclusiveMinimum === "number")
      f.min = +(prop.exclusiveMinimum + step).toFixed(2);
    else if (typeof prop.minimum === "number" && Math.abs(prop.minimum) < SAFE)
      f.min = prop.minimum;
    return f;
  }
  if (prop.type === "string")
    return { ...base, kind: hint.kind === "text" ? "text" : "string" };
  fail(`${path}: schema type ${JSON.stringify(prop.type)} is not supported by the panel.`);
}

/**
 * A reference points at a folder collection the editor also shows: the editor
 * stores the target's file name, which is the id Astro's glob() loader gives it.
 */
function relationTo(path, hint, ctx) {
  const t = ctx.targets[hint.collection];
  if (!t)
    fail(
      `${path}: "collection": ${JSON.stringify(hint.collection)} is not a collection in cms/fields.json. The editor can only link to a collection it shows.`,
    );
  if (!t.folder)
    fail(
      `${path}: "collection": ${JSON.stringify(hint.collection)} is a single-file collection; link to its ids with "optionsFrom" instead.`,
    );
  return { collection: hint.collection, displayField: t.slugField };
}

/** The shared rule for a collection and for each nested object: every field labelled, no strays. */
function fieldsFrom(path, schema, hintFields, ctx, { allowHidden = false } = {}) {
  if (!hintFields || typeof hintFields !== "object" || Array.isArray(hintFields))
    fail(`${path}: "fields" must be an object with one entry per field.`);
  const props = Object.fromEntries(
    Object.entries(schema.properties ?? {}).filter(([k]) => k !== "$schema"),
  );
  const required = new Set(schema.required ?? []);
  for (const k of Object.keys(hintFields))
    if (!(k in props)) fail(`${path}.${k}: in cms/fields.json but not in the schema.`);
  const out = [];
  for (const [k, prop] of Object.entries(props)) {
    const hint = hintFields[k];
    if (!hint)
      fail(
        `${path}.${k}: in the schema but not in cms/fields.json. Add a label${allowHidden ? ' (or "hidden": true)' : ""}.`,
      );
    if (hint.hidden) {
      if (!allowHidden)
        fail(
          `${path}.${k}: "hidden" works only on a top-level field of a folder collection (the editor is only known to keep unshown fields there).`,
        );
      if (required.has(k) && prop.default === undefined && ctx.create !== false)
        fail(
          `${path}.${k}: hidden, but the schema requires it and has no default, so an entry created in the editor would stop the build. Set "create": false on the collection, or show the field.`,
        );
      continue;
    }
    out.push(toField(`${path}.${k}`, k, prop, required.has(k), hint, ctx));
  }
  return out;
}

/**
 * Kinds whose empty value the schema rejects: "" for an image or a date, null
 * for a single link or an object not added (Sveltia data-output, fields/relation,
 * fields/object docs, read 2026-09-30).
 */
const emptyRejected = (f) =>
  !f.multiple &&
  ["image", "date", "datetime", "relation", "object"].includes(f.kind);
const listLike = (f) => f.multiple || f.kind === "list" || f.kind === "objectList";

function walk(fields, fn, prefix) {
  for (const f of fields) {
    const path = `${prefix}.${f.name}`;
    fn(f, path);
    if (f.fields) walk(f.fields, fn, path);
  }
}

export function buildModel({ schemas, hints, options }) {
  const collections = [];
  let fieldCount = 0;
  const all = Object.entries(hints.collections ?? {});
  const targets = Object.fromEntries(
    all.map(([n, h]) => [n, { folder: h.folder, slugField: h.slugField }]),
  );
  for (const [name, h] of all) {
    const schema = schemas[name];
    if (!schema)
      throw new CmsError(
        "scope",
        `cms/fields.json names collection ${JSON.stringify(name)}, but no schema was generated for it. Run \`npx astro sync\`.`,
      );
    if (!h.fields || typeof h.fields !== "object" || Array.isArray(h.fields))
      fail(`${name}: cms/fields.json needs a "fields" object for this collection.`);
    for (const k of ["create", "delete"])
      if (h[k] !== undefined && typeof h[k] !== "boolean")
        fail(`${name}: "${k}" must be true or false.`);
    const rows = schema.anyOf?.find((a) => a.type === "array")?.items;
    const isFile = typeof h.file === "string";
    if (isFile) {
      if (h.folder !== undefined) fail(`${name}: give "folder" or "file", not both.`);
      if (!/^[\w./-]+\.(ya?ml|json)$/.test(h.file) || h.file.startsWith("/") || h.file.split("/").includes(".."))
        fail(`${name}: "file" must be a .yaml, .yml or .json path from the site root, e.g. "src/data/${name}.yaml".`);
      if (!rows?.properties)
        fail(`${name}: "file" is for a collection loaded with file(...) (one file, a list of rows); the schema is not one.`);
      if (h.body) fail(`${name}: a single-file collection has no body.`);
      if ("id" in rows.properties)
        fail(`${name}: the schema declares "id"; the tool adds the id field itself, so remove it from the schema.`);
    } else {
      if (typeof h.folder !== "string" || !h.folder)
        fail(`${name}: cms/fields.json needs a string "folder" (the content folder), or "file" for a one-file collection.`);
      if (!schema.properties && rows)
        fail(`${name}: this collection is one file (file(...) loader); use "file" instead of "folder".`);
    }
    const ctx = {
      options,
      targets,
      create: h.create,
      baseFolder: isFile ? h.file.split("/").slice(0, -1).join("/") : h.folder,
    };
    const fields = fieldsFrom(name, isFile ? rows : schema, h.fields, ctx, {
      allowHidden: !isFile,
    });
    if (!isFile && (!h.slugField || !(h.slugField in (schema.properties ?? {}))))
      fail(`${name}: "slugField" must name a schema field (it becomes the file name).`);
    fieldCount += fields.length;
    const c = {
      name,
      label: h.label ?? name,
      fields,
      create: h.create !== false,
      delete: h.delete !== false,
    };
    if (isFile)
      Object.assign(c, {
        file: h.file,
        idLabel: h.idLabel ?? "ID",
        ...(h.idHint ? { idHint: h.idHint } : {}),
        ...(h.summary ? { summary: h.summary } : {}),
      });
    else
      Object.assign(c, {
        folder: h.folder,
        slugField: h.slugField,
        body: Boolean(h.body),
        bodyLabel: h.bodyLabel ?? "Long description",
        bodyHint: h.bodyHint,
      });
    collections.push(c);
  }
  if (collections.length === 0)
    throw new CmsError(
      "scope",
      "No collections in cms/fields.json. Nothing to generate.",
    );

  // An optional image, date or single link left empty is written as "" or null,
  // which Astro's schema rejects. The editor's omit_empty_optional_fields leaves
  // such a field out instead - but it is one switch for the whole site, and it
  // also turns an emptied optional list into a missing key. Where the schema has
  // no default for that list, "missing" may mean something else than "empty"
  // (an entry that never declared the list at all), so the hint must say it is safe.
  // Measured live 2026-09-30: an existing `list: []` is dropped on the next save
  // of that entry, even when the list was not touched.
  let omitEmpty = false;
  for (const c of collections)
    walk(c.fields, (f) => {
      if (!f.required && emptyRejected(f)) omitEmpty = true;
    });
  if (omitEmpty)
    for (const c of collections)
      walk(c.fields, (f, path) => {
        // See nullableNumber: with the switch on, an emptied number leaves the file.
        if (f.nullable && !f.required && f.keyRequired)
          fail(
            `${path}: may be null, but an optional image, date or link elsewhere makes the editor leave empty fields out of the file, ` +
              `so emptying this number removes the key instead of writing null, and z.number().nullable() without a default rejects a missing key. ` +
              `Add .default(null) to it in the schema (a missing key then reads as null), ` +
              `or set "required": true in cms/fields.json if the editor must always hold a number here.`,
          );
        if (!f.required && listLike(f) && f.default === undefined && !f.emptyMeansAbsent)
          fail(
            `${path}: an optional image, date or link elsewhere makes the editor leave empty fields out of the file, so emptying this list removes it rather than writing []. ` +
              `Give it a default in the schema (.default([])), or set "emptyMeansAbsent": true if a missing list means the same as an empty one. ` +
              `(A list of reference()s never shows its default to this tool - Astro leaves it out of the JSON Schema - so it needs the hint.)`,
          );
      }, c.name);
  return {
    collections,
    omitEmpty,
    scanned: { collections: collections.length, fields: fieldCount },
  };
}

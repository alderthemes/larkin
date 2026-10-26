/**
 * labels.mjs - cms/labels.json: the site owner's labels and hints for the editor.
 *
 * cms/fields.json is ours (fields, kinds, option sources, default labels); an
 * update replaces it. cms/labels.json is the owner's (an update never touches
 * it) and only carries new wording for fields we declared:
 *
 *   { "menu.name": { "label": "Plate name" },
 *     "business.phone": { "hint": "With the country code." } }
 *
 * The key is "<form>.<field>", nested parts joined with dots
 * ("business.hours.mon.open"); the form is a collection or a record of
 * cms/fields.json. "label" and "hint" are the only values. Anything else is an
 * error, so a key we renamed is caught at `npm run cms -- generate`, not found
 * as a form with the wrong name.
 */
import { CmsError } from "./model.mjs";

const FILE = "cms/labels.json";
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const fail = (msg) => {
  throw new CmsError("labels", msg);
};

/**
 * `hints` laid over with `labels`. Pure: returns a copy, the input is unchanged.
 * `labels` undefined or null (no file) returns the input as it is.
 * @param {object} hints   the parsed cms/fields.json
 * @param {unknown} labels the parsed cms/labels.json
 */
export function applyLabels(hints, labels) {
  if (labels === undefined || labels === null) return hints;
  if (!isObj(labels))
    fail(`${FILE} must be an object: { "<form>.<field>": { "label": "...", "hint": "..." } }.`);
  const out = structuredClone(hints);
  const forms = { ...(out.collections ?? {}), ...(out.records ?? {}) };
  for (const [key, value] of Object.entries(labels)) {
    const parts = key.split(".");
    if (parts.length < 2 || parts.some((p) => p === ""))
      fail(
        `${FILE}: "${key}" must name a field as "<form>.<field>" (nested parts joined with dots, e.g. "business.hours.mon.open").`,
      );
    const [head, ...rest] = parts;
    const form = forms[head];
    if (!form)
      fail(
        `${FILE}: "${key}": "${head}" is not a form in cms/fields.json. The forms are: ${Object.keys(forms).join(", ")}.`,
      );
    let fields = form.fields;
    let path = head;
    let hint;
    for (const p of rest) {
      path += `.${p}`;
      if (!isObj(fields) || !isObj(fields[p]))
        fail(
          `${FILE}: "${key}": ${path} is not a field in cms/fields.json. Only a field we declared can be relabelled; delete the entry or fix the key.`,
        );
      hint = fields[p];
      fields = hint.fields;
    }
    if (hint.hidden) fail(`${FILE}: "${key}" is hidden in the editor; it has no label to change.`);
    if (!isObj(value)) fail(`${FILE}: "${key}" must be an object with "label" and/or "hint".`);
    const keys = Object.keys(value);
    if (keys.length === 0) fail(`${FILE}: "${key}" is empty: give "label", "hint" or both.`);
    for (const k of keys) {
      if (k !== "label" && k !== "hint")
        fail(
          `${FILE}: "${key}": "${k}" is not a label or a hint. Only the wording changes here; the fields are declared in cms/fields.json.`,
        );
      if (typeof value[k] !== "string" || value[k].trim() === "")
        fail(`${FILE}: "${key}": "${k}" must be a non-empty text.`);
    }
    if (value.label !== undefined) hint.label = value.label;
    if (value.hint !== undefined) hint.hint = value.hint;
  }
  return out;
}

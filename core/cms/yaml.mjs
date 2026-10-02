/**
 * yaml.mjs - a small YAML writer for the shapes cms.mjs emits: objects, arrays,
 * strings, numbers, booleans. Every string is double-quoted with JSON rules,
 * which is valid YAML, so no value is ever read back as a different type.
 * Output is deterministic: same input, same bytes (the drift gate relies on it).
 */
function scalar(v) {
  if (typeof v === "string") return JSON.stringify(v);
  if (typeof v === "number" && !Number.isFinite(v))
    throw new Error(`yaml: non-finite number ${v} cannot be written`);
  return String(v);
}
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

function lines(value, indent) {
  const pad = " ".repeat(indent);
  const out = [];
  if (Array.isArray(value)) {
    for (const item of value) {
      if (isObj(item)) {
        if (!Object.keys(item).length)
          throw new Error("yaml: empty objects are not used by this writer");
        const [first, ...rest] = lines(item, indent + 2);
        out.push(`${pad}- ${first.trimStart()}`, ...rest);
      } else if (Array.isArray(item)) {
        throw new Error("yaml: nested arrays are not used by this writer");
      } else out.push(`${pad}- ${scalar(item)}`);
    }
    return out;
  }
  for (const [k, v] of Object.entries(value)) {
    if (v === undefined) continue;
    if (Array.isArray(v) && v.length === 0) out.push(`${pad}${k}: []`);
    else if (Array.isArray(v)) out.push(`${pad}${k}:`, ...lines(v, indent + 2));
    else if (isObj(v) && !Object.keys(v).length)
      throw new Error(`yaml: empty object at key "${k}" is not supported`);
    else if (isObj(v)) out.push(`${pad}${k}:`, ...lines(v, indent + 2));
    else out.push(`${pad}${k}: ${scalar(v)}`);
  }
  return out;
}

export function toYaml(value) {
  return lines(value, 0).join("\n") + "\n";
}

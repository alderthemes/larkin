/**
 * The stop for a reference that points at nothing.
 *
 * A theme resolves its own references: one reads ids from a YAML list, one
 * calls `getEntry`, one builds a set of slugs. What they share is the moment
 * a name does not match: the build has to stop, and the message has to tell
 * the site owner which file, which field and which value, in words they can
 * act on. That message lives here, once.
 *
 * Why stop at all: Astro's `reference()` does not. An unmatched reference
 * prints "Invalid content reference" and the build still exits 0, and the
 * page ships with the field missing (measured 2026-09-10).
 *
 * The words "does not exist" stay in the first line: theme guides quote them
 * so an owner can find the explanation by searching for the error.
 */

interface MissingReference {
  /** The file that holds the reference, as the owner sees it: `src/content/plans/team.md`. */
  file: string;
  /** The field in that file: `modules`. */
  field: string;
  /** The value that matched nothing: `reporting`. */
  value: string;
  /** Where a match was looked for: `src/content/modules/`. */
  folder: string;
  /**
   * What to do about it, when the default is wrong for this reference (for
   * example an id in a YAML list rather than a file name). Replaces the
   * default line.
   */
  hint?: string | string[];
  /** Why the build stops instead of carrying on: what the page would get wrong. */
  why?: string | string[];
}

const DEFAULT_HINT = 'Check the spelling, or add the file. The file name without ".md" is the name to use here.';

const lines = (text: string | string[]): string[] => (Array.isArray(text) ? text : [text]);
const indent = (text: string | string[]): string[] => lines(text).map((line) => `  ${line}`);

/** Stops the build with a message that names the file, the field and the value. */
export function missingReference({ file, field, value, folder, hint, why }: MissingReference): never {
  throw new Error(
    [
      "",
      `  ${file} — "${field}" points at something that does not exist.`,
      "",
      `    - ${value}`,
      "",
      `  Nothing in ${folder} has that name.`,
      ...indent(hint ?? DEFAULT_HINT),
      ...(why ? ["", ...indent(why)] : []),
      "",
    ].join("\n")
  );
}

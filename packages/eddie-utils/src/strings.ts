import { dropEnd, dropWhile } from "./arrays.ts";
import { not } from "./predicates.ts";

export function isBlank(line: string): boolean {
  return line.trim() === "";
}

/**
 * Trims only preceding and following blank (whitespace-only) lines.
 * Does not remove blank lines in the middle of content.
 */
export function trimBlankLines(str: string): string {
  const lines = str.split("\n");
  const withoutLeading = dropWhile(lines, isBlank);
  const withoutTrailing = dropEnd(withoutLeading, isBlank);
  return withoutTrailing.join("\n");
}

function countIndent(line: string): number {
  const match = line.match(/^(\s*)/);
  return match ? match[1].length : 0;
}

/**
 * Trims preceding/following blank lines, then removes the same amount of
 * leading whitespace from each line as the line with the least leading whitespace.
 */
export function trimIndent(str: string): string {
  const trimmed = trimBlankLines(str);
  const lines = trimmed.split("\n");
  const indents = lines.filter(not(isBlank)).map(countIndent);
  const minIndent = indents.length === 0 ? 0 : Math.min(...indents);
  return lines.map((line) => line.slice(minIndent)).join("\n");
}

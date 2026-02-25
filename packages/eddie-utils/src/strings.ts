import { dropEnd, dropWhile } from "./arrays.ts";
import { not } from "./predicates.ts";

export function removeOptionalPrefix(str: string, prefix: string): string {
  return str.startsWith(prefix) ? str.slice(prefix.length) : str;
}

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

export interface FuzzyMatchResult {
  score: number;
  firstMatchIndex: number;
  lastMatchIndex: number;
}

/**
 * Fuzzy match: pattern characters must appear in order in str (subsequence).
 * Returns score and match span, or null if no match.
 * Case-insensitive. Prefix and contiguity boost the score.
 */
export function fuzzyMatch(
  pattern: string,
  str: string,
): FuzzyMatchResult | null {
  if (pattern.length === 0) {
    return { score: 0, firstMatchIndex: 0, lastMatchIndex: -1 };
  }
  const p = pattern.toLowerCase();
  const s = str.toLowerCase();
  let si = 0;
  const matches: number[] = [];
  for (let pi = 0; pi < p.length; pi++) {
    const ch = p[pi];
    while (si < s.length) {
      if (s[si] === ch) {
        matches.push(si);
        si++;
        break;
      }
      si++;
    }
    if (matches.length !== pi + 1) {
      return null;
    }
  }
  let score = 100;
  let gapSum = 0;
  for (let i = 0; i < matches.length; i++) {
    if (i === 0 && matches[0] === 0) {
      score += 50;
    } else if (i > 0) {
      const gap = matches[i] - matches[i - 1] - 1;
      gapSum += gap;
      if (gap === 0) {
        score += 10;
      }
      if (s[matches[i] - 1] === ":") {
        score += 30;
      }
    }
  }
  score -= gapSum * 2;
  score -= matches[matches.length - 1] - matches[0];
  return {
    score,
    firstMatchIndex: matches[0],
    lastMatchIndex: matches[matches.length - 1],
  };
}

/** Returns the score from fuzzyMatch, or null if no match. */
export function fuzzyMatchScore(pattern: string, str: string): number | null {
  const result = fuzzyMatch(pattern, str);
  return result === null ? null : result.score;
}

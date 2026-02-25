/**
 * Pure logic for account autocomplete: segment and full suggestions with fuzzy matching.
 * Suggests segment completions (e.g. "Equity:") first, then full accounts.
 */

import { distinct } from "@tiddo/eddie-utils/arrays";
import type { FuzzyMatchResult } from "@tiddo/eddie-utils/strings";
import { fuzzyMatch } from "@tiddo/eddie-utils/strings";

export function buildSuggestions(accounts: string[], query: string): string[] {
  const segment = getSegmentCompletions(accounts, query);
  const full = getFullCompletions(accounts, query);
  return [...segment, ...full];
}

/** Returns only segment prefixes (strings ending with ":"), never full account names. */
function getSegmentCompletions(accounts: string[], query: string): string[] {
  return distinct(accounts.map(dropLastSegment))
    .filter(Boolean)
    .map((seg) => ({ seg, match: fuzzyMatch(query, seg) }))
    .filter(isMatch)
    .sort(compareScoreThenName)
    .map((x) => x.seg + ":");
}

/** Returns only full account names (no trailing ":"), never segment prefixes. */
function getFullCompletions(accounts: string[], query: string): string[] {
  return accounts
    .map((account) => ({ account, match: fuzzyMatch(query, account) }))
    .filter(isMatch)
    .sort(compareScoreThenAccount)
    .map((x) => x.account);
}

function dropLastSegment(account: string): string {
  const i = account.indexOf(":");
  if (i === -1) return "";
  return account.slice(0, account.lastIndexOf(":"));
}

function isMatch<T extends { match: FuzzyMatchResult | null }>(
  x: T,
): x is T & { match: FuzzyMatchResult } {
  return x.match !== null;
}

function compareScoreThenName(
  a: { seg: string; match: FuzzyMatchResult },
  b: { seg: string; match: FuzzyMatchResult },
): number {
  if (b.match.score !== a.match.score) return b.match.score - a.match.score;
  return a.seg.localeCompare(b.seg);
}

function compareScoreThenAccount(
  a: { account: string; match: FuzzyMatchResult },
  b: { account: string; match: FuzzyMatchResult },
): number {
  if (b.match.score !== a.match.score) return b.match.score - a.match.score;
  return a.account.localeCompare(b.account);
}

import { strict as assert } from "node:assert";
import { describe, it, test } from "node:test";
import {
  fuzzyMatchScore,
  isBlank,
  trimBlankLines,
  trimIndent,
} from "./strings.ts";

test("isBlank", (t) => {
  t.test("returns true for empty string", () => {
    assert.equal(isBlank(""), true);
  });

  t.test("returns true for whitespace-only string", () => {
    assert.equal(isBlank("   "), true);
    assert.equal(isBlank("\t\n"), true);
  });

  t.test("returns false when non-whitespace present", () => {
    assert.equal(isBlank("  x  "), false);
    assert.equal(isBlank("foo"), false);
  });
});

test("trimBlankLines", (t) => {
  t.test("removes leading and trailing blank lines only", () => {
    assert.equal(
      trimBlankLines("\n\n  foo  \n\n  bar  \n\n"),
      "  foo  \n\n  bar  ",
    );
  });

  t.test("leaves middle blank lines intact", () => {
    assert.equal(trimBlankLines("foo\n\n\nbar"), "foo\n\n\nbar");
  });

  t.test("returns empty string for all blank", () => {
    assert.equal(trimBlankLines("\n  \n\t\n"), "");
  });

  t.test("does nothing when no leading/trailing blank", () => {
    assert.equal(trimBlankLines("foo\nbar"), "foo\nbar");
  });
});

test("trimIndent", (t) => {
  t.test("trims blank lines then strips minimum indent", () => {
    assert.equal(
      trimIndent(`
    foo
        bar
    foo
`),
      "foo\n    bar\nfoo",
    );
  });

  t.test("with no leading content indent", () => {
    assert.equal(
      trimIndent(`
2024-01-01 * "Tx"
  Account  10 USD
`),
      '2024-01-01 * "Tx"\n  Account  10 USD',
    );
  });

  t.test("leaves blank lines in middle with reduced indent", () => {
    const result = trimIndent(`
    a

    b
`);
    assert.equal(result, "a\n\nb");
  });

  t.test("empty string returns empty", () => {
    assert.equal(trimIndent(""), "");
  });

  t.test("only whitespace returns empty", () => {
    assert.equal(trimIndent("\n  \n  "), "");
  });
});

describe("fuzzyMatchScore", () => {
  it("returns 0 for empty pattern", () => {
    assert.equal(fuzzyMatchScore("", "Equity"), 0);
  });

  it("returns null when pattern is not subsequence", () => {
    assert.equal(fuzzyMatchScore("xyz", "Equity"), null);
    assert.equal(fuzzyMatchScore("qy", "Expenses"), null);
  });

  it("returns a score when pattern is subsequence", () => {
    assert.notEqual(fuzzyMatchScore("Eq", "Equity"), null);
    assert.notEqual(fuzzyMatchScore("eq", "Equity"), null);
    assert.notEqual(fuzzyMatchScore("equity", "Equity"), null);
  });

  it("scores prefix match higher", () => {
    const atStart = fuzzyMatchScore("Eq", "Equity");
    const later = fuzzyMatchScore("Eq", "Other:Equity");
    assert.notEqual(atStart, null);
    assert.notEqual(later, null);
    assert.ok((atStart as number) > (later as number));
  });

  it("scores contiguous match higher", () => {
    const contiguous = fuzzyMatchScore("equ", "Equity");
    const spread = fuzzyMatchScore("ety", "Equity");
    assert.notEqual(contiguous, null);
    assert.notEqual(spread, null);
    assert.ok((contiguous as number) > (spread as number));
  });

  it("scores tighter matches higher than spread-out matches", () => {
    const lhv = fuzzyMatchScore("LHV", "Assets:LHV:EUR");
    const lightyear = fuzzyMatchScore("LHV", "Income:Lightyear:VUSA");
    assert.notEqual(lhv, null);
    assert.notEqual(lightyear, null);
    assert.ok((lhv as number) > (lightyear as number));
  });
});

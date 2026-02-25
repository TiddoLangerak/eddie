import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { buildSuggestions } from "./accountAutocomplete.ts";

describe("buildSuggestions", () => {
  it("returns segment completions first then full accounts", () => {
    const accounts = [
      "Assets:Checking",
      "Assets:Savings",
      "Equity:RetainedEarnings",
      "Equity:CommonStock",
      "Expenses:Groceries",
      "Expenses:Travel",
    ];
    const got = buildSuggestions(accounts, "Eq");
    assert.deepEqual(got, [
      "Equity:",
      "Equity:CommonStock",
      "Equity:RetainedEarnings",
    ]);
  });

  it("returns top-level segment completions for empty query", () => {
    const accounts = [
      "Assets:Checking",
      "Equity:CommonStock",
      "Expenses:Groceries",
    ];
    const got = buildSuggestions(accounts, "");
    assert.deepEqual(got, [
      "Assets:",
      "Equity:",
      "Expenses:",
      "Assets:Checking",
      "Equity:CommonStock",
      "Expenses:Groceries",
    ]);
  });

  it("fuzzy-matches query (substring)", () => {
    const accounts = ["Assets:Checking", "Assets:Savings"];
    const got = buildSuggestions(accounts, "As");
    assert.deepEqual(got, ["Assets:", "Assets:Checking", "Assets:Savings"]);
  });

  it("fuzzy-matches pattern across segments (EqRe -> Equity:RetainedEarnings)", () => {
    const accounts = [
      "Equity:RetainedEarnings",
      "Equity:CommonStock",
      "Expenses:Restaurant",
    ];
    const got = buildSuggestions(accounts, "EqRe");
    assert.deepEqual(got, ["Equity:RetainedEarnings"]);
  });

  it("fuzzy-matches pattern with scattered letters and ranks tighter match first", () => {
    const accounts = ["Income:Lightyear:VUSA", "Assets:LHV:EUR"];
    const got = buildSuggestions(accounts, "LHV");
    assert.deepEqual(got, [
      "Assets:LHV:",
      "Assets:LHV:EUR",
      "Income:Lightyear:VUSA",
    ]);
  });

  it("returns empty when no match", () => {
    const accounts = ["Assets:Checking", "Equity:CommonStock"];
    const got = buildSuggestions(accounts, "zzz");
    assert.deepEqual(got, []);
  });

  it("does not suggest segment suffix for leaf accounts (no Assets:Bank:EUR:)", () => {
    const accounts = ["Assets:Bank:EUR"];
    const got = buildSuggestions(accounts, "Assets:Bank");
    assert.deepEqual(got, ["Assets:Bank:", "Assets:Bank:EUR"]);
  });

  it("does not suggest segment completions that do not match the query", () => {
    const accounts = ["Foo:Bar:Baz"];
    const got = buildSuggestions(accounts, "Baz");
    assert.deepEqual(got, ["Foo:Bar:Baz"]);
  });

  it("segment uses match end position for fuzzy query (AsCh -> Assets:Checking:)", () => {
    const accounts = ["Assets:Checking:LHV"];
    const got = buildSuggestions(accounts, "AsCh");
    assert.deepEqual(got, ["Assets:Checking:", "Assets:Checking:LHV"]);
  });
});

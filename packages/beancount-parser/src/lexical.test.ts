import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { run } from "./combinators.ts";
import {
  account,
  currency,
  date,
  flag,
  key,
  link,
  newline,
  number,
  quotedString,
  tag,
} from "./lexical.ts";

describe("lexical", () => {
  it("date parses YYYY-MM-DD", () => {
    const r = run(date, "2024-01-15");
    assert.ok(r.ok);
    if (r.ok) assert.equal(r.value, "2024-01-15");
  });

  it("currency parses uppercase", () => {
    const r = run(currency, "USD");
    assert.ok(r.ok);
    if (r.ok) assert.equal(r.value, "USD");
    assert.ok(run(currency, "EUR").ok);
  });

  it("account parses hierarchical name", () => {
    const r = run(account, "Assets:Bank:Checking");
    assert.ok(r.ok);
    if (r.ok) assert.equal(r.value, "Assets:Bank:Checking");
  });

  it("number parses integer and decimal", () => {
    const r1 = run(number, "42");
    assert.ok(r1.ok);
    if (r1.ok) assert.equal(r1.value, "42");
    const r2 = run(number, "-3.14");
    assert.ok(r2.ok);
    if (r2.ok) assert.equal(r2.value, "-3.14");
  });

  it("quotedString parses double-quoted", () => {
    const r = run(quotedString, '"hello"');
    assert.ok(r.ok);
    if (r.ok) assert.equal(r.value, "hello");
  });

  it("tag parses #name", () => {
    const r = run(tag, "#trip-2024");
    assert.ok(r.ok);
    if (r.ok) assert.equal(r.value, "trip-2024");
  });

  it("link parses ^name", () => {
    const r = run(link, "^receipt-1");
    assert.ok(r.ok);
    if (r.ok) assert.equal(r.value, "receipt-1");
  });

  it("flag parses * or !", () => {
    assert.ok(run(flag, "*").ok);
    assert.ok(run(flag, "!").ok);
  });

  it("key parses lowercase identifier", () => {
    const r = run(key, "payee");
    assert.ok(r.ok);
    if (r.ok) assert.equal(r.value, "payee");
  });

  it("newline parses newline", () => {
    const r = run(newline, "\n");
    assert.ok(r.ok);
    if (r.ok) assert.equal(r.state.input, "");
  });
});

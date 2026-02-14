import { test } from "node:test";
import { strict as assert } from "node:assert";
import { parseBeancount } from "./index.js";

test("parseBeancount returns a BeancountFile", () => {
  const result = parseBeancount("");
  assert.ok(result);
  assert.ok(Array.isArray(result.directives));
});

test("parseBeancount handles simple input", () => {
  const input = '2024-01-01 * "Test transaction"';
  const result = parseBeancount(input);
  assert.equal(result.directives.length, 0); // stub returns empty
  assert.equal(result.metadata?.lineCount, 1);
});

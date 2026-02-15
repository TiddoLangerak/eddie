import { strict as assert } from "node:assert";
import { test } from "node:test";
import { not } from "./predicates.ts";

test("not", (t) => {
  t.test("inverts a predicate", () => {
    const isEven = (n: number) => n % 2 === 0;
    const isOdd = not(isEven);
    assert.equal(isOdd(1), true);
    assert.equal(isOdd(2), false);
    assert.equal(isOdd(0), false);
  });

  t.test("applied twice restores original", () => {
    const isPositive = (n: number) => n > 0;
    const restored = not(not(isPositive));
    assert.equal(restored(1), true);
    assert.equal(restored(-1), false);
  });

  t.test("works with non-primitive types", () => {
    const isEmpty = (s: string) => s.length === 0;
    const isNonEmpty = not(isEmpty);
    assert.equal(isNonEmpty(""), false);
    assert.equal(isNonEmpty("x"), true);
  });
});

import { strict as assert } from "node:assert";
import { test } from "node:test";
import { distinct, dropEnd, dropWhile, findIndex, takeWhile } from "./arrays.ts";

test("distinct", (t) => {
  t.test("removes duplicates", () => {
    assert.deepEqual(distinct([1, 2, 2, 3, 1, 3]), [1, 2, 3]);
  });

  t.test("preserves order of first occurrence", () => {
    assert.deepEqual(distinct(["a", "b", "a", "c", "b"]), ["a", "b", "c"]);
  });

  t.test("returns empty for empty array", () => {
    assert.deepEqual(distinct([]), []);
  });

  t.test("returns same array when no duplicates", () => {
    assert.deepEqual(distinct([1, 2, 3]), [1, 2, 3]);
  });
});

test("findIndex", (t) => {
  t.test("returns index of first match", () => {
    assert.equal(
      findIndex([1, 2, 3, 4], (n) => n > 2),
      2,
    );
  });

  t.test("returns null when no match", () => {
    assert.equal(
      findIndex([1, 2, 3], (n) => n > 10),
      null,
    );
  });

  t.test("returns 0 when first element matches", () => {
    assert.equal(
      findIndex([1, 2, 3], (n) => n === 1),
      0,
    );
  });

  t.test("returns null for empty array", () => {
    assert.equal(
      findIndex([], () => true),
      null,
    );
  });
});

test("takeWhile", (t) => {
  t.test("returns prefix where predicate holds", () => {
    assert.deepEqual(
      takeWhile([1, 2, 3, 4, 5], (n) => n < 4),
      [1, 2, 3],
    );
  });

  t.test("returns empty when predicate fails immediately", () => {
    assert.deepEqual(
      takeWhile([1, 2, 3], (n) => n > 10),
      [],
    );
  });

  t.test("returns full array when predicate always holds", () => {
    assert.deepEqual(
      takeWhile([1, 2, 3], () => true),
      [1, 2, 3],
    );
  });

  t.test("returns empty for empty array", () => {
    assert.deepEqual(
      takeWhile([], (n: number) => n < 5),
      [],
    );
  });
});

test("dropWhile", (t) => {
  t.test("drops prefix where predicate holds", () => {
    assert.deepEqual(
      dropWhile([1, 2, 3, 4, 5], (n) => n < 4),
      [4, 5],
    );
  });

  t.test("returns full array when predicate fails immediately", () => {
    assert.deepEqual(
      dropWhile([1, 2, 3], (n) => n > 10),
      [1, 2, 3],
    );
  });

  t.test("returns empty when predicate always holds", () => {
    assert.deepEqual(
      dropWhile([1, 2, 3], () => true),
      [],
    );
  });

  t.test("returns empty for empty array", () => {
    assert.deepEqual(
      dropWhile([], (n: number) => n < 5),
      [],
    );
  });

  t.test("takeWhile and dropWhile partition the array", () => {
    const arr = [2, 4, 6, 7, 8, 9];
    const pred = (n: number) => n % 2 === 0;
    assert.deepEqual(takeWhile(arr, pred).concat(dropWhile(arr, pred)), arr);
  });
});

test("dropEnd", (t) => {
  t.test("drops suffix where predicate holds", () => {
    assert.deepEqual(
      dropEnd([1, 2, 3, 4, 5], (n) => n > 3),
      [1, 2, 3],
    );
  });

  t.test("returns full array when predicate fails at end", () => {
    assert.deepEqual(
      dropEnd([1, 2, 3], (n) => n > 10),
      [1, 2, 3],
    );
  });

  t.test("returns empty when predicate always holds", () => {
    assert.deepEqual(
      dropEnd([1, 2, 3], () => true),
      [],
    );
  });

  t.test("returns empty for empty array", () => {
    assert.deepEqual(
      dropEnd([], (n: number) => n < 5),
      [],
    );
  });
});

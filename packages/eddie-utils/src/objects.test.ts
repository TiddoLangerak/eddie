import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isRecord,
  isArray,
  expectRecord,
  expectArray,
  getProperty,
  setProperty,
  setValue,
} from "./objects.ts";

test("isRecord", async (t) => {
  await t.test("returns true for plain object", () => {
    assert.equal(isRecord({}), true);
    assert.equal(isRecord({ a: 1 }), true);
  });

  await t.test("returns false for array", () => {
    assert.equal(isRecord([]), false);
    assert.equal(isRecord([1, 2, 3]), false);
  });

  await t.test("returns false for null", () => {
    assert.equal(isRecord(null), false);
  });

  await t.test("returns false for primitives", () => {
    assert.equal(isRecord(42), false);
    assert.equal(isRecord("string"), false);
    assert.equal(isRecord(undefined), false);
  });
});

test("isArray", async (t) => {
  await t.test("returns true for arrays", () => {
    assert.equal(isArray([]), true);
    assert.equal(isArray([1, 2, 3]), true);
  });

  await t.test("returns false for plain objects", () => {
    assert.equal(isArray({}), false);
  });

  await t.test("returns false for primitives", () => {
    assert.equal(isArray(42), false);
    assert.equal(isArray("string"), false);
  });
});

test("expectRecord", async (t) => {
  await t.test("returns value when it is a record", () => {
    const obj = { a: 1 };
    assert.equal(expectRecord(obj, "test"), obj);
  });

  await t.test("throws when value is not a record", () => {
    assert.throws(
      () => expectRecord([], "test.path"),
      /Expected object at path test\.path, got object/,
    );
    assert.throws(
      () => expectRecord(null, "test"),
      /Expected object at path test, got object/,
    );
    assert.throws(
      () => expectRecord(42, "test"),
      /Expected object at path test, got number/,
    );
  });
});

test("expectArray", async (t) => {
  await t.test("returns value when it is an array", () => {
    const arr = [1, 2, 3];
    assert.equal(expectArray(arr, "test"), arr);
  });

  await t.test("throws when value is not an array", () => {
    assert.throws(
      () => expectArray({}, "test.path"),
      /Expected array at path test\.path, got object/,
    );
    assert.throws(
      () => expectArray(42, "test"),
      /Expected array at path test, got number/,
    );
  });
});

test("getProperty", async (t) => {
  await t.test("gets string property from record", () => {
    const obj = { foo: "bar" };
    assert.equal(getProperty(obj, "foo", ""), "bar");
  });

  await t.test("gets numeric index from array", () => {
    const arr = ["a", "b", "c"];
    assert.equal(getProperty(arr, 1, ""), "b");
  });

  await t.test("throws when accessing array with string key", () => {
    const arr = ["a", "b"];
    assert.throws(
      () => getProperty(arr, "foo", "test"),
      /Expected object at path test/,
    );
  });

  await t.test("throws when accessing record with numeric key", () => {
    const obj = { foo: "bar" };
    assert.throws(
      () => getProperty(obj, 0, "test"),
      /Expected array at path test/,
    );
  });
});

test("setProperty", async (t) => {
  await t.test("sets string property on record", () => {
    const obj: Record<string, unknown> = { foo: "old" };
    setProperty(obj, "foo", "new", "");
    assert.equal(obj.foo, "new");
  });

  await t.test("sets numeric index on array", () => {
    const arr = ["a", "b", "c"];
    setProperty(arr, 1, "x", "");
    assert.deepEqual(arr, ["a", "x", "c"]);
  });
});

test("setValue", async (t) => {
  await t.test("sets top-level property", () => {
    const obj: Record<string, unknown> = {};
    setValue(obj, ["foo"], "bar");
    assert.equal(obj.foo, "bar");
  });

  await t.test("sets nested property", () => {
    const obj: Record<string, unknown> = { nested: { deep: {} } };
    setValue(obj, ["nested", "deep", "value"], 42);
    assert.equal(
      ((obj.nested as Record<string, unknown>).deep as Record<string, number>)
        .value,
      42,
    );
  });

  await t.test("sets array element", () => {
    const obj: Record<string, unknown> = { tags: ["a", "b", "c"] };
    setValue(obj, ["tags", 1], "x");
    assert.deepEqual(obj.tags, ["a", "x", "c"]);
  });

  await t.test("creates missing intermediate objects", () => {
    const obj: Record<string, unknown> = {};
    setValue(obj, ["a", "b", "c"], "value");
    assert.equal(
      ((obj.a as Record<string, unknown>).b as Record<string, string>).c,
      "value",
    );
  });

  await t.test("creates missing intermediate arrays when next key is numeric", () => {
    const obj: Record<string, unknown> = {};
    setValue(obj, ["tags", 0], "first");
    assert.ok(Array.isArray(obj.tags));
    assert.deepEqual(obj.tags, ["first"]);
  });

  await t.test("throws when intermediate is not object or array", () => {
    const obj: Record<string, unknown> = { foo: "string" };
    assert.throws(
      () => setValue(obj, ["foo", "bar"], "value"),
      /Expected object or array at path foo, got string/,
    );
  });
});

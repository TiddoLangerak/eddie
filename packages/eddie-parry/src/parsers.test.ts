import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import {
  array,
  boolean,
  date,
  literal,
  nullable,
  number,
  object,
  oneOf,
  optional,
  string,
  tuple,
} from "./parsers.ts";
import { isErr, isOk } from "./types.ts";

describe("string()", () => {
  it("accepts string", () => {
    const result = string()("hello");
    assert.ok(isOk(result));
    assert.equal(result.value, "hello");
  });
  it("rejects non-string", () => {
    const result = string()(42);
    assert.ok(isErr(result));
    assert.match(result.error("x"), /x is not a string/);
  });
});

describe("number()", () => {
  it("accepts number", () => {
    const result = number()(42);
    assert.ok(isOk(result));
    assert.equal(result.value, 42);
  });
  it("rejects NaN", () => {
    const result = number()(Number.NaN);
    assert.ok(isErr(result));
  });
  it("rejects non-number", () => {
    const result = number()("42");
    assert.ok(isErr(result));
  });
});

describe("boolean()", () => {
  it("accepts true and false", () => {
    assert.ok(isOk(boolean()(true)));
    assert.ok(isOk(boolean()(false)));
  });
  it("rejects non-boolean", () => {
    assert.ok(isErr(boolean()(1)));
  });
});

describe("date()", () => {
  it("accepts Date instance", () => {
    const d = new Date();
    const result = date()(d);
    assert.ok(isOk(result));
    assert.equal(result.value, d);
  });
  it("rejects non-Date", () => {
    assert.ok(isErr(date()("2024-01-01")));
  });
});

describe("object()", () => {
  it("accepts object matching shape", () => {
    const parser = object({ a: string(), b: number() });
    const result = parser({ a: "x", b: 1 });
    assert.ok(isOk(result));
    assert.deepEqual(result.value, { a: "x", b: 1 });
  });
  it("rejects non-object", () => {
    const parser = object({ a: string() });
    const result = parser("nope");
    assert.ok(isErr(result));
    assert.match(result.error("root"), /root is not an object/);
  });
  it("rejects object with missing property", () => {
    const parser = object({ a: string(), b: number() });
    const result = parser({ a: "x" });
    assert.ok(isErr(result));
    assert.match(result.error("root"), /root\.b is not a number/);
  });
  it("accepts object with missing optional property", () => {
    const parser = object({ a: string(), b: optional(number()) });
    const result = parser({ a: "x" });
    assert.ok(isOk(result));
    assert.deepEqual(result.value, { a: "x", b: undefined });
  });
  it("reports path on nested failure", () => {
    const parser = object({ foo: object({ bar: number() }) });
    const result = parser({ foo: { bar: "not a number" } });
    assert.ok(isErr(result));
    assert.match(result.error("root"), /root\.foo\.bar/);
  });
  it("nested object with array and tuple", () => {
    const myParser = object({
      foo: object({
        bar: array(string()),
        baz: tuple(string(), number(), date()),
      }),
    });
    const d = new Date();
    const result = myParser({
      foo: {
        bar: ["a", "b"],
        baz: ["x", 1, d],
      },
    });
    assert.ok(isOk(result));
    assert.deepEqual(result.value.foo.bar, ["a", "b"]);
    assert.equal(result.value.foo.baz[0], "x");
    assert.equal(result.value.foo.baz[1], 1);
    assert.equal(result.value.foo.baz[2], d);
  });
});

describe("array()", () => {
  it("accepts empty array", () => {
    const result = array(string())([]);
    assert.ok(isOk(result));
    assert.deepEqual(result.value, []);
  });
  it("accepts array of parsed values", () => {
    const result = array(number())([1, 2, 3]);
    assert.ok(isOk(result));
    assert.deepEqual(result.value, [1, 2, 3]);
  });
  it("rejects non-array", () => {
    const result = array(string())("nope");
    assert.ok(isErr(result));
    assert.match(result.error("x"), /x is not an array/);
  });
  it("reports index on first failure", () => {
    const result = array(number())([1, "two", 3]);
    assert.ok(isErr(result));
    assert.match(result.error("arr"), /arr\[1\]/);
  });
});

describe("tuple()", () => {
  it("accepts matching tuple", () => {
    const result = tuple(string(), number())(["a", 1]);
    assert.ok(isOk(result));
    assert.deepEqual(result.value, ["a", 1]);
  });
  it("rejects wrong length", () => {
    const result = tuple(string(), number())(["a"]);
    assert.ok(isErr(result));
    assert.match(result.error("t"), /expected tuple of length 2/);
  });
  it("rejects wrong type at index", () => {
    const result = tuple(string(), number())(["a", "b"]);
    assert.ok(isErr(result));
    assert.match(result.error("t"), /t\[1\]/);
  });
});

describe("literal()", () => {
  it("accepts one of values", () => {
    const parser = literal("a", "b", "c");
    assert.ok(isOk(parser("a")));
    assert.ok(isOk(parser("b")));
    assert.ok(isErr(parser("d")));
  });
  it("accepts literal(undefined)", () => {
    const parser = literal(undefined);
    assert.ok(isOk(parser(undefined)));
    assert.ok(isErr(parser(null)));
  });
  it("accepts literal(null)", () => {
    const parser = literal(null);
    assert.ok(isOk(parser(null)));
    assert.ok(isErr(parser(undefined)));
  });
});

describe("oneOf()", () => {
  it("returns first successful parse", () => {
    const parser = oneOf(string(), number());
    const r1 = parser("hi");
    assert.ok(isOk(r1));
    assert.equal(r1.value, "hi");
    const r2 = parser(42);
    assert.ok(isOk(r2));
    assert.equal(r2.value, 42);
  });
  it("fails when no variant matches", () => {
    const parser = oneOf(string(), number());
    const result = parser(true);
    assert.ok(isErr(result));
    assert.match(result.error("v"), /did not match any variant/);
  });
});

describe("optional()", () => {
  it("accepts undefined", () => {
    const parser = optional(string());
    const result = parser(undefined);
    assert.ok(isOk(result));
    assert.equal(result.value, undefined);
  });
  it("accepts parsed value", () => {
    const parser = optional(string());
    const result = parser("hello");
    assert.ok(isOk(result));
    assert.equal(result.value, "hello");
  });
  it("rejects invalid value", () => {
    const parser = optional(string());
    assert.ok(isErr(parser(42)));
  });
});

describe("nullable()", () => {
  it("accepts null", () => {
    const parser = nullable(string());
    const result = parser(null);
    assert.ok(isOk(result));
    assert.equal(result.value, null);
  });
  it("accepts parsed value", () => {
    const parser = nullable(string());
    const result = parser("hello");
    assert.ok(isOk(result));
    assert.equal(result.value, "hello");
  });
  it("rejects invalid value", () => {
    const parser = nullable(string());
    assert.ok(isErr(parser(42)));
  });
});

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import {
  FormDataParseError,
  formString,
  formStringArray,
  formStringOrNull,
  parseFormData,
} from "./request.ts";

describe("formStringArray", () => {
  it("returns [] for undefined", () => {
    assert.deepEqual(formStringArray(undefined), []);
  });

  it("returns [] for null", () => {
    assert.deepEqual(formStringArray(null), []);
  });

  it("returns single-element array for string", () => {
    assert.deepEqual(formStringArray("a"), ["a"]);
  });

  it("returns array unchanged for string[]", () => {
    assert.deepEqual(formStringArray(["x", "y"]), ["x", "y"]);
  });
});

describe("formString", () => {
  it("returns string unchanged", () => {
    assert.equal(formString("hello"), "hello");
  });

  it("throws FormDataParseError for undefined", () => {
    assert.throws(
      () => formString(undefined),
      (err: unknown) =>
        err instanceof FormDataParseError &&
        err.message === "Missing required field",
    );
  });

  it("throws FormDataParseError for null", () => {
    assert.throws(
      () => formString(null),
      (err: unknown) =>
        err instanceof FormDataParseError &&
        err.message === "Missing required field",
    );
  });

  it("throws FormDataParseError for string[]", () => {
    assert.throws(
      () => formString(["a", "b"]),
      (err: unknown) =>
        err instanceof FormDataParseError &&
        err.message === "Expected single value, got multiple",
    );
  });
});

describe("formStringOrNull", () => {
  it("returns string unchanged", () => {
    assert.equal(formStringOrNull("hello"), "hello");
  });

  it("returns null for undefined", () => {
    assert.equal(formStringOrNull(undefined), null);
  });

  it("returns null for null", () => {
    assert.equal(formStringOrNull(null), null);
  });

  it("throws FormDataParseError for string[]", () => {
    assert.throws(
      () => formStringOrNull(["a"]),
      (err: unknown) =>
        err instanceof FormDataParseError &&
        err.message === "Expected single value or missing, got multiple",
    );
  });
});

describe("parseFormData", () => {
  it("parses single values as string", () => {
    const body = "file=main.bean&content=2024-01-01";
    const data = parseFormData(body);
    assert.equal(data.file, "main.bean");
    assert.equal(data.content, "2024-01-01");
  });

  it("parses repeated keys as string[]", () => {
    const body = "tag=a&tag=b";
    const data = parseFormData(body);
    assert.deepEqual(data.tag, ["a", "b"]);
  });
});

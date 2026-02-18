import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { FormDataParseError } from "./errors.ts";
import {
  formString,
  formStringArray,
  formStringOrNull,
  parseFormData,
} from "./request.ts";

describe("formStringArray", () => {
  it("returns [] for missing key", () => {
    assert.deepEqual(formStringArray({}, "x"), []);
  });

  it("returns single-element array for string", () => {
    assert.deepEqual(formStringArray({ a: "a" }, "a"), ["a"]);
  });

  it("returns array unchanged for string[]", () => {
    assert.deepEqual(formStringArray({ tag: ["x", "y"] }, "tag"), ["x", "y"]);
  });
});

describe("formString", () => {
  it("returns string for present key", () => {
    assert.equal(formString({ file: "main.bean" }, "file"), "main.bean");
  });

  it("throws FormDataParseError with field for missing key", () => {
    const record = {};
    try {
      formString(record, "file");
      assert.fail("expected throw");
    } catch (err) {
      assert.ok(err instanceof FormDataParseError);
      assert.equal((err as FormDataParseError).field, "file");
      assert.ok((err as FormDataParseError).message.includes("file"));
      assert.ok(
        (err as FormDataParseError).message.includes("Missing required field"),
      );
    }
  });

  it("throws FormDataParseError with field for string[]", () => {
    const record = { content: ["a", "b"] };
    try {
      formString(record, "content");
      assert.fail("expected throw");
    } catch (err) {
      assert.ok(err instanceof FormDataParseError);
      assert.equal((err as FormDataParseError).field, "content");
      assert.ok((err as FormDataParseError).message.includes("content"));
      assert.ok(
        (err as FormDataParseError).message.includes(
          "Expected single value, got multiple",
        ),
      );
    }
  });
});

describe("formStringOrNull", () => {
  it("returns string for present key", () => {
    assert.equal(formStringOrNull({ file: "x" }, "file"), "x");
  });

  it("returns null for missing key", () => {
    assert.equal(formStringOrNull({}, "file"), null);
  });

  it("throws FormDataParseError with field for string[]", () => {
    const record = { opt: ["a"] };
    try {
      formStringOrNull(record, "opt");
      assert.fail("expected throw");
    } catch (err) {
      assert.ok(err instanceof FormDataParseError);
      assert.equal((err as FormDataParseError).field, "opt");
      assert.ok((err as FormDataParseError).message.includes("opt"));
    }
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

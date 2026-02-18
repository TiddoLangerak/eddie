import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { FormDataParseError, HttpResponseError } from "./errors.ts";

describe("HttpResponseError", () => {
  it("sets statusCode and message", () => {
    const err = new HttpResponseError("Not found", 404);
    assert.equal(err.message, "Not found");
    assert.equal(err.statusCode, 404);
    assert.equal(err.name, "HttpResponseError");
  });
});

describe("FormDataParseError", () => {
  it("extends HttpResponseError with field and includes field in message", () => {
    const err = new FormDataParseError("file", "Missing required field");
    assert.ok(err instanceof HttpResponseError);
    assert.equal(err.field, "file");
    assert.equal(err.statusCode, 400);
    assert.ok(err.message.includes("file"));
    assert.ok(err.message.includes("Missing required field"));
  });
});

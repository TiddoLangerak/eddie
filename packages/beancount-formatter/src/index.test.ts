import { strict as assert } from "node:assert";
import { test } from "node:test";
import type { BeancountFile } from "@Tiddo/beancount-types";
import { formatBeancountFile } from "./index.js";

test("formatBeancountFile returns a string", () => {
  const file: BeancountFile = {
    directives: [],
  };
  const result = formatBeancountFile(file);
  assert.equal(typeof result, "string");
});

test("formatBeancountFile handles empty file", () => {
  const file: BeancountFile = {
    directives: [],
  };
  const result = formatBeancountFile(file);
  assert.equal(result, "");
});

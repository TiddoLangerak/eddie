import { test } from "node:test";
import { strict as assert } from "node:assert";
import type { BeancountFile, Transaction } from "./index.js";

test("BeancountFile type exists", () => {
  const file: BeancountFile = {
    directives: [],
  };
  assert.ok(file);
  assert.equal(file.directives.length, 0);
});

test("Transaction type exists", () => {
  const txn: Transaction = {
    type: "transaction",
    date: "2024-01-01",
    flag: "*",
    narration: "Test transaction",
    postings: [],
  };
  assert.equal(txn.type, "transaction");
});

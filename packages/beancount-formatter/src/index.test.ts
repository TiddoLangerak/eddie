import { strict as assert } from "node:assert";
import { test } from "node:test";
import { parseBeancount } from "@Tiddo/beancount-parser";
import type { BeancountFile } from "@Tiddo/beancount-types";
import { trimIndent } from "@Tiddo/eddie-utils/strings";
import { formatBeancountFile } from "./index.ts";

function assertParseFormatIdentity(input: string): void {
  const parsed = parseBeancount(input);
  const formatted = formatBeancountFile(parsed);
  assert.equal(formatted, input);
}

test("formatBeancountFile", (t) => {
  t.test("returns a string", () => {
    const file: BeancountFile = {
      directives: [],
    };
    const result = formatBeancountFile(file);
    assert.equal(typeof result, "string");
  });

  t.test("handles empty file", () => {
    const file: BeancountFile = {
      directives: [],
    };
    const result = formatBeancountFile(file);
    assert.equal(result, "");
  });
});

test("round-trip", {skip: true}, (t) => {
  t.test("parsing and formatting produces identical output", () => {
    assertParseFormatIdentity(
      trimIndent(`
        2024-01-01 * "Grocery shopping"
          Expenses:Food:Groceries  50.00 USD
          Assets:Bank:Checking
      `),
    );
  });

  t.test("empty file", () => {
    assertParseFormatIdentity("");
  });

  t.test("simple transaction with postings", () => {
    assertParseFormatIdentity(
      trimIndent(`
        2024-01-15 * "Salary"
          Income:Salary  0 USD
          Assets:Bank:Checking  3000.00 USD
      `),
    );
  });

  t.test("transaction with tags and links", () => {
    assertParseFormatIdentity(
      trimIndent(`
        2024-02-01 * "Coffee" #food #expense ^receipt-001
          Expenses:Food:Coffee  5.00 USD
          Assets:Wallet
      `),
    );
  });

  t.test("transaction with metadata", () => {
    assertParseFormatIdentity(
      trimIndent(`
        2024-02-10 * "Rent"
          expense: "monthly rent"
          Expenses:Housing:Rent  1200.00 USD
          Assets:Bank:Checking
      `),
    );
  });

  t.test("file with comments", () => {
    assertParseFormatIdentity(
      trimIndent(`
        ; Monthly groceries
        2024-01-20 * "Grocery shopping"
          Expenses:Food:Groceries  80.00 USD
          Assets:Bank:Checking
      `),
    );
  });

  t.test("multiple directives", () => {
    assertParseFormatIdentity(
      trimIndent(`
        2024-01-01 open Assets:Bank:Checking USD
        2024-01-01 open Expenses:Food
        2024-01-15 * "Transfer"
          Assets:Bank:Checking  -100.00 USD
          Assets:Wallet  100.00 USD
        2024-01-31 balance Assets:Bank:Checking 2900.00 USD
      `),
    );
  });

  t.test("cost and price on postings", () => {
    assertParseFormatIdentity(
      trimIndent(`
        2024-01-05 * "Buy shares"
          Assets:Investments:Stocks  10 HOOL {100.00 USD}
          Assets:Bank:Checking  -1000.00 USD
        2024-01-06 * "Sell with price"
          Assets:Bank:Checking  1200.00 USD @ 120.00 HOOL
          Assets:Investments:Stocks  -10 HOOL
      `),
    );
  });

  t.test("metadata on postings", () => {
    assertParseFormatIdentity(
      trimIndent(`
        2024-02-01 * "Payment"
          Expenses:Services  50.00 USD
            invoice: "INV-001"
          Assets:Bank:Checking  -50.00 USD
            cleared: TRUE
      `),
    );
  });

  t.test("inline comments", () => {
    assertParseFormatIdentity(
      trimIndent(`
        2024-01-10 * "Lunch" ; midday meal
          Expenses:Food  15.00 USD
          Assets:Wallet  -15.00 USD  ; cash payment
      `),
    );
  });

  t.test("trailing comment", () => {
    assertParseFormatIdentity(
      trimIndent(`
        2024-01-12 * "Transfer"
          Assets:Bank:Checking  -200.00 USD
          Assets:Savings  200.00 USD
        ; end of month savings
      `),
    );
  });

  t.test("comments for postings", () => {
    assertParseFormatIdentity(
      trimIndent(`
        2024-01-15 * "Split expense"
          ; grocery portion
          Expenses:Food:Groceries  30.00 USD
          ; household portion
          Expenses:Household  20.00 USD
          Assets:Bank:Checking  -50.00 USD
      `),
    );
  });

  t.test("comments for metadata", () => {
    assertParseFormatIdentity(
      trimIndent(`
        2024-02-05 * "Invoice"
          ; vendor reference
          invoice-number: "2024-002"
          Expenses:Office  500.00 USD
          Liabilities:Payable  -500.00 USD
      `),
    );
  });
});

import { strict as assert } from "node:assert";
import { describe, it, test } from "node:test";
import { parseBeancount } from "@Tiddo/beancount-parser";
import type {
  Balance,
  BeancountFile,
  Close,
  Commodity,
  Custom,
  Document,
  Event,
  Include,
  Note,
  Open,
  Pad,
  Plugin,
  Price,
  Query,
  Transaction,
} from "@Tiddo/beancount-types";
import { normalizeLineEndings } from "@Tiddo/eddie-utils/files";
import { trimIndent } from "@Tiddo/eddie-utils/strings";
import { formatBeancountFile } from "./index.ts";

function assertParseFormatIdentity(input: string): void {
  const parsed = parseBeancount(input);
  const formatted = formatBeancountFile(parsed);

  // Tolerate addition of trailing newline if input doesn't have one
  const normalizedInput = input.endsWith("\n") ? input : `${input}\n`;
  const normalizedFormatted = normalizeLineEndings(formatted);

  assert.equal(normalizedFormatted, normalizedInput);
}

describe("formatBeancountFile", () => {
  it("returns a string", () => {
    const file: BeancountFile = {
      directives: [],
      header: [],
      footer: [],
      metadata: {},
    };
    const result = formatBeancountFile(file);
    assert.equal(typeof result, "string");
  });

  it("handles empty file", () => {
    const file: BeancountFile = {
      directives: [],
      header: [],
      footer: [],
      metadata: {},
    };
    const result = formatBeancountFile(file);
    assert.equal(result, "");
  });

  it("formats simple transaction", () => {
    const transaction: Transaction = {
      type: "transaction",
      date: "2024-01-01",
      flag: "*",
      narration: "Test transaction",
      postings: [
        {
          account: "Assets:Checking",
          amount: { number: "100.00", currency: "USD" },
        },
        {
          account: "Income:Salary",
          amount: { number: "-100.00", currency: "USD" },
        },
      ],
    };

    const file: BeancountFile = {
      directives: [transaction],
      header: [],
      footer: [],
      metadata: {},
    };

    const result = formatBeancountFile(file);
    const expected = trimIndent(`
      2024-01-01 * "Test transaction"
        Assets:Checking  100.00 USD
        Income:Salary  -100.00 USD
    `);
    assert.equal(result, expected);
  });

  it("formats transaction with payee", () => {
    const transaction: Transaction = {
      type: "transaction",
      date: "2024-01-15",
      flag: "!",
      payee: "Coffee Shop",
      narration: "Morning coffee",
      postings: [
        {
          account: "Expenses:Food:Coffee",
          amount: { number: "4.50", currency: "USD" },
        },
        {
          account: "Assets:Cash",
        },
      ],
    };

    const file: BeancountFile = {
      directives: [transaction],
      header: [],
      footer: [],
      metadata: {},
    };

    const result = formatBeancountFile(file);
    const expected = trimIndent(`
      2024-01-15 ! "Coffee Shop" "Morning coffee"
        Expenses:Food:Coffee  4.50 USD
        Assets:Cash
    `);
    assert.equal(result, expected);
  });

  it("formats transaction with tags and links", () => {
    const transaction: Transaction = {
      type: "transaction",
      date: "2024-02-01",
      flag: "*",
      narration: "Rent payment",
      tags: ["rent", "housing"],
      links: ["invoice-2024-02"],
      postings: [
        {
          account: "Expenses:Rent",
          amount: { number: "1500.00", currency: "USD" },
        },
        {
          account: "Assets:Checking",
        },
      ],
    };

    const file: BeancountFile = {
      directives: [transaction],
      header: [],
      footer: [],
      metadata: {},
    };

    const result = formatBeancountFile(file);
    const expected = trimIndent(`
      2024-02-01 * "Rent payment" #rent #housing ^invoice-2024-02
        Expenses:Rent  1500.00 USD
        Assets:Checking
    `);
    assert.equal(result, expected);
  });

  it("formats transaction with cost and price", () => {
    const transaction: Transaction = {
      type: "transaction",
      date: "2024-03-01",
      flag: "*",
      narration: "Buy stock",
      postings: [
        {
          account: "Assets:Investments:Stock",
          amount: { number: "10", currency: "AAPL" },
          cost: { number: "150.00", currency: "USD" },
          price: { number: "151.00", currency: "USD" },
        },
        {
          account: "Assets:Checking",
          amount: { number: "-1500.00", currency: "USD" },
        },
      ],
    };

    const file: BeancountFile = {
      directives: [transaction],
      header: [],
      footer: [],
      metadata: {},
    };

    const result = formatBeancountFile(file);
    const expected = trimIndent(`
      2024-03-01 * "Buy stock"
        Assets:Investments:Stock  10 AAPL {150.00 USD} @ 151.00 USD
        Assets:Checking  -1500.00 USD
    `);
    assert.equal(result, expected);
  });

  it("formats transaction with metadata", () => {
    const transaction: Transaction = {
      type: "transaction",
      date: "2024-04-01",
      flag: "*",
      narration: "Invoice payment",
      metadata: {
        "invoice-id": "INV-001",
        "tax-deductible": true,
      },
      postings: [
        {
          account: "Expenses:Services",
          amount: { number: "500.00", currency: "USD" },
          metadata: {
            category: "consulting",
          },
        },
        {
          account: "Assets:Checking",
        },
      ],
    };

    const file: BeancountFile = {
      directives: [transaction],
      header: [],
      footer: [],
      metadata: {},
    };

    const result = formatBeancountFile(file);
    const expected = trimIndent(`
      2024-04-01 * "Invoice payment"
        invoice-id: "INV-001"
        tax-deductible: TRUE
        Expenses:Services  500.00 USD
          category: "consulting"
        Assets:Checking
    `);
    assert.equal(result, expected);
  });

  it("formats include directive", () => {
    const include: Include = {
      type: "include",
      filename: "ledgers/main.beancount",
      formatting: { header: [], footer: [], inlineComment: undefined },
    };

    const file: BeancountFile = {
      directives: [include],
      header: [],
      footer: [],
      metadata: {},
    };

    const result = formatBeancountFile(file);
    assert.equal(result, 'include "ledgers/main.beancount"');
  });

  it("formats plugin directive without config", () => {
    const plugin: Plugin = {
      type: "plugin",
      module: "beancount.plugins.importer",
      formatting: { header: [], footer: [], inlineComment: undefined },
    };

    const file: BeancountFile = {
      directives: [plugin],
      header: [],
      footer: [],
      metadata: {},
    };

    const result = formatBeancountFile(file);
    assert.equal(result, 'plugin "beancount.plugins.importer"');
  });

  it("formats plugin directive with config", () => {
    const plugin: Plugin = {
      type: "plugin",
      module: "beancount.plugins.other",
      config: "some_config",
      formatting: { header: [], footer: [], inlineComment: undefined },
    };

    const file: BeancountFile = {
      directives: [plugin],
      header: [],
      footer: [],
      metadata: {},
    };

    const result = formatBeancountFile(file);
    assert.equal(result, 'plugin "beancount.plugins.other" "some_config"');
  });

  it("formats balance directive", () => {
    const balance: Balance = {
      type: "balance",
      date: "2024-01-01",
      account: "Assets:Checking",
      amount: { number: "1000.00", currency: "USD" },
    };

    const file: BeancountFile = {
      directives: [balance],
      header: [],
      footer: [],
      metadata: {},
    };

    const result = formatBeancountFile(file);
    assert.equal(result, "2024-01-01 balance Assets:Checking 1000.00 USD");
  });

  it("formats open directive", () => {
    const open: Open = {
      type: "open",
      date: "2024-01-01",
      account: "Assets:Checking",
      currencies: ["USD", "EUR"],
    };

    const file: BeancountFile = {
      directives: [open],
      header: [],
      footer: [],
      metadata: {},
    };

    const result = formatBeancountFile(file);
    assert.equal(result, "2024-01-01 open Assets:Checking USD,EUR");
  });

  it("formats open directive without currencies", () => {
    const open: Open = {
      type: "open",
      date: "2024-01-01",
      account: "Assets:Checking",
    };

    const file: BeancountFile = {
      directives: [open],
      header: [],
      footer: [],
      metadata: {},
    };

    const result = formatBeancountFile(file);
    assert.equal(result, "2024-01-01 open Assets:Checking");
  });

  it("formats close directive", () => {
    const close: Close = {
      type: "close",
      date: "2024-12-31",
      account: "Assets:OldAccount",
    };

    const file: BeancountFile = {
      directives: [close],
      header: [],
      footer: [],
      metadata: {},
    };

    const result = formatBeancountFile(file);
    assert.equal(result, "2024-12-31 close Assets:OldAccount");
  });

  it("formats commodity directive", () => {
    const commodity: Commodity = {
      type: "commodity",
      date: "2024-01-01",
      currency: "AAPL",
    };

    const file: BeancountFile = {
      directives: [commodity],
      header: [],
      footer: [],
      metadata: {},
    };

    const result = formatBeancountFile(file);
    assert.equal(result, "2024-01-01 commodity AAPL");
  });

  it("formats pad directive", () => {
    const pad: Pad = {
      type: "pad",
      date: "2024-01-01",
      account: "Assets:Checking",
      sourceAccount: "Equity:Opening-Balances",
    };

    const file: BeancountFile = {
      directives: [pad],
      header: [],
      footer: [],
      metadata: {},
    };

    const result = formatBeancountFile(file);
    assert.equal(
      result,
      "2024-01-01 pad Assets:Checking Equity:Opening-Balances",
    );
  });

  it("formats note directive", () => {
    const note: Note = {
      type: "note",
      date: "2024-01-01",
      account: "Assets:Checking",
      comment: "This is a note",
    };

    const file: BeancountFile = {
      directives: [note],
      header: [],
      footer: [],
      metadata: {},
    };

    const result = formatBeancountFile(file);
    assert.equal(result, '2024-01-01 note Assets:Checking "This is a note"');
  });

  it("formats document directive", () => {
    const document: Document = {
      type: "document",
      date: "2024-01-01",
      account: "Assets:Checking",
      filename: "/path/to/statement.pdf",
    };

    const file: BeancountFile = {
      directives: [document],
      header: [],
      footer: [],
      metadata: {},
    };

    const result = formatBeancountFile(file);
    assert.equal(
      result,
      '2024-01-01 document Assets:Checking "/path/to/statement.pdf"',
    );
  });

  it("formats price directive", () => {
    const price: Price = {
      type: "price",
      date: "2024-01-01",
      currency: "AAPL",
      amount: { number: "150.00", currency: "USD" },
    };

    const file: BeancountFile = {
      directives: [price],
      header: [],
      footer: [],
      metadata: {},
    };

    const result = formatBeancountFile(file);
    assert.equal(result, "2024-01-01 price AAPL 150.00 USD");
  });

  it("formats event directive", () => {
    const event: Event = {
      type: "event",
      date: "2024-01-01",
      eventType: "location",
      description: "New York",
    };

    const file: BeancountFile = {
      directives: [event],
      header: [],
      footer: [],
      metadata: {},
    };

    const result = formatBeancountFile(file);
    assert.equal(result, '2024-01-01 event "location" "New York"');
  });

  it("formats query directive", () => {
    const query: Query = {
      type: "query",
      date: "2024-01-01",
      name: "expenses",
      queryString: "SELECT * FROM expenses WHERE account ~ 'Expenses:'",
    };

    const file: BeancountFile = {
      directives: [query],
      header: [],
      footer: [],
      metadata: {},
    };

    const result = formatBeancountFile(file);
    assert.equal(
      result,
      '2024-01-01 query "expenses" "SELECT * FROM expenses WHERE account ~ \'Expenses:\'"',
    );
  });

  it("formats custom directive", () => {
    const custom: Custom = {
      type: "custom",
      date: "2024-01-01",
      customType: "budget",
      values: ["Expenses:Food", "500.00", "USD"],
    };

    const file: BeancountFile = {
      directives: [custom],
      header: [],
      footer: [],
      metadata: {},
    };

    const result = formatBeancountFile(file);
    assert.equal(
      result,
      '2024-01-01 custom "budget" "Expenses:Food" "500.00" "USD"',
    );
  });

  it("formats file with header and footer comments", () => {
    const file: BeancountFile = {
      header: [
        { kind: "comment", comment: "Beancount file" },
        { kind: "comment", comment: "Generated on 2024-01-01" },
      ],
      directives: [
        {
          type: "commodity",
          date: "2024-01-01",
          currency: "USD",
        },
      ],
      footer: [{ kind: "comment", comment: "End of file" }],
      metadata: {},
    };

    const result = formatBeancountFile(file);
    const expected = trimIndent(`
      ; Beancount file
      ; Generated on 2024-01-01
      2024-01-01 commodity USD
      ; End of file
    `);
    assert.equal(result, expected);
  });

  it("escapes strings with quotes", () => {
    const transaction: Transaction = {
      type: "transaction",
      date: "2024-01-01",
      flag: "*",
      narration: 'Test with "quotes"',
      postings: [],
    };

    const file: BeancountFile = {
      directives: [transaction],
      header: [],
      footer: [],
      metadata: {},
    };

    const result = formatBeancountFile(file);
    assert.equal(result, '2024-01-01 * "Test with \\"quotes\\""');
  });

  it("escapes strings with backslashes", () => {
    const transaction: Transaction = {
      type: "transaction",
      date: "2024-01-01",
      flag: "*",
      narration: "Test with \\ backslash",
      postings: [],
    };

    const file: BeancountFile = {
      directives: [transaction],
      header: [],
      footer: [],
      metadata: {},
    };

    const result = formatBeancountFile(file);
    assert.equal(result, '2024-01-01 * "Test with \\\\ backslash"');
  });

  it("formats multiple directives", () => {
    const file: BeancountFile = {
      directives: [
        {
          type: "open",
          date: "2024-01-01",
          account: "Assets:Checking",
        },
        {
          type: "transaction",
          date: "2024-01-15",
          flag: "*",
          narration: "Deposit",
          postings: [
            {
              account: "Assets:Checking",
              amount: { number: "1000.00", currency: "USD" },
            },
            {
              account: "Income:Salary",
            },
          ],
        },
        {
          type: "balance",
          date: "2024-01-31",
          account: "Assets:Checking",
          amount: { number: "1000.00", currency: "USD" },
        },
      ],
      header: [],
      footer: [],
      metadata: {},
    };

    const result = formatBeancountFile(file);
    const expected = trimIndent(`
      2024-01-01 open Assets:Checking
      2024-01-15 * "Deposit"
        Assets:Checking  1000.00 USD
        Income:Salary
      2024-01-31 balance Assets:Checking 1000.00 USD
    `);
    assert.equal(result, expected);
  });

  it("formats transaction with inline comment", () => {
    const transaction: Transaction = {
      type: "transaction",
      date: "2024-01-01",
      flag: "*",
      narration: "Grocery shopping",
      postings: [
        {
          account: "Expenses:Food:Groceries",
          amount: { number: "50.00", currency: "USD" },
        },
        {
          account: "Assets:Bank:Checking",
        },
      ],
      formatting: {
        header: [],
        footer: [],
        inlineComment: "weekly groceries",
      },
    };

    const file: BeancountFile = {
      directives: [transaction],
      header: [],
      footer: [],
      metadata: {},
    };

    const result = formatBeancountFile(file);
    const expected = trimIndent(`
      2024-01-01 * "Grocery shopping" ; weekly groceries
        Expenses:Food:Groceries  50.00 USD
        Assets:Bank:Checking
    `);
    assert.equal(result, expected);
  });
});

test("round-trip", (t) => {
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

  t.test("double semicolon comments", () => {
    assertParseFormatIdentity(
      trimIndent(`
        ;; Section header
        2024-01-01 open Assets:Bank:Checking
        ;; Another comment
      `),
    );
  });

  t.test("include directive", () => {
    assertParseFormatIdentity('include "ledgers/main.beancount"\n');
  });

  t.test("plugin directive without config", () => {
    assertParseFormatIdentity('plugin "beancount.plugins.importer"\n');
  });

  t.test("plugin directive with config", () => {
    assertParseFormatIdentity(
      'plugin "beancount.plugins.other" "some_config"\n',
    );
  });

  t.test("include and plugin with other directives", () => {
    assertParseFormatIdentity(
      trimIndent(`
        include "ledgers/accounts.beancount"
        plugin "beancount.plugins.importer"
        2024-01-01 open Assets:Bank:Checking USD
        2024-01-15 * "First transaction"
          Assets:Bank:Checking  100.00 USD
          Income:Salary  -100.00 USD
      `),
    );
  });
});

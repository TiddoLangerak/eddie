import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import type { CommentOrBlank } from "@Tiddo/beancount-types";
import { type ParseError, parseBeancount } from "./index.ts";

describe("parseBeancount", () => {
  it("returns a BeancountFile", () => {
    const result = parseBeancount("");
    assert.ok(result);
    assert.ok(Array.isArray(result.directives));
  });

  it("handles simple input", () => {
    const input = "\n";
    const result = parseBeancount(input);
    assert.equal(result.directives.length, 0);
    assert.equal(result.metadata?.lineCount, 2);
  });

  it("parses a complete transaction", () => {
    const input = `2024-01-15 * "Payee" "Narration"
  Assets:Bank  -100 USD
  Expenses:Food  100 USD
`;
    const result = parseBeancount(input);
    assert.equal(result.directives.length, 1);
    const dir = result.directives[0];
    assert.equal(dir.type, "transaction");
    if (dir.type === "transaction") {
      assert.equal(dir.date, "2024-01-15");
      assert.equal(dir.flag, "*");
      assert.equal(dir.payee, "Payee");
      assert.equal(dir.narration, "Narration");
      assert.equal(dir.postings.length, 2);
      assert.equal(dir.postings[0].account, "Assets:Bank");
      assert.ok(dir.postings[0].amount);
      assert.equal(dir.postings[0].amount?.number, "-100");
      assert.equal(dir.postings[0].amount?.currency, "USD");
      assert.equal(dir.postings[1].account, "Expenses:Food");
      assert.equal(dir.postings[1].amount?.number, "100");
    }
  });

  it("parses open and close directives", () => {
    const input = `2024-01-01 open Assets:Bank USD
2024-12-31 close Assets:Bank
`;
    const result = parseBeancount(input);
    assert.equal(result.directives.length, 2);
    assert.equal(result.directives[0].type, "open");
    if (result.directives[0].type === "open") {
      assert.equal(result.directives[0].account, "Assets:Bank");
      assert.deepEqual(result.directives[0].currencies, ["USD"]);
    }
    assert.equal(result.directives[1].type, "close");
    if (result.directives[1].type === "close") {
      assert.equal(result.directives[1].account, "Assets:Bank");
    }
  });

  it("parses balance directive", () => {
    const input = "2024-01-31 balance Assets:Bank 1000.50 USD\n";
    const result = parseBeancount(input);
    assert.equal(result.directives.length, 1);
    assert.equal(result.directives[0].type, "balance");
    if (result.directives[0].type === "balance") {
      assert.equal(result.directives[0].account, "Assets:Bank");
      assert.equal(result.directives[0].amount.number, "1000.50");
      assert.equal(result.directives[0].amount.currency, "USD");
    }
  });

  it("parses include directive", () => {
    const input = 'include "ledgers/main.beancount"\n';
    const result = parseBeancount(input);
    assert.equal(result.directives.length, 1);
    assert.equal(result.directives[0].type, "include");
    if (result.directives[0].type === "include") {
      assert.equal(result.directives[0].filename, "ledgers/main.beancount");
    }
  });

  it("parses plugin directive with and without config", () => {
    const input = `plugin "beancount.plugins.importer"
plugin "beancount.plugins.other" "some_config"
`;
    const result = parseBeancount(input);
    assert.equal(result.directives.length, 2);
    assert.equal(result.directives[0].type, "plugin");
    assert.equal(result.directives[1].type, "plugin");
    if (result.directives[0].type === "plugin") {
      assert.equal(result.directives[0].module, "beancount.plugins.importer");
      assert.equal(result.directives[0].config, undefined);
    }
    if (result.directives[1].type === "plugin") {
      assert.equal(result.directives[1].module, "beancount.plugins.other");
      assert.equal(result.directives[1].config, "some_config");
    }
  });

  it("parses commodity and price", () => {
    const input = `2024-01-01 commodity USD
2024-01-01 price USD 1.2 CAD
`;
    const result = parseBeancount(input);
    assert.equal(result.directives.length, 2);
    assert.equal(result.directives[0].type, "commodity");
    assert.equal(result.directives[1].type, "price");
    if (result.directives[1].type === "price") {
      assert.equal(result.directives[1].currency, "USD");
      assert.equal(result.directives[1].amount.number, "1.2");
      assert.equal(result.directives[1].amount.currency, "CAD");
    }
  });

  it("preserves the footer", () => {
    const input = `2024-01-01 open Assets:Bank
; footer
`;
    const file = parseBeancount(input);
    assert.equal(file.directives.length, 1);
    assert.ok(
      file.footer.some(
        (x: CommentOrBlank) =>
          x.kind === "comment" && x.comment.includes("footer"),
      ),
    );
  });

  it("throws when input has trailing unparseable content", () => {
    assert.throws(
      () => parseBeancount("not-a-date open X\n"),
      (err: ParseError) => {
        assert.ok(err.message.length > 0);
        assert.ok(typeof err.line === "number");
        assert.ok(typeof err.column === "number");
        return true;
      },
    );
  });
});

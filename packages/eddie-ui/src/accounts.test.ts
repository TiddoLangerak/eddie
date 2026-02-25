import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import type { BeancountFile } from "@tiddo/beancount-types";
import {
  extractAccountsFromFile,
  getAccountsFromDirective,
} from "./accounts.ts";

describe("getAccountsFromDirective", () => {
  it("returns posting accounts for transaction", () => {
    const accounts = getAccountsFromDirective({
      type: "transaction",
      date: "2024-01-15",
      flag: "*",
      narration: "Test",
      tags: [],
      links: [],
      postings: [
        {
          account: "Expenses:Groceries",
          formatting: {
            header: [],
            footer: [],
            inlineComment: undefined,
          },
        },
        {
          account: "Assets:Checking",
          formatting: {
            header: [],
            footer: [],
            inlineComment: undefined,
          },
        },
      ],
      metadata: {},
      metadataHeader: [],
      formatting: { header: [], footer: [], inlineComment: undefined },
    });
    assert.deepEqual(accounts, ["Expenses:Groceries", "Assets:Checking"]);
  });

  it("returns empty array for commodity directive", () => {
    const accounts = getAccountsFromDirective({
      type: "commodity",
      date: "2024-01-01",
      commodity: "USD",
      formatting: { header: [], footer: [], inlineComment: undefined },
    });
    assert.deepEqual(accounts, []);
  });
});

describe("extractAccountsFromFile", () => {
  it("returns unique accounts from open, postings, balance, pad", () => {
    const model: BeancountFile = {
      directives: [
        {
          type: "open",
          date: "2024-01-01",
          account: "Assets:Checking",
          commodities: ["USD"],
          formatting: { header: [], footer: [], inlineComment: undefined },
        },
        {
          type: "transaction",
          date: "2024-01-15",
          flag: "*",
          narration: "Test",
          tags: [],
          links: [],
          postings: [
            {
              account: "Expenses:Groceries",
              formatting: {
                header: [],
                footer: [],
                inlineComment: undefined,
              },
            },
            {
              account: "Assets:Checking",
              formatting: {
                header: [],
                footer: [],
                inlineComment: undefined,
              },
            },
          ],
          metadata: {},
          metadataHeader: [],
          formatting: { header: [], footer: [], inlineComment: undefined },
        },
        {
          type: "balance",
          date: "2024-01-31",
          account: "Assets:Checking",
          amount: { number: "0", commodity: "USD" },
          formatting: { header: [], footer: [], inlineComment: undefined },
        },
        {
          type: "pad",
          date: "2024-02-01",
          account: "Assets:Receivables",
          sourceAccount: "Expenses:Unknown",
          formatting: { header: [], footer: [], inlineComment: undefined },
        },
      ],
      header: [],
      footer: [],
      metadata: {},
    };
    const accounts = extractAccountsFromFile(model);
    assert.deepEqual(accounts, [
      "Assets:Checking",
      "Assets:Receivables",
      "Expenses:Groceries",
      "Expenses:Unknown",
    ]);
  });

  it("returns empty array for file with no account-bearing directives", () => {
    const model: BeancountFile = {
      directives: [
        {
          type: "commodity",
          date: "2024-01-01",
          commodity: "USD",
          formatting: { header: [], footer: [], inlineComment: undefined },
        },
      ],
      header: [],
      footer: [],
      metadata: {},
    };
    const accounts = extractAccountsFromFile(model);
    assert.deepEqual(accounts, []);
  });
});

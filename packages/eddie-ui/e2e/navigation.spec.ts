import { expect, test } from "@playwright/test";
import {
  clearField,
  expectFieldText,
  expectFocused,
  focusFieldAtEnd,
  getField,
  getFieldStartingWith,
  getPendingField,
  getPostingRow,
  getRow,
  loadTestFileContent,
  typeInField,
} from "./helpers.ts";

test.describe("Basic field navigation", () => {
  test("space in multi-field group moves to next field when at end", async ({
    page,
  }) => {
    await using _file = await loadTestFileContent(
      page,
      `
      2024-01-15 * "Test"
        Assets:Checking  100.00 USD
      `,
    );

    const row = getPostingRow(page, { directive: 0, posting: 0 });
    const amountNumber = getField(row, "amount-number");
    const amountCommodity = getField(row, "amount-commodity");

    await focusFieldAtEnd(amountNumber);
    await amountNumber.press("Space");

    await expectFocused(amountCommodity);
  });

  test("space in single-field group moves to pending when it is the last field", async ({
    page,
  }) => {
    await using _file = await loadTestFileContent(
      page,
      `
      2024-01-15 * "Test" #mytag
        Assets:Checking  100.00 USD
      `,
    );

    const row = getRow(page, 0).first();
    const tagField = getFieldStartingWith(row, "tags").first();
    const pending = getPendingField(row);

    await focusFieldAtEnd(tagField);
    await tagField.press("Space");

    await expectFocused(pending);
  });

  test("space in last field of group moves to pending", async ({ page }) => {
    await using _file = await loadTestFileContent(
      page,
      `
      2024-01-15 * "Test"
        Assets:Checking  100.00 USD
      `,
    );

    const row = getPostingRow(page, { directive: 0, posting: 0 });
    const commodity = getField(row, "amount-commodity");
    const pending = getPendingField(row);

    await focusFieldAtEnd(commodity);
    await commodity.press("Space");

    await expectFocused(pending);
  });

  test("tab in multi-field group moves to next field", async ({ page }) => {
    await using _file = await loadTestFileContent(
      page,
      `
      2024-01-15 * "Test"
        Assets:Checking  100.00 USD
      `,
    );

    const row = getPostingRow(page, { directive: 0, posting: 0 });
    const amountNumber = getField(row, "amount-number");
    const amountCommodity = getField(row, "amount-commodity");

    await focusFieldAtEnd(amountNumber);
    await amountNumber.press("Tab");

    await expectFocused(amountCommodity);
  });

  test("arrow right at end moves to next field", async ({ page }) => {
    await using _file = await loadTestFileContent(
      page,
      `
      2024-01-15 * "Test"
        Assets:Checking  100.00 USD
      `,
    );

    const row = getPostingRow(page, { directive: 0, posting: 0 });
    const amountNumber = getField(row, "amount-number");
    const amountCommodity = getField(row, "amount-commodity");

    await focusFieldAtEnd(amountNumber);
    await amountNumber.press("ArrowRight");

    await expectFocused(amountCommodity);
  });

  test("arrow left at start moves to previous field", async ({ page }) => {
    await using _file = await loadTestFileContent(
      page,
      `
      2024-01-15 * "Test"
        Assets:Checking  100.00 USD
      `,
    );

    const row = getPostingRow(page, { directive: 0, posting: 0 });
    const amountNumber = getField(row, "amount-number");
    const amountCommodity = getField(row, "amount-commodity");

    await amountCommodity.click();
    await amountCommodity.press("Home");
    await amountCommodity.press("ArrowLeft");

    await expectFocused(amountNumber);
  });
});

test.describe("Trigger characters", () => {
  test("@ in pending creates price field", async ({ page }) => {
    await using _file = await loadTestFileContent(
      page,
      `
      2024-01-15 * "Test"
        Assets:Checking  100.00 USD
      `,
    );

    const row = getPostingRow(page, { directive: 0, posting: 0 });
    const pending = getPendingField(row);
    const commodity = getField(row, "amount-commodity");

    await focusFieldAtEnd(commodity);
    await commodity.press("Space");
    await expectFocused(pending);

    await pending.press("@");
    const priceNumber = getField(row, "price-number");
    await expectFocused(priceNumber);
  });

  test("{ in pending creates cost field", async ({ page }) => {
    await using _file = await loadTestFileContent(
      page,
      `
      2024-01-15 * "Test"
        Assets:Checking  100.00 USD
      `,
    );

    const row = getPostingRow(page, { directive: 0, posting: 0 });
    const pending = getPendingField(row);
    const commodity = getField(row, "amount-commodity");

    await focusFieldAtEnd(commodity);
    await commodity.press("Space");
    await pending.press("{");

    const costNumber = getField(row, "cost-number");
    await expectFocused(costNumber);
  });

  test("# in pending creates tag field", async ({ page }) => {
    await using _file = await loadTestFileContent(
      page,
      `
      2024-01-15 * "Test"
        Assets:Checking  100.00 USD
      `,
    );

    const row = getPostingRow(page, { directive: 0, posting: 0 });
    const pending = getPendingField(row);
    const commodity = getField(row, "amount-commodity");

    await focusFieldAtEnd(commodity);
    await commodity.press("Space");
    await pending.press("#");

    const tagField = getFieldStartingWith(row, "tags");
    await expect(tagField.first()).toBeFocused();
  });

  test("^ in pending creates link field", async ({ page }) => {
    await using _file = await loadTestFileContent(
      page,
      `
      2024-01-15 * "Test"
        Assets:Checking  100.00 USD
      `,
    );

    const row = getPostingRow(page, { directive: 0, posting: 0 });
    const pending = getPendingField(row);
    const commodity = getField(row, "amount-commodity");

    await focusFieldAtEnd(commodity);
    await commodity.press("Space");
    await pending.press("^");

    const linkField = getFieldStartingWith(row, "links");
    await expect(linkField.first()).toBeFocused();
  });

  test("; in pending creates inline-comment field", async ({ page }) => {
    await using _file = await loadTestFileContent(
      page,
      `
      2024-01-15 * "Test"
        Assets:Checking  100.00 USD
      `,
    );

    const row = getPostingRow(page, { directive: 0, posting: 0 });
    const pending = getPendingField(row);
    const commodity = getField(row, "amount-commodity");

    await focusFieldAtEnd(commodity);
    await commodity.press("Space");
    await pending.press(";");

    const commentField = getField(row, "inline-comment");
    await expectFocused(commentField);
  });
});

test.describe("Cost field behavior (suffix groups)", () => {
  test("typing } exits cost group to pending", async ({ page }) => {
    await using _file = await loadTestFileContent(
      page,
      `
      2024-01-15 * "Test"
        Assets:Checking  100.00 USD
      `,
    );

    const row = getPostingRow(page, { directive: 0, posting: 0 });
    const pending = getPendingField(row);
    const commodity = getField(row, "amount-commodity");

    await focusFieldAtEnd(commodity);
    await commodity.press("Space");
    await pending.press("{");

    const costNumber = getField(row, "cost-number");
    await typeInField(costNumber, "10");
    await costNumber.press("Space");

    const costCommodity = getField(row, "cost-commodity");
    await expectFocused(costCommodity);
    await typeInField(costCommodity, "USD");
    await costCommodity.press("}");

    await expectFocused(pending);
  });

  test("space within cost group moves between fields, not to pending", async ({
    page,
  }) => {
    await using _file = await loadTestFileContent(
      page,
      `
      2024-01-15 * "Test"
        Assets:Checking  100.00 USD
      `,
    );

    const row = getPostingRow(page, { directive: 0, posting: 0 });
    const pending = getPendingField(row);
    const commodity = getField(row, "amount-commodity");

    await focusFieldAtEnd(commodity);
    await commodity.press("Space");
    await pending.press("{");

    const costNumber = getField(row, "cost-number");
    await typeInField(costNumber, "10");
    await costNumber.press("Space");

    const costCommodity = getField(row, "cost-commodity");
    await expectFocused(costCommodity);
  });

  test("space at end of cost-commodity stays within cost group", async ({
    page,
  }) => {
    await using _file = await loadTestFileContent(
      page,
      `
      2024-01-15 * "Test"
        Assets:Checking  100.00 USD {10 EUR}
      `,
    );

    const row = getPostingRow(page, { directive: 0, posting: 0 });
    const costCommodity = getField(row, "cost-commodity");

    await focusFieldAtEnd(costCommodity);
    await costCommodity.press("Space");

    await expectFocused(costCommodity);
  });

  test("tab exits cost group", async ({ page }) => {
    await using _file = await loadTestFileContent(
      page,
      `
      2024-01-15 * "Test"
        Assets:Checking  100.00 USD
      `,
    );

    const row = getPostingRow(page, { directive: 0, posting: 0 });
    const pending = getPendingField(row);
    const commodity = getField(row, "amount-commodity");

    await focusFieldAtEnd(commodity);
    await commodity.press("Space");
    await pending.press("{");

    const costNumber = getField(row, "cost-number");
    await typeInField(costNumber, "10");
    await costNumber.press("Tab");

    const costCommodity = getField(row, "cost-commodity");
    await expectFocused(costCommodity);
    await typeInField(costCommodity, "USD");
    await costCommodity.press("Tab");

    await expectFocused(pending);
  });
});

test.describe("Whitespace-allowed fields (freetext)", () => {
  test("space is allowed in narration field", async ({ page }) => {
    await using _file = await loadTestFileContent(
      page,
      `
      2024-01-15 * "Test"
        Assets:Checking  100.00 USD
      `,
    );

    const row = getRow(page, 0).first();
    const narration = getField(row, "narration");

    await clearField(narration);
    await typeInField(narration, "hello world");

    await expectFieldText(narration, "hello world");
  });

  test("tab from narration moves to pending when valid next group exists", async ({
    page,
  }) => {
    await using _file = await loadTestFileContent(
      page,
      `
      2024-01-15 * "Test"
        Assets:Checking  100.00 USD
      `,
    );

    const row = getRow(page, 0).first();
    const narration = getField(row, "narration");
    const pending = getPendingField(row);

    await focusFieldAtEnd(narration);
    await narration.press("Tab");

    await expectFocused(pending);
  });

  test("tab from inline-comment does not exit (last field)", async ({
    page,
  }) => {
    await using _file = await loadTestFileContent(
      page,
      `
      2024-01-15 * "Test"
        Assets:Checking  100.00 USD
      `,
    );

    const row = getPostingRow(page, { directive: 0, posting: 0 });
    const pending = getPendingField(row);
    const commodity = getField(row, "amount-commodity");

    await focusFieldAtEnd(commodity);
    await commodity.press("Space");
    await pending.press(";");

    const comment = getField(row, "inline-comment");
    await typeInField(comment, "test comment");
    await comment.press("Tab");

    await expectFocused(comment);
  });
});

test.describe("Repeatable fields", () => {
  test("typing # while in tag field creates new tag", async ({ page }) => {
    await using _file = await loadTestFileContent(
      page,
      `
      2024-01-15 * "Test"
        Assets:Checking  100.00 USD
      `,
    );

    const row = getPostingRow(page, { directive: 0, posting: 0 });
    const pending = getPendingField(row);
    const commodity = getField(row, "amount-commodity");

    await focusFieldAtEnd(commodity);
    await commodity.press("Space");
    await pending.press("#");

    const firstTag = getFieldStartingWith(row, "tags").first();
    await typeInField(firstTag, "first");
    await firstTag.press("Space");
    await pending.press("#");

    const allTags = getFieldStartingWith(row, "tags");
    await expect(allTags).toHaveCount(2);
    await expect(allTags.last()).toBeFocused();
  });

  test("typing ^ while in link field creates new link", async ({ page }) => {
    await using _file = await loadTestFileContent(
      page,
      `
      2024-01-15 * "Test"
        Assets:Checking  100.00 USD
      `,
    );

    const row = getPostingRow(page, { directive: 0, posting: 0 });
    const pending = getPendingField(row);
    const commodity = getField(row, "amount-commodity");

    await focusFieldAtEnd(commodity);
    await commodity.press("Space");
    await pending.press("^");

    const firstLink = getFieldStartingWith(row, "links").first();
    await typeInField(firstLink, "first");
    await firstLink.press("Space");
    await pending.press("^");

    const allLinks = getFieldStartingWith(row, "links");
    await expect(allLinks).toHaveCount(2);
    await expect(allLinks.last()).toBeFocused();
  });

  test("new repeatable fields are inserted after last instance", async ({
    page,
  }) => {
    await using _file = await loadTestFileContent(
      page,
      `
      2024-01-15 * "Test"
        Assets:Checking  100.00 USD
      `,
    );

    const row = getPostingRow(page, { directive: 0, posting: 0 });
    const pending = getPendingField(row);
    const commodity = getField(row, "amount-commodity");

    await focusFieldAtEnd(commodity);
    await commodity.press("Space");

    await pending.press("#");
    const tag1 = getFieldStartingWith(row, "tags").first();
    await typeInField(tag1, "tag1");
    await tag1.press("Space");

    await pending.press("^");
    const link1 = getFieldStartingWith(row, "links").first();
    await typeInField(link1, "link1");
    await link1.press("Space");

    await pending.press("#");

    const tags = getFieldStartingWith(row, "tags");
    const links = getFieldStartingWith(row, "links");

    await expect(tags).toHaveCount(2);
    await expect(links).toHaveCount(1);

    const allFields = row.locator('[data-field][contenteditable="true"]');
    const fieldNames: string[] = [];
    for (const field of await allFields.all()) {
      const name = await field.getAttribute("data-field");
      if (name && (name.startsWith("tags") || name.startsWith("links"))) {
        fieldNames.push(name);
      }
    }

    expect(fieldNames.filter((n) => n.startsWith("tags")).length).toBe(2);
    expect(fieldNames.filter((n) => n.startsWith("links")).length).toBe(1);
  });
});

test.describe("Schema-ordered insertion", () => {
  test("@ trigger inserts price before existing link", async ({ page }) => {
    await using _file = await loadTestFileContent(
      page,
      `
      2024-01-15 * "Test"
        Assets:Checking  100.00 USD
      `,
    );

    const row = getPostingRow(page, { directive: 0, posting: 0 });
    const pending = getPendingField(row);
    const commodity = getField(row, "amount-commodity");

    await focusFieldAtEnd(commodity);
    await commodity.press("Space");
    await pending.press("^");

    const link = getFieldStartingWith(row, "links").first();
    await typeInField(link, "my-link");
    await link.press("Space");

    await pending.press("@");

    const priceNumber = getField(row, "price-number");
    await expectFocused(priceNumber);

    const allFields = row.locator('[data-field][contenteditable="true"]');
    const fieldOrder: string[] = [];
    for (const field of await allFields.all()) {
      const name = await field.getAttribute("data-field");
      if (name) fieldOrder.push(name);
    }

    const priceIdx = fieldOrder.indexOf("price-number");
    const linkIdx = fieldOrder.findIndex((n) => n.startsWith("links"));
    expect(priceIdx).toBeLessThan(linkIdx);
  });

  test("{ trigger inserts cost before existing price", async ({ page }) => {
    await using _file = await loadTestFileContent(
      page,
      `
      2024-01-15 * "Test"
        Assets:Checking  100.00 USD
      `,
    );

    const row = getPostingRow(page, { directive: 0, posting: 0 });
    const pending = getPendingField(row);
    const commodity = getField(row, "amount-commodity");

    await focusFieldAtEnd(commodity);
    await commodity.press("Space");
    await pending.press("@");

    const priceNumber = getField(row, "price-number");
    await typeInField(priceNumber, "15");
    await priceNumber.press("Space");

    const priceCommodity = getField(row, "price-commodity");
    await typeInField(priceCommodity, "EUR");
    await priceCommodity.press("Space");

    await pending.press("{");

    const costNumber = getField(row, "cost-number");
    await expectFocused(costNumber);

    const allFields = row.locator('[data-field][contenteditable="true"]');
    const fieldOrder: string[] = [];
    for (const field of await allFields.all()) {
      const name = await field.getAttribute("data-field");
      if (name) fieldOrder.push(name);
    }

    const costIdx = fieldOrder.indexOf("cost-number");
    const priceIdx = fieldOrder.indexOf("price-number");
    expect(costIdx).toBeLessThan(priceIdx);
  });
});

test.describe("Payee/Narration ambiguous fields", () => {
  test("tab from payee moves to narration", async ({ page }) => {
    await using _file = await loadTestFileContent(
      page,
      `
      2024-01-15 * "The Payee" "The narration"
        Assets:Checking  100.00 USD
      `,
    );

    const row = getRow(page, 0).first();
    const payee = getField(row, "payee");
    const narration = getField(row, "narration");

    await focusFieldAtEnd(payee);
    await payee.press("Tab");

    await expectFocused(narration);
  });

  test("typing in pending with narration converts it to payee and creates new narration", async ({
    page,
  }) => {
    await using _file = await loadTestFileContent(
      page,
      `
      2024-01-15 * "Narration only"
        Assets:Checking  100.00 USD
      `,
    );

    const row = getRow(page, 0).first();
    const pending = getPendingField(row);
    const narration = getField(row, "narration");

    await focusFieldAtEnd(narration);
    await narration.press("Tab");
    await expectFocused(pending);

    await pending.press("N");

    const payee = getField(row, "payee");
    const newNarration = getField(row, "narration");

    await expect(payee).toBeVisible();
    await expect(newNarration).toBeVisible();
    await expectFocused(newNarration);
    await expectFieldText(newNarration, "N");
  });
});

test.describe("Enter key suppression", () => {
  test("Enter does not create newlines in fields", async ({ page }) => {
    await using _file = await loadTestFileContent(
      page,
      `
      2024-01-15 * "Test"
        Assets:Checking  100.00 USD
      `,
    );

    const row = getRow(page, 0);
    const narration = getField(row, "narration");

    await clearField(narration);
    await typeInField(narration, "line1");
    await narration.press("Enter");
    await typeInField(narration, "line2");

    const text = await narration.textContent();
    expect(text).not.toContain("\n");
    expect(text).toBe("line1line2");
  });
});

test.describe("Commodity uppercase", () => {
  test("lowercase letters are converted to uppercase in commodity fields", async ({
    page,
  }) => {
    await using _file = await loadTestFileContent(
      page,
      `
      2024-01-15 * "Test"
        Assets:Checking  100.00 USD
      `,
    );

    const row = getPostingRow(page, { directive: 0, posting: 0 });
    const pending = getPendingField(row);
    const commodity = getField(row, "amount-commodity");

    await focusFieldAtEnd(commodity);
    await commodity.press("Space");
    await pending.press("{");

    const costCommodity = getField(row, "cost-commodity");
    await typeInField(costCommodity, "usd");

    await expectFieldText(costCommodity, "USD");
  });
});

test.describe("Field trimming", () => {
  test("fields are trimmed when exiting", async ({ page }) => {
    await using _file = await loadTestFileContent(
      page,
      `
      2024-01-15 * "Test"
        Assets:Checking  100.00 USD
      `,
    );

    const row = getPostingRow(page, { directive: 0, posting: 0 });
    const account = getField(row, "account");
    const amountNumber = getField(row, "amount-number");

    await clearField(account);
    await typeInField(account, "  Assets:Test  ");
    await account.press("Tab");

    await expectFocused(amountNumber);
    await expectFieldText(account, "Assets:Test");
  });
});

test.describe("Backspace behavior", () => {
  test("backspace on empty field within group moves to previous field", async ({
    page,
  }) => {
    await using _file = await loadTestFileContent(
      page,
      `
      2024-01-15 * "Test"
        Assets:Checking  100.00 USD
      `,
    );

    const row = getPostingRow(page, { directive: 0, posting: 0 });
    const pending = getPendingField(row);
    const commodity = getField(row, "amount-commodity");

    await focusFieldAtEnd(commodity);
    await commodity.press("Space");
    await pending.press("{");

    const costNumber = getField(row, "cost-number");
    await typeInField(costNumber, "10");
    await costNumber.press("Space");

    const costCommodity = getField(row, "cost-commodity");
    await clearField(costCommodity);
    await costCommodity.press("Backspace");

    await expectFocused(costNumber);
  });
});

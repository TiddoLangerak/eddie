import { expect, test } from "@playwright/test";
import {
  clearField,
  expectFieldText,
  expectFocused,
  focusFieldAtEnd,
  focusFieldAtStart,
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

test.describe("Enter key behavior in fields", () => {
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

    const text = await narration.textContent();
    expect(text).not.toContain("\n");
    expect(text).toBe("line1");
  });
});

test.describe("Enter key creates new rows", () => {
  test("Enter on posting row creates new posting below", async ({ page }) => {
    await using _file = await loadTestFileContent(
      page,
      `
      2024-01-15 * "Test"
        Assets:Checking  100.00 USD
      `,
    );

    const row = getPostingRow(page, { directive: 0, posting: 0 });
    const account = getField(row, "account");

    await focusFieldAtEnd(account);
    await account.press("Enter");

    const newRow = getPostingRow(page, { directive: 0, posting: 1 });
    await expect(newRow).toBeVisible();
    const newAccount = getField(newRow, "account");
    await expectFocused(newAccount);
  });

  test("Enter on transaction header creates new posting as first posting", async ({
    page,
  }) => {
    await using _file = await loadTestFileContent(
      page,
      `
      2024-01-15 * "Test"
        Assets:Checking  100.00 USD
      `,
    );

    const headerRow = getRow(page, 0).first();
    const narration = getField(headerRow, "narration");

    await focusFieldAtEnd(narration);
    await narration.press("Enter");

    // New posting should be at index 0 (first posting)
    const newRow = getPostingRow(page, { directive: 0, posting: 0 });
    await expect(newRow).toBeVisible();
    const newAccount = getField(newRow, "account");
    await expectFocused(newAccount);
    // The empty new posting should have no text
    await expectFieldText(newAccount, "");

    // Original posting should now be at index 1
    const movedRow = getPostingRow(page, { directive: 0, posting: 1 });
    const movedAccount = getField(movedRow, "account");
    await expectFieldText(movedAccount, "Assets:Checking");
  });

  test("Enter on empty posting removes it and shows directive type dropdown", async ({
    page,
  }) => {
    await using _file = await loadTestFileContent(
      page,
      `
      2024-01-15 * "Test"
        Assets:Checking  100.00 USD
      `,
    );

    // First create a new posting via Enter
    const existingRow = getPostingRow(page, { directive: 0, posting: 0 });
    const existingAccount = getField(existingRow, "account");
    await focusFieldAtEnd(existingAccount);
    await existingAccount.press("Enter");

    // Now we have an empty posting at index 1
    const emptyRow = getPostingRow(page, { directive: 0, posting: 1 });
    await expect(emptyRow).toBeVisible();
    const emptyAccount = getField(emptyRow, "account");
    await expectFocused(emptyAccount);

    // Press Enter on the empty posting
    await emptyAccount.press("Enter");

    // Empty posting should be removed
    await expect(emptyRow).not.toBeVisible();

    // Dropdown should be visible
    const dropdown = page.locator(".dropdown");
    await expect(dropdown).toBeVisible();

    // Select transaction type (press Enter on default selection)
    await page.keyboard.press("Enter");

    // New directive row should be created at index 1
    const newDirective = getRow(page, 1).first();
    await expect(newDirective).toBeVisible();
  });

  test("Enter on non-transaction directive shows type dropdown and creates new directive", async ({
    page,
  }) => {
    await using _file = await loadTestFileContent(
      page,
      `
      2024-01-15 balance Assets:Checking  100.00 USD
      `,
    );

    const row = getRow(page, 0).first();
    const account = getField(row, "account");

    await focusFieldAtEnd(account);
    await account.press("Enter");

    // Dropdown should be visible
    const dropdown = page.locator(".dropdown");
    await expect(dropdown).toBeVisible();

    // Select transaction type (press Enter on default selection)
    await page.keyboard.press("Enter");

    // New directive row should be created below
    const newDirective = getRow(page, 1).first();
    await expect(newDirective).toBeVisible();
  });

  test("Tab from date in new directive goes to narration without creating payee", async ({
    page,
  }) => {
    await using _file = await loadTestFileContent(
      page,
      `
      2024-01-15 balance Assets:Checking  100.00 USD
      `,
    );

    const row = getRow(page, 0).first();
    const account = getField(row, "account");

    await focusFieldAtEnd(account);
    await account.press("Enter");

    // Select transaction type
    const dropdown = page.locator(".dropdown");
    await expect(dropdown).toBeVisible();
    await page.keyboard.press("Enter");

    // Wait for dropdown to close
    await expect(dropdown).not.toBeVisible();

    // New directive row should be created
    const newDirective = getRow(page, 1).first();
    await expect(newDirective).toBeVisible();

    // Date field should be focused (empty fields may not be "visible" to Playwright)
    const dateField = getField(newDirective, "date");
    await expect(dateField).toBeAttached();
    await expectFocused(dateField);

    // Type a date and press Tab
    await typeInField(dateField, "2024-01-20");
    await dateField.press("Tab");

    // Focus should now be on narration field (not pending, not payee)
    const narration = getField(newDirective, "narration");
    await expectFocused(narration);

    // There should be no payee field
    const payee = newDirective.locator('[data-field="payee"]');
    await expect(payee).toHaveCount(0);
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
  test("backspace at start of commodity merges into amount-number", async ({
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
    const commodity = getField(row, "amount-commodity");

    await focusFieldAtStart(commodity);
    await commodity.press("Backspace");

    // USD should be merged into amount-number
    await expectFocused(amountNumber);
    await expectFieldText(amountNumber, "100.00USD");
  });

  test("clearing commodity and typing creates new commodity field", async ({
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
    const commodity = getField(row, "amount-commodity");

    // Clear commodity by selecting all and deleting
    await clearField(commodity);
    // Backspace on empty commodity
    await commodity.press("Backspace");

    // Focus should be on amount-number
    await expectFocused(amountNumber);
    await expectFieldText(amountNumber, "100.00");

    // Now type - this should create a new commodity field
    await typeInField(amountNumber, " EUR");

    // Should have split into number and commodity
    const newCommodity = getField(row, "amount-commodity");
    await expectFieldText(amountNumber, "100.00");
    await expectFieldText(newCommodity, "EUR");
  });

  test("backspace at start of cost-commodity merges into cost-number", async ({
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
    const costNumber = getField(row, "cost-number");
    const costCommodity = getField(row, "cost-commodity");

    await focusFieldAtStart(costCommodity);
    await costCommodity.press("Backspace");

    await expectFocused(costNumber);
    await expectFieldText(costNumber, "10EUR");
  });

  test("backspace at start of cost-number moves cost content to pending", async ({
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
    const pending = getPendingField(row);
    const costNumber = getField(row, "cost-number");
    const costCommodity = getField(row, "cost-commodity");

    await focusFieldAtStart(costNumber);
    await costNumber.press("Backspace");

    // Cost content moved to pending, cost fields removed
    await expectFocused(pending);
    await expectFieldText(pending, "10 EUR");
    await expect(costNumber).toHaveCount(0);
    await expect(costCommodity).toHaveCount(0);
  });

  test("backspace then re-trigger restores cost group", async ({ page }) => {
    await using _file = await loadTestFileContent(
      page,
      `
      2024-01-15 * "Test"
        Assets:Checking  100.00 USD {10 EUR}
      `,
    );

    const row = getPostingRow(page, { directive: 0, posting: 0 });
    const pending = getPendingField(row);

    // Get cost-number and backspace to move content to pending
    const costNumber = getField(row, "cost-number");
    await focusFieldAtStart(costNumber);
    await costNumber.press("Backspace");

    await expectFocused(pending);
    await expectFieldText(pending, "10 EUR");

    // Re-trigger with { to restore cost group
    await pending.press("{");

    // Cost group should be restored with content distributed across fields
    const newCostNumber = getField(row, "cost-number");
    const newCostCommodity = getField(row, "cost-commodity");
    await expectFocused(newCostNumber);
    await expectFieldText(newCostNumber, "10");
    await expectFieldText(newCostCommodity, "EUR");
  });

  test("backspace at start of narration merges payee into narration", async ({
    page,
  }) => {
    await using _file = await loadTestFileContent(
      page,
      `
      2024-01-15 * "The Payee" "The Narration"
        Assets:Checking  100.00 USD
      `,
    );

    const row = getRow(page, 0).first();
    const payee = getField(row, "payee");
    const narration = getField(row, "narration");

    await focusFieldAtStart(narration);
    await narration.press("Backspace");

    // Payee merged into narration, payee field removed (narration is the required field)
    await expectFocused(narration);
    await expectFieldText(narration, "The PayeeThe Narration");
    await expect(payee).toHaveCount(0);
  });

  test("backspace at start of link merges text into previous link", async ({
    page,
  }) => {
    await using _file = await loadTestFileContent(
      page,
      `
      2024-01-15 * "Test" ^link-1 ^link-2
        Assets:Checking  100.00 USD
      `,
    );

    const row = getRow(page, 0).first();
    const links = getFieldStartingWith(row, "links");
    const link1 = links.first();
    const link2 = links.last();

    await focusFieldAtStart(link2);
    await link2.press("Backspace");

    // link-2 should be merged into link-1
    await expect(links).toHaveCount(1);
    await expectFieldText(link1, "link-1link-2");
    await expectFocused(link1);
  });

  test("backspace at start of tag merges text into previous field", async ({
    page,
  }) => {
    await using _file = await loadTestFileContent(
      page,
      `
      2024-01-15 * "Test" #my-tag
        Assets:Checking  100.00 USD
      `,
    );

    const row = getRow(page, 0).first();
    const narration = getField(row, "narration");
    const tag = getFieldStartingWith(row, "tags").first();

    await focusFieldAtStart(tag);
    await tag.press("Backspace");

    // Tag text should be merged into narration
    const tags = getFieldStartingWith(row, "tags");
    await expect(tags).toHaveCount(0);
    await expectFieldText(narration, "Testmy-tag");
  });
});

test.describe("Trigger prepend in pending", () => {
  test("typing ^ in pending with existing text moves text to new link", async ({
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
    await expectFocused(pending);

    // Type some text in pending first
    await typeInField(pending, "my-link");
    await expectFieldText(pending, "my-link");

    // Now move to start and type trigger
    await pending.press("Home");
    await pending.press("^");

    // A link should be created with the text
    const link = getFieldStartingWith(row, "links").first();
    await expectFocused(link);
    await expectFieldText(link, "my-link");
    await expectFieldText(pending, "");
  });

  test("typing # in pending with existing text moves text to new tag", async ({
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

    // Type some text in pending
    await typeInField(pending, "important");

    // Type trigger (anywhere, should capture all text)
    await pending.press("#");

    // A tag should be created with the text
    const tag = getFieldStartingWith(row, "tags").first();
    await expectFocused(tag);
    await expectFieldText(tag, "important");
    await expectFieldText(pending, "");
  });

  test("typing @ in pending with multi-word text distributes to price fields", async ({
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

    // Type "13 EUR" in pending (simulating content moved from backspacing a price group)
    await typeInField(pending, "13 EUR");

    // Type @ trigger - should split content across price-number and price-commodity
    await pending.press("@");

    const priceNumber = getField(row, "price-number");
    const priceCommodity = getField(row, "price-commodity");
    await expectFieldText(priceNumber, "13");
    await expectFieldText(priceCommodity, "EUR");
    await expectFieldText(pending, "");
  });

  test("typing { in pending with multi-word text distributes to cost fields", async ({
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

    // Type "10 EUR" in pending (simulating content moved from backspacing a cost group)
    await typeInField(pending, "10 EUR");

    // Type { trigger - should split content across cost-number and cost-commodity
    await pending.press("{");

    const costNumber = getField(row, "cost-number");
    const costCommodity = getField(row, "cost-commodity");
    await expectFieldText(costNumber, "10");
    await expectFieldText(costCommodity, "EUR");
    await expectFieldText(pending, "");
  });
});

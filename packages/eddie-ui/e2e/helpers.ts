import { randomUUID } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { disposeOnException } from "@tiddo/eddie-utils/async";
import { createDisposableFile } from "@tiddo/eddie-utils/files";
import { trimIndent } from "@tiddo/eddie-utils/strings";

const __dirname = dirname(fileURLToPath(import.meta.url));
const workspaceDir = join(__dirname, ".workspace");

interface TestFileHandle extends AsyncDisposable {
  filename: string;
}

export async function loadTestFileContent(
  page: Page,
  content: string,
): Promise<TestFileHandle> {
  const filename = `${randomUUID()}.beancount`;
  const filepath = join(workspaceDir, filename);
  const file = await createDisposableFile(filepath, trimIndent(content));

  await disposeOnException(file, async () => {
    await page.goto(`/?file=${filename}`);
    await page.waitForSelector('[data-field][contenteditable="true"]');
  });

  return {
    filename,
    [Symbol.asyncDispose]: () => file[Symbol.asyncDispose](),
  };
}

export function getRow(page: Page, directiveIndex: number): Locator {
  return page.locator(`tr[data-directive-index="${directiveIndex}"]`);
}

export function getPostingRow(
  page: Page,
  {
    directive,
    posting,
  }: {
    directive: number;
    posting: number;
  },
): Locator {
  return page.locator(
    `tr[data-directive-index="${directive}"][data-posting-index="${posting}"]`,
  );
}

export function getField(row: Locator, fieldName: string): Locator {
  return row.locator(`[data-field="${fieldName}"][contenteditable="true"]`);
}

export function getFieldStartingWith(row: Locator, prefix: string): Locator {
  return row.locator(`[data-field^="${prefix}"][contenteditable="true"]`);
}

export function getPendingField(row: Locator): Locator {
  return row.locator('[data-field="pending"][contenteditable="true"]');
}

export async function focusField(field: Locator): Promise<void> {
  await field.click();
}

export async function focusFieldAtEnd(field: Locator): Promise<void> {
  await field.click();
  await field.press("End");
}

export async function focusFieldAtStart(field: Locator): Promise<void> {
  await field.evaluate((el: HTMLElement) => {
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(true);
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
  });
}

/** Focus the field and select all of its content (for testing backspace-to-delete). */
export async function selectAllInField(field: Locator): Promise<void> {
  await field.focus();
  await field.press("Control+A");
}

export async function typeInField(field: Locator, text: string): Promise<void> {
  await field.pressSequentially(text);
}

export async function getFieldText(field: Locator): Promise<string> {
  return (await field.textContent()) ?? "";
}

export async function expectFieldText(
  field: Locator,
  expected: string,
): Promise<void> {
  await expect(field).toHaveText(expected);
}

export async function expectFocused(field: Locator): Promise<void> {
  await expect(field).toBeFocused();
}

export async function expectFieldExists(field: Locator): Promise<void> {
  await expect(field).toBeVisible();
}

export async function expectFieldNotExists(field: Locator): Promise<void> {
  await expect(field).not.toBeVisible();
}

export async function getActiveFieldName(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    const el = document.activeElement;
    if (el instanceof HTMLElement) {
      return el.dataset.field ?? null;
    }
    return null;
  });
}

export async function clearField(field: Locator): Promise<void> {
  await field.click();
  await field.evaluate((el: HTMLElement) => {
    el.textContent = "";
  });
}

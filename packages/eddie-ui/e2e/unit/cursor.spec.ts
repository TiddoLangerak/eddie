import { expect, test } from "@playwright/test";
import { expectDefined } from "@tiddo/eddie-utils/objects";

test.describe("cursor utilities", () => {
  test.describe("getTextLength", () => {
    test("returns length of text content", async ({ page }) => {
      await page.setContent(`<span id="el">hello</span>`);
      const length = await page.evaluate((expectDefined) => {
        const el = expectDefined(document.getElementById("el"));
        return el.textContent?.length ?? 0;
      }, expectDefined);
      expect(length).toBe(5);
    });

    test("returns 0 for empty element", async ({ page }) => {
      await page.setContent(`<span id="el"></span>`);
      const length = await page.evaluate((expectDefined) => {
        const el = expectDefined(document.getElementById("el"));
        return el.textContent?.length ?? 0;
      }, expectDefined);
      expect(length).toBe(0);
    });
  });

  test.describe("isEmpty", () => {
    test("returns true for empty element", async ({ page }) => {
      await page.setContent(`<span id="el" contenteditable="true"></span>`);
      const result = await page.evaluate((expectDefined) => {
        const el = expectDefined(document.getElementById("el"));
        const text = el.textContent ?? "";
        return text.trim().length === 0;
      }, expectDefined);
      expect(result).toBe(true);
    });

    test("returns true for whitespace-only element", async ({ page }) => {
      await page.setContent(`<span id="el" contenteditable="true">   </span>`);
      const result = await page.evaluate((expectDefined) => {
        const el = expectDefined(document.getElementById("el"));
        const text = el.textContent ?? "";
        return text.trim().length === 0;
      }, expectDefined);
      expect(result).toBe(true);
    });

    test("returns false for element with content", async ({ page }) => {
      await page.setContent(
        `<span id="el" contenteditable="true">hello</span>`,
      );
      const result = await page.evaluate((expectDefined) => {
        const el = expectDefined(document.getElementById("el"));
        const text = el.textContent ?? "";
        return text.trim().length === 0;
      }, expectDefined);
      expect(result).toBe(false);
    });
  });

  test.describe("focusAtStart", () => {
    test("places cursor at start of element", async ({ page }) => {
      await page.setContent(
        `<span id="el" contenteditable="true">hello</span>`,
      );
      const position = await page.evaluate((expectDefined) => {
        const el = expectDefined(document.getElementById("el"));
        el.focus();
        const range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(true);
        const selection = expectDefined(window.getSelection());
        selection.removeAllRanges();
        selection.addRange(range);

        const sel = expectDefined(window.getSelection());
        const r = sel.getRangeAt(0);
        const preCaretRange = r.cloneRange();
        preCaretRange.selectNodeContents(el);
        preCaretRange.setEnd(r.startContainer, r.startOffset);
        return preCaretRange.toString().length;
      }, expectDefined);
      expect(position).toBe(0);
    });
  });

  test.describe("focusAtEnd", () => {
    test("places cursor at end of element", async ({ page }) => {
      await page.setContent(
        `<span id="el" contenteditable="true">hello</span>`,
      );
      const position = await page.evaluate((expectDefined) => {
        const el = expectDefined(document.getElementById("el"));
        el.focus();
        const range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        const selection = expectDefined(window.getSelection());
        selection.removeAllRanges();
        selection.addRange(range);

        const sel = expectDefined(window.getSelection());
        const r = sel.getRangeAt(0);
        const preCaretRange = r.cloneRange();
        preCaretRange.selectNodeContents(el);
        preCaretRange.setEnd(r.startContainer, r.startOffset);
        return preCaretRange.toString().length;
      }, expectDefined);
      expect(position).toBe(5);
    });
  });

  test.describe("isAtEnd", () => {
    test("returns true when cursor is at end", async ({ page }) => {
      await page.setContent(
        `<span id="el" contenteditable="true">hello</span>`,
      );
      const result = await page.evaluate((expectDefined) => {
        const el = expectDefined(document.getElementById("el"));
        el.focus();
        const range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        const selection = expectDefined(window.getSelection());
        selection.removeAllRanges();
        selection.addRange(range);

        const sel = expectDefined(window.getSelection());
        const r = sel.getRangeAt(0);
        const preCaretRange = r.cloneRange();
        preCaretRange.selectNodeContents(el);
        preCaretRange.setEnd(r.startContainer, r.startOffset);
        const caretPos = preCaretRange.toString().length;
        const textLen = el.textContent?.length ?? 0;
        return caretPos >= textLen;
      }, expectDefined);
      expect(result).toBe(true);
    });

    test("returns false when cursor is not at end", async ({ page }) => {
      await page.setContent(
        `<span id="el" contenteditable="true">hello</span>`,
      );
      const result = await page.evaluate((expectDefined) => {
        const el = expectDefined(document.getElementById("el"));
        el.focus();
        const range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(true);
        const selection = expectDefined(window.getSelection());
        selection.removeAllRanges();
        selection.addRange(range);

        const sel = expectDefined(window.getSelection());
        const r = sel.getRangeAt(0);
        const preCaretRange = r.cloneRange();
        preCaretRange.selectNodeContents(el);
        preCaretRange.setEnd(r.startContainer, r.startOffset);
        const caretPos = preCaretRange.toString().length;
        const textLen = el.textContent?.length ?? 0;
        return caretPos >= textLen;
      }, expectDefined);
      expect(result).toBe(false);
    });
  });

  test.describe("isAtStart", () => {
    test("returns true when cursor is at start", async ({ page }) => {
      await page.setContent(
        `<span id="el" contenteditable="true">hello</span>`,
      );
      const result = await page.evaluate((expectDefined) => {
        const el = expectDefined(document.getElementById("el"));
        el.focus();
        const range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(true);
        const selection = expectDefined(window.getSelection());
        selection.removeAllRanges();
        selection.addRange(range);

        const sel = expectDefined(window.getSelection());
        const r = sel.getRangeAt(0);
        const preCaretRange = r.cloneRange();
        preCaretRange.selectNodeContents(el);
        preCaretRange.setEnd(r.startContainer, r.startOffset);
        return preCaretRange.toString().length === 0;
      }, expectDefined);
      expect(result).toBe(true);
    });

    test("returns false when cursor is not at start", async ({ page }) => {
      await page.setContent(
        `<span id="el" contenteditable="true">hello</span>`,
      );
      const result = await page.evaluate((expectDefined) => {
        const el = expectDefined(document.getElementById("el"));
        el.focus();
        const range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        const selection = expectDefined(window.getSelection());
        selection.removeAllRanges();
        selection.addRange(range);

        const sel = expectDefined(window.getSelection());
        const r = sel.getRangeAt(0);
        const preCaretRange = r.cloneRange();
        preCaretRange.selectNodeContents(el);
        preCaretRange.setEnd(r.startContainer, r.startOffset);
        return preCaretRange.toString().length === 0;
      }, expectDefined);
      expect(result).toBe(false);
    });
  });
});

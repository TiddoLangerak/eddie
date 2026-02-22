import { expect, test } from "@playwright/test";

test.describe("cursor utilities", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test.describe("getTextLength", () => {
    test("returns length of text content", async ({ page }) => {
      await page.setContent(`<span id="el">hello</span>`);
      const length = await page.evaluate(async () => {
        const { expectDefined } = await import("@tiddo/eddie-utils/objects");
        const { getTextLength } = await import("/static/navigation/cursor.js");
        const el = expectDefined(document.getElementById("el"));
        return getTextLength(el);
      });
      expect(length).toBe(5);
    });

    test("returns 0 for empty element", async ({ page }) => {
      await page.setContent(`<span id="el"></span>`);
      const length = await page.evaluate(async () => {
        const { expectDefined } = await import("@tiddo/eddie-utils/objects");
        const { getTextLength } = await import("/static/navigation/cursor.js");
        const el = expectDefined(document.getElementById("el"));
        return getTextLength(el);
      });
      expect(length).toBe(0);
    });
  });

  test.describe("isEmpty", () => {
    test("returns true for empty element", async ({ page }) => {
      await page.setContent(`<span id="el" contenteditable="true"></span>`);
      const result = await page.evaluate(async () => {
        const { expectDefined } = await import("@tiddo/eddie-utils/objects");
        const { isEmpty } = await import("/static/navigation/cursor.js");
        const el = expectDefined(document.getElementById("el"));
        return isEmpty(el);
      });
      expect(result).toBe(true);
    });

    test("returns true for whitespace-only element", async ({ page }) => {
      await page.setContent(`<span id="el" contenteditable="true">   </span>`);
      const result = await page.evaluate(async () => {
        const { expectDefined } = await import("@tiddo/eddie-utils/objects");
        const { isEmpty } = await import("/static/navigation/cursor.js");
        const el = expectDefined(document.getElementById("el"));
        return isEmpty(el);
      });
      expect(result).toBe(true);
    });

    test("returns false for element with content", async ({ page }) => {
      await page.setContent(
        `<span id="el" contenteditable="true">hello</span>`,
      );
      const result = await page.evaluate(async () => {
        const { expectDefined } = await import("@tiddo/eddie-utils/objects");
        const { isEmpty } = await import("/static/navigation/cursor.js");
        const el = expectDefined(document.getElementById("el"));
        return isEmpty(el);
      });
      expect(result).toBe(false);
    });
  });

  test.describe("focusAtStart", () => {
    test("places cursor at start of element", async ({ page }) => {
      await page.setContent(
        `<span id="el" contenteditable="true">hello</span>`,
      );
      const position = await page.evaluate(async () => {
        const { expectDefined } = await import("@tiddo/eddie-utils/objects");
        const { focusAtStart, getCaretPosition } = await import(
          "/static/navigation/cursor.js"
        );
        const el = expectDefined(document.getElementById("el"));
        focusAtStart(el);
        return getCaretPosition(el);
      });
      expect(position).toBe(0);
    });
  });

  test.describe("focusAtEnd", () => {
    test("places cursor at end of element", async ({ page }) => {
      await page.setContent(
        `<span id="el" contenteditable="true">hello</span>`,
      );
      const position = await page.evaluate(async () => {
        const { expectDefined } = await import("@tiddo/eddie-utils/objects");
        const { focusAtEnd, getCaretPosition } = await import(
          "/static/navigation/cursor.js"
        );
        const el = expectDefined(document.getElementById("el"));
        focusAtEnd(el);
        return getCaretPosition(el);
      });
      expect(position).toBe(5);
    });
  });

  test.describe("isAtEnd", () => {
    test("returns true when cursor is at end", async ({ page }) => {
      await page.setContent(
        `<span id="el" contenteditable="true">hello</span>`,
      );
      const result = await page.evaluate(async () => {
        const { expectDefined } = await import("@tiddo/eddie-utils/objects");
        const { focusAtEnd, isAtEnd } = await import(
          "/static/navigation/cursor.js"
        );
        const el = expectDefined(document.getElementById("el"));
        focusAtEnd(el);
        return isAtEnd(el);
      });
      expect(result).toBe(true);
    });

    test("returns false when cursor is not at end", async ({ page }) => {
      await page.setContent(
        `<span id="el" contenteditable="true">hello</span>`,
      );
      const result = await page.evaluate(async () => {
        const { expectDefined } = await import("@tiddo/eddie-utils/objects");
        const { focusAtStart, isAtEnd } = await import(
          "/static/navigation/cursor.js"
        );
        const el = expectDefined(document.getElementById("el"));
        focusAtStart(el);
        return isAtEnd(el);
      });
      expect(result).toBe(false);
    });
  });

  test.describe("isAtStart", () => {
    test("returns true when cursor is at start", async ({ page }) => {
      await page.setContent(
        `<span id="el" contenteditable="true">hello</span>`,
      );
      const result = await page.evaluate(async () => {
        const { expectDefined } = await import("@tiddo/eddie-utils/objects");
        const { focusAtStart, isAtStart } = await import(
          "/static/navigation/cursor.js"
        );
        const el = expectDefined(document.getElementById("el"));
        focusAtStart(el);
        return isAtStart(el);
      });
      expect(result).toBe(true);
    });

    test("returns false when cursor is not at start", async ({ page }) => {
      await page.setContent(
        `<span id="el" contenteditable="true">hello</span>`,
      );
      const result = await page.evaluate(async () => {
        const { expectDefined } = await import("@tiddo/eddie-utils/objects");
        const { focusAtEnd, isAtStart } = await import(
          "/static/navigation/cursor.js"
        );
        const el = expectDefined(document.getElementById("el"));
        focusAtEnd(el);
        return isAtStart(el);
      });
      expect(result).toBe(false);
    });
  });
});

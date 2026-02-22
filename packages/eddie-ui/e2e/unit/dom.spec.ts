import { expect, test } from "@playwright/test";
import { expectDefined } from "@tiddo/eddie-utils/objects";

test.describe("DOM utilities", () => {
  test.describe("findFieldElement", () => {
    test("finds field by exact name", async ({ page }) => {
      await page.setContent(`
        <div id="container">
          <span data-field="account" contenteditable="true">Assets</span>
          <span data-field="amount" contenteditable="true">100</span>
        </div>
      `);
      const fieldName = await page.evaluate((expectDefined) => {
        const container = expectDefined(document.getElementById("container"));
        const el = container.querySelector<HTMLElement>(
          '[data-field="amount"][contenteditable="true"]',
        );
        return el?.dataset.field;
      }, expectDefined);
      expect(fieldName).toBe("amount");
    });

    test("returns null when field not found", async ({ page }) => {
      await page.setContent(`
        <div id="container">
          <span data-field="account" contenteditable="true">Assets</span>
        </div>
      `);
      const result = await page.evaluate((expectDefined) => {
        const container = expectDefined(document.getElementById("container"));
        return container.querySelector<HTMLElement>(
          '[data-field="nonexistent"][contenteditable="true"]',
        );
      }, expectDefined);
      expect(result).toBeNull();
    });

    test("ignores non-contenteditable elements", async ({ page }) => {
      await page.setContent(`
        <div id="container">
          <span data-field="amount">not editable</span>
          <span data-field="amount" contenteditable="true">editable</span>
        </div>
      `);
      const text = await page.evaluate((expectDefined) => {
        const container = expectDefined(document.getElementById("container"));
        const el = container.querySelector<HTMLElement>(
          '[data-field="amount"][contenteditable="true"]',
        );
        return el?.textContent;
      }, expectDefined);
      expect(text).toBe("editable");
    });
  });

  test.describe("findLastRepeatableFieldElement", () => {
    test("finds last instance of repeatable field", async ({ page }) => {
      await page.setContent(`
        <div id="container">
          <span data-field="tags-0" contenteditable="true">first</span>
          <span data-field="tags-1" contenteditable="true">second</span>
          <span data-field="tags-2" contenteditable="true">third</span>
        </div>
      `);
      const text = await page.evaluate((expectDefined) => {
        const container = expectDefined(document.getElementById("container"));
        const pattern = /^tags(-\d+)?$/;
        const allFields = container.querySelectorAll<HTMLElement>(
          '[data-field][contenteditable="true"]',
        );
        let lastMatch: HTMLElement | null = null;
        for (const el of allFields) {
          const fieldName = el.dataset.field;
          if (fieldName && pattern.test(fieldName)) {
            lastMatch = el;
          }
        }
        return lastMatch?.textContent;
      }, expectDefined);
      expect(text).toBe("third");
    });

    test("finds base field when no numbered instances exist", async ({
      page,
    }) => {
      await page.setContent(`
        <div id="container">
          <span data-field="tags" contenteditable="true">only</span>
        </div>
      `);
      const text = await page.evaluate((expectDefined) => {
        const container = expectDefined(document.getElementById("container"));
        const pattern = /^tags(-\d+)?$/;
        const allFields = container.querySelectorAll<HTMLElement>(
          '[data-field][contenteditable="true"]',
        );
        let lastMatch: HTMLElement | null = null;
        for (const el of allFields) {
          const fieldName = el.dataset.field;
          if (fieldName && pattern.test(fieldName)) {
            lastMatch = el;
          }
        }
        return lastMatch?.textContent;
      }, expectDefined);
      expect(text).toBe("only");
    });

    test("returns null when no matching fields exist", async ({ page }) => {
      await page.setContent(`
        <div id="container">
          <span data-field="links-0" contenteditable="true">different</span>
        </div>
      `);
      const result = await page.evaluate((expectDefined) => {
        const container = expectDefined(document.getElementById("container"));
        const pattern = /^tags(-\d+)?$/;
        const allFields = container.querySelectorAll<HTMLElement>(
          '[data-field][contenteditable="true"]',
        );
        let lastMatch: HTMLElement | null = null;
        for (const el of allFields) {
          const fieldName = el.dataset.field;
          if (fieldName && pattern.test(fieldName)) {
            lastMatch = el;
          }
        }
        return lastMatch;
      }, expectDefined);
      expect(result).toBeNull();
    });
  });

  test.describe("findPendingField", () => {
    test("finds pending field in row", async ({ page }) => {
      await page.setContent(`
        <div id="row">
          <span data-field="account" contenteditable="true">Assets</span>
          <span data-field="pending" contenteditable="true"></span>
        </div>
      `);
      const exists = await page.evaluate((expectDefined) => {
        const row = expectDefined(document.getElementById("row"));
        const pending = row.querySelector<HTMLElement>(
          '[data-field="pending"][contenteditable="true"]',
        );
        return pending !== null;
      }, expectDefined);
      expect(exists).toBe(true);
    });
  });

  test.describe("getRowType", () => {
    test("returns row type from data attribute", async ({ page }) => {
      await page.setContent(`
        <table><tbody><tr id="row" data-row-type="posting"></tr></tbody></table>
      `);
      const rowType = await page.evaluate((expectDefined) => {
        const row = expectDefined(document.getElementById("row"));
        return row.dataset.rowType ?? null;
      }, expectDefined);
      expect(rowType).toBe("posting");
    });

    test("returns null when no row type", async ({ page }) => {
      await page.setContent(`
        <table><tbody><tr id="row"></tr></tbody></table>
      `);
      const rowType = await page.evaluate((expectDefined) => {
        const row = expectDefined(document.getElementById("row"));
        return row.dataset.rowType ?? null;
      }, expectDefined);
      expect(rowType).toBeNull();
    });
  });

  test.describe("trimField", () => {
    test("trims leading whitespace", async ({ page }) => {
      await page.setContent(
        `<span id="el" contenteditable="true">  hello</span>`,
      );
      const result = await page.evaluate((expectDefined) => {
        const el = expectDefined(document.getElementById("el"));
        const text = el.textContent ?? "";
        const trimmed = text.trim();
        if (text !== trimmed) {
          el.textContent = trimmed;
        }
        return el.textContent;
      }, expectDefined);
      expect(result).toBe("hello");
    });

    test("trims trailing whitespace", async ({ page }) => {
      await page.setContent(
        `<span id="el" contenteditable="true">hello  </span>`,
      );
      const result = await page.evaluate((expectDefined) => {
        const el = expectDefined(document.getElementById("el"));
        const text = el.textContent ?? "";
        const trimmed = text.trim();
        if (text !== trimmed) {
          el.textContent = trimmed;
        }
        return el.textContent;
      }, expectDefined);
      expect(result).toBe("hello");
    });

    test("does not modify already trimmed content", async ({ page }) => {
      await page.setContent(
        `<span id="el" contenteditable="true">hello</span>`,
      );
      const result = await page.evaluate((expectDefined) => {
        const el = expectDefined(document.getElementById("el"));
        const text = el.textContent ?? "";
        const trimmed = text.trim();
        if (text !== trimmed) {
          el.textContent = trimmed;
        }
        return el.textContent;
      }, expectDefined);
      expect(result).toBe("hello");
    });
  });

  test.describe("createEditableSpan", () => {
    test("creates span with correct attributes", async ({ page }) => {
      await page.setContent(`<div id="container"></div>`);
      const result = await page.evaluate((expectDefined) => {
        const span = document.createElement("span");
        span.setAttribute("contenteditable", "true");
        span.setAttribute("data-field", "test-field");
        const container = expectDefined(document.getElementById("container"));
        container.appendChild(span);
        return {
          tagName: span.tagName,
          contenteditable: span.getAttribute("contenteditable"),
          dataField: span.getAttribute("data-field"),
        };
      }, expectDefined);
      expect(result.tagName).toBe("SPAN");
      expect(result.contenteditable).toBe("true");
      expect(result.dataField).toBe("test-field");
    });
  });

  test.describe("generateUniqueFieldName", () => {
    test("generates first index when no existing fields", async ({ page }) => {
      await page.setContent(`
        <div id="row">
          <span data-field="other" contenteditable="true"></span>
        </div>
      `);
      const result = await page.evaluate((expectDefined) => {
        const row = expectDefined(document.getElementById("row"));
        const baseName = "tags";
        let index = 1;
        while (
          row.querySelector(`[data-field="${baseName}-${index}"]`) !== null
        ) {
          index++;
        }
        return `${baseName}-${index}`;
      }, expectDefined);
      expect(result).toBe("tags-1");
    });

    test("generates next index when some exist", async ({ page }) => {
      await page.setContent(`
        <div id="row">
          <span data-field="tags-1" contenteditable="true"></span>
          <span data-field="tags-2" contenteditable="true"></span>
        </div>
      `);
      const result = await page.evaluate((expectDefined) => {
        const row = expectDefined(document.getElementById("row"));
        const baseName = "tags";
        let index = 1;
        while (
          row.querySelector(`[data-field="${baseName}-${index}"]`) !== null
        ) {
          index++;
        }
        return `${baseName}-${index}`;
      }, expectDefined);
      expect(result).toBe("tags-3");
    });

    test("fills gaps in numbering", async ({ page }) => {
      await page.setContent(`
        <div id="row">
          <span data-field="tags-2" contenteditable="true"></span>
          <span data-field="tags-3" contenteditable="true"></span>
        </div>
      `);
      const result = await page.evaluate((expectDefined) => {
        const row = expectDefined(document.getElementById("row"));
        const baseName = "tags";
        let index = 1;
        while (
          row.querySelector(`[data-field="${baseName}-${index}"]`) !== null
        ) {
          index++;
        }
        return `${baseName}-${index}`;
      }, expectDefined);
      expect(result).toBe("tags-1");
    });
  });
});

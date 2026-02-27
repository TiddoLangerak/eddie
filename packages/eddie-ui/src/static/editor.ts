import type {
  Balance,
  Event as BeancountEvent,
  BeancountFile,
  Close,
  Commodity,
  Custom,
  Directive,
  Document,
  FormattingInfo,
  Include,
  Note,
  Open,
  Option,
  Pad,
  Plugin,
  Posting,
  Price,
  Query,
  Transaction,
} from "@tiddo/beancount-types";
import { beancountFile } from "@tiddo/beancount-types";
import { array, isErr, object, string } from "@tiddo/eddie-parry";
import { type PathSegment, setValue } from "@tiddo/eddie-utils/objects";
import { createAccountAutocomplete } from "./components/accountAutocomplete.ts";
import { getSchema } from "./fieldSchema.ts";
import {
  createDirectiveRow,
  createPostingRow,
  getRowType,
  renumberDirectiveIndices,
  renumberPostingIndices,
} from "./navigation/dom.ts";
import { findParentDirectiveRow, isEmptyRow } from "./navigation/enter.ts";
import {
  applyBlurEmptyFieldCleanup,
  type BlurCleanupResult,
} from "./navigation/handlers.ts";
import { createKeyDownHandler } from "./navigation/index.ts";
import { showTypeSelector } from "./navigation/typeSelector.ts";

export interface BeancountData {
  file: string;
  model: BeancountFile;
  accounts: string[];
}

const beancountData = object({
  file: string(),
  model: beancountFile,
  accounts: array(string()),
});

function getData(): BeancountData | null {
  const el = document.getElementById("beancount-data");
  if (!el || !el.textContent) return null;
  let json: unknown;
  try {
    json = JSON.parse(el.textContent);
  } catch {
    return null;
  }
  const parsed = beancountData(json);
  if (isErr(parsed)) return null;
  return parsed.value;
}

function getCurrentFile(): string {
  const app = document.getElementById("app");
  return app?.getAttribute("data-current-file") ?? "";
}

function getNumberAttribute(el: Element | null, attr: string): number | null {
  const value = el?.getAttribute(attr);
  if (value == null) return null;
  const n = Number.parseInt(value, 10);
  return Number.isNaN(n) ? null : n;
}

function findPosting(
  directive: Directive,
  postingIndex: number,
): Posting | null {
  if (directive.type !== "transaction") return null;
  const p = directive.postings[postingIndex];
  return p ?? null;
}

/**
 * Converts dash-separated field name to property path.
 * Numeric segments become array indices.
 * e.g. "amount-number" -> ["amount", "number"]
 *      "tags" -> ["tags"]
 *      "tags-2" -> ["tags", 2]
 */
function fieldPath(fieldName: string): PathSegment[] {
  return fieldName.split("-").map((part) => {
    const num = Number.parseInt(part, 10);
    return Number.isNaN(num) ? part : num;
  });
}

const emptyFormatting: FormattingInfo = {
  header: [],
  footer: [],
  inlineComment: undefined,
};

function createEmptyDirective(type: string): Directive {
  switch (type) {
    case "transaction":
      return {
        type: "transaction",
        date: "",
        flag: "*",
        narration: "",
        tags: [],
        links: [],
        postings: [],
        metadata: {},
        metadataHeader: [],
        formatting: emptyFormatting,
      } satisfies Transaction;
    case "balance":
      return {
        type: "balance",
        date: "",
        account: "",
        amount: { number: "", commodity: "" },
        formatting: emptyFormatting,
      } satisfies Balance;
    case "open":
      return {
        type: "open",
        date: "",
        account: "",
        commodities: [],
        formatting: emptyFormatting,
      } satisfies Open;
    case "close":
      return {
        type: "close",
        date: "",
        account: "",
        formatting: emptyFormatting,
      } satisfies Close;
    case "commodity":
      return {
        type: "commodity",
        date: "",
        commodity: "",
        formatting: emptyFormatting,
      } satisfies Commodity;
    case "pad":
      return {
        type: "pad",
        date: "",
        account: "",
        sourceAccount: "",
        formatting: emptyFormatting,
      } satisfies Pad;
    case "note":
      return {
        type: "note",
        date: "",
        account: "",
        comment: "",
        formatting: emptyFormatting,
      } satisfies Note;
    case "document":
      return {
        type: "document",
        date: "",
        account: "",
        filename: "",
        formatting: emptyFormatting,
      } satisfies Document;
    case "price":
      return {
        type: "price",
        date: "",
        commodity: "",
        amount: { number: "", commodity: "" },
        formatting: emptyFormatting,
      } satisfies Price;
    case "event":
      return {
        type: "event",
        date: "",
        eventType: "",
        description: "",
        formatting: emptyFormatting,
      } satisfies BeancountEvent;
    case "query":
      return {
        type: "query",
        date: "",
        name: "",
        queryString: "",
        formatting: emptyFormatting,
      } satisfies Query;
    case "custom":
      return {
        type: "custom",
        date: "",
        customType: "",
        values: [],
        formatting: emptyFormatting,
      } satisfies Custom;
    case "include":
      return {
        type: "include",
        filename: "",
        formatting: emptyFormatting,
      } satisfies Include;
    case "plugin":
      return {
        type: "plugin",
        module: "",
        formatting: emptyFormatting,
      } satisfies Plugin;
    case "option":
      return {
        type: "option",
        name: "",
        value: "",
        formatting: emptyFormatting,
      } satisfies Option;
    default:
      return {
        type: "transaction",
        date: "",
        flag: "*",
        narration: "",
        tags: [],
        links: [],
        postings: [],
        metadata: {},
        metadataHeader: [],
        formatting: emptyFormatting,
      } satisfies Transaction;
  }
}

function initEditor(): void {
  const data = getData();
  if (!data?.model) return;

  const file = data.file || getCurrentFile();
  if (!file) return;

  const model = data.model;

  function onBlur(e: Event): void {
    if (!(e.target instanceof HTMLElement)) return;
    const el = e.target;
    const field = el.getAttribute("data-field");
    const row = el.closest("tr");
    const directiveIndex = getNumberAttribute(row, "data-directive-index");
    const postingIndex = getNumberAttribute(row, "data-posting-index");

    if (!field) return;
    if (!row) return;
    if (directiveIndex == null) return;

    const directive = model.directives[directiveIndex];
    if (directive == null) return;
    const target =
      postingIndex != null ? findPosting(directive, postingIndex) : directive;
    if (target == null) return;

    const value = (el.textContent ?? "").trim();
    const rowType = getRowType(row);
    const schema = rowType ? getSchema(rowType) : undefined;
    const cleanup: BlurCleanupResult | null =
      schema != null
        ? applyBlurEmptyFieldCleanup(e, el, row, schema)
        : null;

    if (cleanup) {
      applyBlurCleanupToModel(
        target as unknown as Record<string, unknown>,
        field,
        value,
        cleanup,
      );
    } else {
      setValue(target as unknown as Record<string, unknown>, fieldPath(field), value);
    }

    onRemoveEmptyRow(row);
  }

  function applyBlurCleanupToModel(
    target: Record<string, unknown>,
    blurredField: string,
    blurredValue: string,
    cleanup: BlurCleanupResult,
  ): void {
    const { removed, mergedInto } = cleanup;
    for (const name of removed) {
      setValue(target, fieldPath(name), "");
    }
    if (mergedInto) {
      setValue(target, fieldPath(mergedInto.field), mergedInto.value);
    }
    if (!removed.includes(blurredField)) {
      const value =
        mergedInto?.field === blurredField
          ? mergedInto.value
          : blurredValue;
      setValue(target, fieldPath(blurredField), value);
    }
  }

  function registerFieldHandlers(el: Element): void {
    el.addEventListener("blur", onBlur);
    el.addEventListener("keydown", handleKeyDown);
    const fieldName = el.getAttribute("data-field");
    if (
      (fieldName === "account" || fieldName === "sourceAccount") &&
      el instanceof HTMLElement
    ) {
      const data = getData();
      if (data?.accounts?.length) {
        const instance = createAccountAutocomplete(el, data.accounts, () => {});
        el.addEventListener(
          "keydown",
          (e) => {
            if (
              e instanceof KeyboardEvent &&
              instance.isOpen() &&
              instance.handleKeyDown(e)
            ) {
              e.preventDefault();
              e.stopPropagation();
            }
          },
          true,
        );
      }
    }
  }

  function onCreatePosting(afterRow: Element): HTMLElement | null {
    const directiveIndex = getNumberAttribute(afterRow, "data-directive-index");
    if (directiveIndex == null) return null;

    const directive = model.directives[directiveIndex];
    if (!directive || directive.type !== "transaction") return null;

    const afterPostingIndex = getNumberAttribute(
      afterRow,
      "data-posting-index",
    );
    const isTransactionHeader = afterPostingIndex == null;
    const insertIndex = isTransactionHeader ? 0 : afterPostingIndex + 1;

    const newPosting: Posting = {
      account: "",
      metadata: {},
      formatting: { header: [], footer: [], inlineComment: undefined },
    };

    directive.postings.splice(insertIndex, 0, newPosting);

    const newRow = createPostingRow(
      directiveIndex,
      insertIndex,
      registerFieldHandlers,
    );
    afterRow.after(newRow);

    const tbody = afterRow.closest("tbody");
    if (tbody) renumberPostingIndices(tbody);

    return newRow;
  }

  function onShowDirectiveTypeSelector(afterRow: Element): void {
    const afterDirectiveIndex = getNumberAttribute(
      afterRow,
      "data-directive-index",
    );
    if (afterDirectiveIndex == null) return;

    const lastRowOfDirective = findLastRowOfDirective(afterRow);

    const placeholderRow = createPlaceholderDirectiveRow();
    lastRowOfDirective.after(placeholderRow);

    const tbody = afterRow.closest("tbody");
    if (tbody) renumberDirectiveIndices(tbody);

    const typeCell =
      placeholderRow.querySelector<HTMLElement>(".directive-type");
    const anchor = typeCell ?? (placeholderRow as HTMLElement);

    showTypeSelector(anchor, {
      onTypeSelected: (type) => {
        finalizeDirective(placeholderRow, type);
      },
      onCancel: () => {
        removeDirectivePlaceholder(placeholderRow);
      },
    });
  }

  function createPlaceholderDirectiveRow(): HTMLTableRowElement {
    const tr = document.createElement("tr");
    tr.className = "directive-row directive-type-txn";
    tr.setAttribute("data-row-type", "transaction");
    tr.setAttribute(
      "data-directive-index",
      "new",
    ); /* unique so renumberDirectiveIndices treats it as its own directive */

    const dateCell = document.createElement("td");
    dateCell.className = "directive-date";

    const typeCell = document.createElement("td");
    typeCell.className = "directive-type";

    const detailsCell = document.createElement("td");
    detailsCell.className = "directive-details";

    tr.appendChild(dateCell);
    tr.appendChild(typeCell);
    tr.appendChild(detailsCell);

    return tr;
  }

  function finalizeDirective(placeholderRow: Element, type: string): void {
    const directiveIndex = getNumberAttribute(
      placeholderRow,
      "data-directive-index",
    );
    if (directiveIndex == null) {
      placeholderRow.remove();
      return;
    }

    const newDirective = createEmptyDirective(type);
    model.directives.splice(directiveIndex, 0, newDirective);

    const newRow = createDirectiveRow(
      directiveIndex,
      type,
      registerFieldHandlers,
    );
    placeholderRow.replaceWith(newRow);

    const firstField = newRow.querySelector<HTMLElement>(
      '[data-field][contenteditable="true"]',
    );
    if (firstField) firstField.focus();
  }

  function removeDirectivePlaceholder(placeholderRow: Element): void {
    const tbody = placeholderRow.closest("tbody");
    placeholderRow.remove();
    if (tbody) renumberDirectiveIndices(tbody);
  }

  function onRemovePosting(row: Element): void {
    const directiveIndex = getNumberAttribute(row, "data-directive-index");
    const postingIndex = getNumberAttribute(row, "data-posting-index");
    if (directiveIndex == null || postingIndex == null) return;

    const directive = model.directives[directiveIndex];
    if (!directive || directive.type !== "transaction") return;

    directive.postings.splice(postingIndex, 1);
    const tbody = row.closest("tbody");
    row.remove();
    if (tbody) renumberPostingIndices(tbody);
  }

  function onRemoveDirective(row: Element): void {
    const directiveIndexAttr = row.getAttribute("data-directive-index");
    if (directiveIndexAttr == null) return;

    if (directiveIndexAttr === "new") {
      removeDirectivePlaceholder(row);
      return;
    }

    const directiveIndex = Number.parseInt(directiveIndexAttr, 10);
    if (Number.isNaN(directiveIndex)) return;

    const tbody = row.closest("tbody");
    if (!tbody) return;

    const rowsToRemove = [
      ...tbody.querySelectorAll(
        `tr[data-directive-index="${directiveIndexAttr}"]`,
      ),
    ];
    const firstRow = rowsToRemove[0];
    const lastRow = rowsToRemove[rowsToRemove.length - 1];
    const prevRow = firstRow?.previousElementSibling ?? null;
    const nextRow = lastRow?.nextElementSibling ?? null;

    model.directives.splice(directiveIndex, 1);
    for (const r of rowsToRemove) {
      r.remove();
    }
    renumberDirectiveIndices(tbody);

    if (prevRow) {
      focusLastEditableInRow(prevRow);
    } else if (nextRow) {
      focusFirstEditableInRow(nextRow);
    }
  }

  function focusFirstEditableInRow(row: Element): void {
    const el = row.querySelector<HTMLElement>(
      '[data-field][contenteditable="true"]',
    );
    if (el) el.focus();
  }

  function focusLastEditableInRow(row: Element): void {
    const els = row.querySelectorAll<HTMLElement>(
      '[data-field][contenteditable="true"]',
    );
    const last = els[els.length - 1];
    if (last) last.focus();
  }

  function onRemoveEmptyRow(row: Element): void {
    const rowType = getRowType(row);
    if (!rowType || !isEmptyRow(row)) return;

    if (rowType === "posting") {
      onRemovePosting(row);
      const prevRow = row.previousElementSibling;
      if (!prevRow) return;
      focusLastEditableInRow(prevRow);
    } else {
      onRemoveDirective(row);
    }
  }

  function findLastRowOfDirective(directiveRow: Element): Element {
    const directiveIndex = directiveRow.getAttribute("data-directive-index");
    if (directiveIndex == null) return directiveRow;

    const tbody = directiveRow.closest("tbody");
    if (!tbody) return directiveRow;

    const allRows = tbody.querySelectorAll(
      `tr[data-directive-index="${directiveIndex}"]`,
    );
    return allRows.length > 0 ? allRows[allRows.length - 1] : directiveRow;
  }

  const handleKeyDown = createKeyDownHandler({
    onCreateField: registerFieldHandlers,
    onCreatePosting,
    onInsertNewDirective: onShowDirectiveTypeSelector,
    onRemovePosting,
    onRemoveDirective,
    onRemoveEmptyRow,
  });

  for (const el of document.querySelectorAll(
    '[data-field][contenteditable="true"]',
  )) {
    registerFieldHandlers(el);
  }

  const saveBtn = document.getElementById("editor-save-btn");
  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      saveBtn.setAttribute("disabled", "true");
      fetch("/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file, model }),
      })
        .then((res) => {
          if (res.redirected) {
            window.location.href = res.url;
            return;
          }
          if (res.ok)
            return res.text().then(() => {
              window.location.reload();
            });
          return res.text().then((t) => {
            saveBtn.removeAttribute("disabled");
            alert(`Save failed: ${t}`);
          });
        })
        .catch((err) => {
          saveBtn.removeAttribute("disabled");
          alert(
            `Save failed: ${err instanceof Error ? err.message : String(err)}`,
          );
        });
    });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initEditor);
} else {
  initEditor();
}

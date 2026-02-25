/**
 * Enter key handling for creating new postings and directives.
 */

import { focusAtStart } from "./cursor.ts";
import { findFieldElement, getRowType } from "./dom.ts";
import type { NavigationCallbacks } from "./pending.ts";

export function handleEnterKey(
  row: Element,
  callbacks: NavigationCallbacks,
): void {
  const rowType = getRowType(row);
  if (!rowType) return;

  if (rowType === "posting") {
    handlePostingEnter(row, callbacks);
  } else if (rowType === "transaction") {
    handleTransactionHeaderEnter(row, callbacks);
  } else {
    handleDirectiveEnter(row, callbacks);
  }
}

function handlePostingEnter(
  row: Element,
  callbacks: NavigationCallbacks,
): void {
  if (isEmptyRow(row)) {
    const parentDirectiveRow = findParentDirectiveRow(row);
    callbacks.onRemovePosting(row);
    if (parentDirectiveRow) {
      callbacks.onInsertNewDirective(parentDirectiveRow);
    }
  } else {
    const newRow = callbacks.onCreatePosting(row);
    if (newRow) focusFirstEditableField(newRow);
  }
}

function handleTransactionHeaderEnter(
  row: Element,
  callbacks: NavigationCallbacks,
): void {
  const newRow = callbacks.onCreatePosting(row);
  if (newRow) focusFirstEditableField(newRow);
}

function handleDirectiveEnter(
  row: Element,
  callbacks: NavigationCallbacks,
): void {
  callbacks.onInsertNewDirective(row);
}

export function isEmptyRow(row: Element): boolean {
  const fields = row.querySelectorAll<HTMLElement>(
      '[data-field][contenteditable="true"]',
  );
  return [...fields].every((el) => (el.textContent ?? "").trim() === "");
}

export function findParentDirectiveRow(postingRow: Element): Element | null {
  const directiveIndex = postingRow.getAttribute("data-directive-index");
  if (directiveIndex == null) return null;

  const tbody = postingRow.closest("tbody");
  if (!tbody) return null;

  return tbody.querySelector(
    `tr[data-directive-index="${directiveIndex}"]:not([data-posting-index])`,
  );
}

function focusFirstEditableField(row: Element): void {
  const firstField = row.querySelector<HTMLElement>(
    '[data-field][contenteditable="true"]',
  );
  if (firstField) focusAtStart(firstField);
}

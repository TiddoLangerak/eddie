/**
 * DOM query and manipulation utilities for field elements.
 */

import type { NavigationCallbacks } from "./pending.ts";

export function findFieldElement(
  container: Element,
  fieldName: string,
): HTMLElement | null {
  return container.querySelector<HTMLElement>(
    `[data-field="${fieldName}"][contenteditable="true"]`,
  );
}

export function findLastRepeatableFieldElement(
  container: Element,
  baseFieldName: string,
): HTMLElement | null {
  const pattern = new RegExp(`^${baseFieldName}(-\\d+)?$`);
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
}

export function findPendingField(row: Element): HTMLElement | null {
  return findFieldElement(row, "pending");
}

export function getRowType(row: Element): string | null {
  return row instanceof HTMLElement ? (row.dataset.rowType ?? null) : null;
}

export function trimField(el: HTMLElement): void {
  const text = el.textContent ?? "";
  const trimmed = text.trim();
  if (text !== trimmed) {
    el.textContent = trimmed;
  }
}

export function createEditableSpan(fieldName: string): HTMLElement {
  const span = document.createElement("span");
  span.setAttribute("contenteditable", "true");
  span.setAttribute("data-field", fieldName);
  return span;
}

export function generateNextIndexedFieldName(
  row: Element,
  baseName: string,
): string {
  let index = 1;
  while (findFieldElement(row, `${baseName}-${index}`)) {
    index++;
  }
  return `${baseName}-${index}`;
}

export function createPostingRow(
  directiveIndex: number,
  postingIndex: number,
  registerFieldHandlers: NavigationCallbacks["onCreateField"],
): HTMLTableRowElement {
  const tr = document.createElement("tr");
  tr.className = "posting-row";
  tr.setAttribute("data-row-type", "posting");
  tr.setAttribute("data-directive-index", String(directiveIndex));
  tr.setAttribute("data-posting-index", String(postingIndex));

  const td = document.createElement("td");
  td.colSpan = 3;
  td.className = "posting-cell";

  const accountSpan = createEditableSpan("account");
  const pendingSpan = createEditableSpan("pending");

  registerFieldHandlers(accountSpan);
  registerFieldHandlers(pendingSpan);

  td.appendChild(accountSpan);
  td.appendChild(pendingSpan);
  tr.appendChild(td);

  return tr;
}

export function createDirectiveRow(
  directiveIndex: number,
  directiveType: string,
  registerFieldHandlers: NavigationCallbacks["onCreateField"],
): HTMLTableRowElement {
  const tr = document.createElement("tr");
  tr.className = `directive-row directive-type-${directiveType}`;
  tr.setAttribute("data-row-type", directiveType);
  tr.setAttribute("data-directive-index", String(directiveIndex));

  const dateCell = document.createElement("td");
  dateCell.className = "directive-date";
  const dateSpan = createEditableSpan("date");
  registerFieldHandlers(dateSpan);
  dateCell.appendChild(dateSpan);

  const typeCell = document.createElement("td");
  typeCell.className = "directive-type";
  typeCell.textContent = getDirectiveTypeLabel(directiveType);

  const detailsCell = document.createElement("td");
  detailsCell.className = "directive-details";
  createDirectiveDetailsFields(
    directiveType,
    detailsCell,
    registerFieldHandlers,
  );

  tr.appendChild(dateCell);
  tr.appendChild(typeCell);
  tr.appendChild(detailsCell);

  return tr;
}

function getDirectiveTypeLabel(type: string): string {
  return type === "transaction" ? "txn" : type;
}

function createDirectiveDetailsFields(
  type: string,
  container: HTMLElement,
  registerFieldHandlers: NavigationCallbacks["onCreateField"],
): void {
  const addField = (name: string): HTMLElement => {
    const span = createEditableSpan(name);
    registerFieldHandlers(span);
    container.appendChild(span);
    return span;
  };

  switch (type) {
    case "transaction":
      addField("narration");
      addField("pending");
      break;
    case "balance":
      addField("account");
      addField("amount-number");
      addField("amount-commodity");
      addField("pending");
      break;
    case "open":
    case "close":
      addField("account");
      addField("pending");
      break;
    case "commodity":
      addField("commodity");
      addField("pending");
      break;
    case "pad":
      addField("account");
      addField("sourceAccount");
      addField("pending");
      break;
    case "note":
      addField("account");
      addField("comment");
      addField("pending");
      break;
    case "document":
      addField("account");
      addField("filename");
      addField("pending");
      break;
    case "price":
      addField("commodity");
      addField("amount-number");
      addField("amount-commodity");
      addField("pending");
      break;
    case "event":
      addField("eventType");
      addField("description");
      addField("pending");
      break;
    case "query":
      addField("name");
      addField("queryString");
      addField("pending");
      break;
    case "custom":
      addField("customType");
      addField("pending");
      break;
    case "include":
      addField("filename");
      addField("pending");
      break;
    case "plugin":
      addField("module");
      addField("pending");
      break;
    case "option":
      addField("name");
      addField("value");
      addField("pending");
      break;
    default:
      addField("pending");
  }
}

export function renumberPostingIndices(tbody: Element): void {
  const directives = new Map<string, Element[]>();

  for (const row of tbody.querySelectorAll("tr[data-directive-index]")) {
    const directiveIndex = row.getAttribute("data-directive-index");
    if (directiveIndex == null) continue;

    if (!directives.has(directiveIndex)) {
      directives.set(directiveIndex, []);
    }
    if (row.hasAttribute("data-posting-index")) {
      const arr = directives.get(directiveIndex);
      if (arr) arr.push(row);
    }
  }

  for (const [, postingRows] of directives) {
    postingRows.forEach((row, index) => {
      row.setAttribute("data-posting-index", String(index));
    });
  }
}

export function renumberDirectiveIndices(tbody: Element): void {
  let directiveIndex = 0;
  let currentDirective: string | null = null;

  for (const row of tbody.querySelectorAll("tr[data-directive-index]")) {
    const rowDirectiveIndex = row.getAttribute("data-directive-index");

    if (rowDirectiveIndex !== currentDirective) {
      if (currentDirective !== null) {
        directiveIndex++;
      }
      currentDirective = rowDirectiveIndex;
    }

    row.setAttribute("data-directive-index", String(directiveIndex));
  }
}

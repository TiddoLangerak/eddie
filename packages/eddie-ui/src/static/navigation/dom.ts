/**
 * DOM query and manipulation utilities for field elements.
 */

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

export function generateNextIndexedFieldName(row: Element, baseName: string): string {
  let index = 1;
  while (findFieldElement(row, `${baseName}-${index}`)) {
    index++;
  }
  return `${baseName}-${index}`;
}

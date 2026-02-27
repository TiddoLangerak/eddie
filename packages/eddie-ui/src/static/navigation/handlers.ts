/**
 * Field-specific exit and navigation handlers.
 */

import type { FieldGroup, GroupSpec, RowSchema } from "../fieldSchema.ts";
import { focusAtEnd, focusAtStart, isAtEnd, isEmpty } from "./cursor.ts";
import {
  findFieldElement,
  findLastRepeatableFieldElement,
  findPendingField,
  trimField,
} from "./dom.ts";
import { moveToPending } from "./pending.ts";
import {
  findCurrentFieldInSchema,
  findNextFieldInGroup,
  getFirstFieldOfGroup,
  getLastFieldOfGroup,
  hasRequiredBareNextField,
  isFieldGroup,
} from "./schema.ts";

/**
 * Result of applying blur cleanup: which fields were removed from the DOM and
 * any merge (e.g. payee → narration) so the editor can sync the model.
 */
export interface BlurCleanupResult {
  removed: string[];
  mergedInto?: { field: string; value: string };
}

/**
 * Merge the first field (e.g. payee) into the second (e.g. narration) in an
 * ambiguous-freetext group. Updates DOM and returns the element to focus and
 * cursor position. Used by both backspace and blur cleanup.
 */
function mergeFirstIntoSecondInAmbiguousFreetext(
  secondEl: HTMLElement,
  row: Element,
  group: Extract<GroupSpec, { kind: "ambiguous-freetext" }>,
  currentText: string,
): { into: HTMLElement; insertPos: number } | null {
  const firstEl = findFieldElement(row, group.fields.first);
  if (!firstEl) return null;
  const firstText = (firstEl.textContent ?? "").trim();
  secondEl.textContent = firstText + currentText;
  firstEl.remove();
  return { into: secondEl, insertPos: firstText.length };
}

/**
 * Merge current field into the previous field. Updates DOM and returns the
 * insert position for the previous element. Used by both backspace and blur.
 */
function mergeIntoPreviousField(
  el: HTMLElement,
  prevEl: HTMLElement,
  currentText: string,
): number {
  const prevText = (prevEl.textContent ?? "").trim();
  const insertPos = prevText.length;
  prevEl.textContent = prevText + currentText;
  el.remove();
  return insertPos;
}

/**
 * When blurring an empty field, apply the same removal/merge as backspace:
 * remove empty optional fields and merge payee/narration when one is empty.
 * Caller must sync the model from this result and then run onRemoveEmptyRow.
 */
export function applyBlurEmptyFieldCleanup(
  e: Event,
  el: HTMLElement,
  row: Element,
  schema: RowSchema,
): BlurCleanupResult | null {
  const currentText = (el.textContent ?? "").trim();
  if (currentText !== "") return null;

  const currentFieldName = el.dataset.field;
  if (!currentFieldName) return null;

  const found = findCurrentFieldInSchema(schema, currentFieldName);
  if (!found) return null;

  const { group, groupIndex, fieldIndex } = found;

  if (group.kind === "ambiguous-freetext") {
    if (currentFieldName === group.fields.first) {
      const narrationEl = findFieldElement(row, group.fields.second);
      el.remove();
      return { removed: [group.fields.first] };
    }
    if (currentFieldName === group.fields.second) {
      const result = mergeFirstIntoSecondInAmbiguousFreetext(
        el,
        row,
        group,
        currentText,
      );
      if (result) {
        const merged = (result.into.textContent ?? "").trim();
        return {
          removed: [group.fields.first],
          mergedInto: { field: group.fields.second, value: merged },
        };
      }
    }
    return null;
  }

  const prevEl = findPreviousFieldForMerge(
    el,
    row,
    schema,
    group,
    groupIndex,
    fieldIndex,
  );

  if (prevEl) {
    const insertPos = mergeIntoPreviousField(el, prevEl, currentText);
    focusAtPosition(prevEl, insertPos);
    return { removed: [currentFieldName] };
  }

  if (isFieldGroup(group) && group.optional) {
    el.remove();
    return { removed: [currentFieldName] };
  }

  return null;
}

export function handleBackspaceMerge(
  e: KeyboardEvent,
  el: HTMLElement,
  row: Element,
  schema: RowSchema,
  group: GroupSpec,
  groupIndex: number,
  fieldIndex: number,
): boolean {
  const currentText = (el.textContent ?? "").trim();
  const currentFieldName = el.dataset.field;

  if (group.kind === "ambiguous-freetext") {
    if (currentFieldName === group.fields.second) {
      const result = mergeFirstIntoSecondInAmbiguousFreetext(
        el,
        row,
        group,
        currentText,
      );
      if (result) {
        e.preventDefault();
        focusAtPosition(result.into, result.insertPos);
        return true;
      }
    }
  }

  if (isFieldGroup(group) && fieldIndex === 0 && group.fields.length > 1) {
    const pending = findPendingField(row);
    if (pending) {
      e.preventDefault();
      const groupContent = group.fields
        .map((f) => (findFieldElement(row, f.name)?.textContent ?? "").trim())
        .filter((t) => t.length > 0)
        .join(" ");
      for (const field of group.fields) {
        findFieldElement(row, field.name)?.remove();
      }
      const pendingText = pending.textContent ?? "";
      pending.textContent = groupContent + pendingText;
      focusAtStart(pending);
      return true;
    }
  }

  const prevEl = findPreviousFieldForMerge(
    el,
    row,
    schema,
    group,
    groupIndex,
    fieldIndex,
  );

  if (prevEl) {
    e.preventDefault();
    const insertPos = mergeIntoPreviousField(el, prevEl, currentText);
    focusAtPosition(prevEl, insertPos);
    return true;
  }

  return false;
}

function findPreviousFieldForMerge(
  currentEl: HTMLElement,
  row: Element,
  schema: RowSchema,
  currentGroup: GroupSpec,
  currentGroupIndex: number,
  currentFieldIndex: number,
): HTMLElement | null {
  // Within a field group, try previous field in same group first
  if (isFieldGroup(currentGroup) && currentFieldIndex > 0) {
    const prevField = currentGroup.fields[currentFieldIndex - 1];
    const el = findFieldElement(row, prevField.name);
    if (el) {
      return el;
    }
  }

  // For repeatable fields at index 0, check for previous instance of same group
  if (isFieldGroup(currentGroup) && currentGroup.repeatable) {
    const firstFieldName = getFirstFieldOfGroup(currentGroup);
    const allInstances = findAllRepeatableFieldElements(row, firstFieldName);
    if (allInstances.length > 1) {
      const idx = allInstances.indexOf(currentEl);
      if (idx > 0) {
        return allInstances[idx - 1];
      }
    }
  }

  // Try previous groups
  for (let i = currentGroupIndex - 1; i >= 0; i--) {
    const prevGroup = schema.groups[i];
    const lastFieldName = getLastFieldOfGroup(prevGroup);
    const el =
      isFieldGroup(prevGroup) && prevGroup.repeatable
        ? findLastRepeatableFieldElement(row, lastFieldName)
        : findFieldElement(row, lastFieldName);
    if (el) {
      return el;
    }
  }

  return null;
}

function findAllRepeatableFieldElements(
  container: Element,
  baseFieldName: string,
): HTMLElement[] {
  const pattern = new RegExp(`^${baseFieldName}(-\\d+)?$`);
  const allFields = container.querySelectorAll<HTMLElement>(
    '[data-field][contenteditable="true"]',
  );
  const matches: HTMLElement[] = [];
  for (const el of allFields) {
    const fieldName = el.dataset.field;
    if (fieldName && pattern.test(fieldName)) {
      matches.push(el);
    }
  }
  return matches;
}

function focusAtPosition(el: HTMLElement, position: number): void {
  el.focus();
  const range = document.createRange();
  const textNode = el.firstChild;
  if (textNode && textNode.nodeType === Node.TEXT_NODE) {
    const safePos = Math.min(position, textNode.textContent?.length ?? 0);
    range.setStart(textNode, safePos);
    range.collapse(true);
  } else if (el.childNodes.length === 0 && position === 0) {
    range.selectNodeContents(el);
    range.collapse(true);
  } else {
    range.selectNodeContents(el);
    range.collapse(false);
  }
  const selection = window.getSelection();
  if (selection) {
    selection.removeAllRanges();
    selection.addRange(range);
  }
}

export function handleBareFieldExit(
  e: KeyboardEvent,
  el: HTMLElement,
  row: Element,
  schema: RowSchema,
  group: FieldGroup,
  fieldIndex: number,
): boolean {
  const key = e.key;
  if (key !== " " && key !== "Tab") return false;
  if (!isAtEnd(el)) return false;
  if (isEmpty(el)) return false;

  // If group has a suffix (like {}), only Tab exits to pending, not space
  // Space should only move to next field within the group
  if (key === " " && group.suffix) {
    // Check if there's a next field in the group
    if (hasRequiredBareNextField(group, fieldIndex)) {
      e.preventDefault();
      trimField(el);
      const nextField = findNextFieldInGroup(group, fieldIndex);
      if (nextField) {
        const nextEl = findFieldElement(row, nextField.name);
        if (nextEl) {
          focusAtStart(nextEl);
          return true;
        }
      }
    }
    // No next field in suffix group, let space be typed (user needs to type } or Tab)
    return false;
  }

  e.preventDefault();
  trimField(el);

  // Check if next field in group is a required bare field
  if (hasRequiredBareNextField(group, fieldIndex)) {
    const nextField = findNextFieldInGroup(group, fieldIndex);
    if (nextField) {
      const nextEl = findFieldElement(row, nextField.name);
      if (nextEl) {
        focusAtStart(nextEl);
        return true;
      }
    }
  }

  // Try to find the next existing field in subsequent groups
  const groupIndex = schema.groups.indexOf(group);
  if (groupIndex !== -1) {
    for (let i = groupIndex + 1; i < schema.groups.length; i++) {
      const nextGroup = schema.groups[i];
      const firstFieldName = getFirstFieldOfGroup(nextGroup);
      const nextEl = findFieldElement(row, firstFieldName);
      if (nextEl) {
        focusAtStart(nextEl);
        return true;
      }
    }
  }

  // Otherwise go to pending
  moveToPending(row);
  return true;
}

export function handleFreetextFieldExit(
  e: KeyboardEvent,
  el: HTMLElement,
  row: Element,
  schema: RowSchema,
  group: GroupSpec,
  groupIndex: number,
  fieldName: string,
): boolean {
  const key = e.key;
  if (key !== "Tab") return false;

  // Always prevent default Tab behavior in freetext fields
  e.preventDefault();

  // Handle ambiguous-freetext groups (payee/narration)
  if (group.kind === "ambiguous-freetext") {
    // If we're in payee, try to go to narration
    if (fieldName === group.fields.first) {
      const narrationEl = findFieldElement(row, group.fields.second);
      if (narrationEl) {
        trimField(el);
        focusAtStart(narrationEl);
        return true;
      }
    }
    // If we're in narration (or payee with no narration), check for next group
  }

  // Check if there's a valid next group to tab to
  const hasNextGroup = hasValidNextGroup(schema, groupIndex);
  if (!hasNextGroup) {
    // No next group (e.g., inline comment at end), stay in field
    return true;
  }

  trimField(el);
  moveToPending(row);
  return true;
}

export function hasValidNextGroup(
  schema: RowSchema,
  fromIndex: number,
): boolean {
  for (let i = fromIndex + 1; i < schema.groups.length; i++) {
    const group = schema.groups[i];
    // A group is "valid" if it's not optional or has a trigger
    if (isFieldGroup(group)) {
      if (!group.optional || group.prefix) {
        return true;
      }
    } else {
      // ambiguous-freetext groups are valid targets
      return true;
    }
  }
  return false;
}

export function handleSuffixExit(
  e: KeyboardEvent,
  el: HTMLElement,
  row: Element,
  group: FieldGroup,
): boolean {
  const key = e.key;
  if (!group.suffix || key !== group.suffix) return false;

  e.preventDefault();
  trimField(el);
  moveToPending(row);
  return true;
}

export function moveToPrevField(
  row: Element,
  schema: RowSchema,
  group: GroupSpec,
  groupIndex: number,
  fieldIndex: number,
): void {
  // Try previous field in same group
  if (isFieldGroup(group) && fieldIndex > 0) {
    const prevField = group.fields[fieldIndex - 1];
    const el = findFieldElement(row, prevField.name);
    if (el) {
      focusAtEnd(el);
      return;
    }
  }

  // Try previous group
  for (let i = groupIndex - 1; i >= 0; i--) {
    const prevGroup = schema.groups[i];
    const lastFieldName = getLastFieldOfGroup(prevGroup);
    const el =
      isFieldGroup(prevGroup) && prevGroup.repeatable
        ? findLastRepeatableFieldElement(row, lastFieldName)
        : findFieldElement(row, lastFieldName);
    if (el) {
      focusAtEnd(el);
      return;
    }
  }
}

export function moveToNextField(
  row: Element,
  schema: RowSchema,
  group: GroupSpec,
  groupIndex: number,
  fieldIndex: number,
): void {
  // Try next field in same group
  if (isFieldGroup(group) && fieldIndex + 1 < group.fields.length) {
    const nextField = group.fields[fieldIndex + 1];
    const el = findFieldElement(row, nextField.name);
    if (el) {
      focusAtStart(el);
      return;
    }
  }

  // Try next group (skip triggered groups that don't exist)
  for (let i = groupIndex + 1; i < schema.groups.length; i++) {
    const nextGroup = schema.groups[i];
    const firstFieldName = getFirstFieldOfGroup(nextGroup);
    const el = findFieldElement(row, firstFieldName);
    if (el) {
      focusAtStart(el);
      return;
    }
  }

  // Go to pending
  moveToPending(row);
}

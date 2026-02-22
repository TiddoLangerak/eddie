/**
 * Field-specific exit and navigation handlers.
 */

import type { FieldGroup, GroupSpec, RowSchema } from "../fieldSchema.ts";
import { focusAtEnd, focusAtStart, isAtEnd, isEmpty } from "./cursor.ts";
import {
  findFieldElement,
  findLastRepeatableFieldElement,
  trimField,
} from "./dom.ts";
import { moveToPending } from "./pending.ts";
import {
  findNextFieldInGroup,
  getFirstFieldOfGroup,
  getLastFieldOfGroup,
  hasRequiredBareNextField,
  isFieldGroup,
} from "./schema.ts";

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

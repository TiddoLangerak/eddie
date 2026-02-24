/**
 * Pending field management and element creation.
 */

import type { FieldGroup, GroupSpec, RowSchema } from "../fieldSchema.ts";
import { focusAtEnd, focusAtStart, isAtStart, isEmpty } from "./cursor.ts";
import {
  createEditableSpan,
  findFieldElement,
  findLastRepeatableFieldElement,
  findPendingField,
  generateNextIndexedFieldName,
  trimField,
} from "./dom.ts";
import {
  findGroupByPrefix,
  findGroupWithMissingField,
  findNextDefaultGroup,
  getFirstFieldOfGroup,
  getLastFieldOfGroup,
  getTriggerPrefixes,
  isFieldGroup,
} from "./schema.ts";

export interface NavigationCallbacks {
  onCreateField: (el: HTMLElement) => void;
}

export function moveToPending(row: Element): void {
  const pending = findPendingField(row);
  if (pending) {
    pending.textContent = "";
    focusAtStart(pending);
  }
}

export function findLastFieldElement(
  row: Element,
  schema: RowSchema,
): HTMLElement | null {
  for (let i = schema.groups.length - 1; i >= 0; i--) {
    const group = schema.groups[i];
    const lastFieldName = getLastFieldOfGroup(group);
    const el =
      isFieldGroup(group) && group.repeatable
        ? findLastRepeatableFieldElement(row, lastFieldName)
        : findFieldElement(row, lastFieldName);
    if (el) {
      return el;
    }
  }
  return null;
}

/**
 * Find the first element of a group in the DOM, handling repeatable groups.
 */
function findFirstGroupElement(
  row: Element,
  group: GroupSpec,
): HTMLElement | null {
  const firstFieldName = getFirstFieldOfGroup(group);

  // For repeatable groups, we need to find ANY instance (first one in DOM order)
  if (isFieldGroup(group) && group.repeatable) {
    const pattern = new RegExp(`^${firstFieldName}(-\\d+)?$`);
    const allFields = row.querySelectorAll<HTMLElement>(
      '[data-field][contenteditable="true"]',
    );
    for (const el of allFields) {
      const fieldName = el.dataset.field;
      if (fieldName && pattern.test(fieldName)) {
        return el;
      }
    }
    return null;
  }

  return findFieldElement(row, firstFieldName);
}

/**
 * Find the correct insertion point for a group based on schema order.
 * Returns the element to insert before, or null if should insert before pending.
 */
function findInsertionPointForGroup(
  row: Element,
  schema: RowSchema,
  targetGroupIndex: number,
): HTMLElement | null {
  // Look for the first existing element that comes AFTER this group in schema order
  for (let i = targetGroupIndex + 1; i < schema.groups.length; i++) {
    const group = schema.groups[i];
    const el = findFirstGroupElement(row, group);
    if (el) {
      return el;
    }
  }
  // Nothing after, insert before pending
  return null;
}

export function createGroupElementsAtSchemaPosition(
  row: Element,
  schema: RowSchema,
  group: FieldGroup,
  groupIndex: number,
  callbacks: NavigationCallbacks,
  useUniqueNames = false,
): HTMLElement | null {
  const fragment = document.createDocumentFragment();

  // Create field spans (CSS handles prefixes/suffixes/spacing)
  let firstSpan: HTMLElement | null = null;
  for (let i = 0; i < group.fields.length; i++) {
    const field = group.fields[i];
    const fieldName = useUniqueNames
      ? generateNextIndexedFieldName(row, field.name)
      : field.name;
    const span = createEditableSpan(fieldName);
    callbacks.onCreateField(span);
    if (i === 0) {
      firstSpan = span;
    }
    fragment.appendChild(span);
  }

  // Find where to insert
  const insertBefore = findInsertionPointForGroup(row, schema, groupIndex);
  if (insertBefore) {
    insertBefore.before(fragment);
  } else {
    // Insert before pending
    const pending = findPendingField(row);
    if (pending) {
      pending.before(fragment);
    }
  }

  return firstSpan;
}

export function createRepeatableGroupInstance(
  afterEl: HTMLElement,
  group: FieldGroup,
  callbacks: NavigationCallbacks,
  row: Element,
): HTMLElement | null {
  const fragment = document.createDocumentFragment();

  // Create field spans (CSS handles prefixes/suffixes/spacing)
  let firstSpan: HTMLElement | null = null;
  for (let i = 0; i < group.fields.length; i++) {
    const field = group.fields[i];
    const uniqueName = generateNextIndexedFieldName(row, field.name);
    const span = createEditableSpan(uniqueName);
    callbacks.onCreateField(span);
    if (i === 0) {
      firstSpan = span;
    }
    fragment.appendChild(span);
  }

  afterEl.after(fragment);

  return firstSpan;
}

/**
 * Distribute pending text across multiple fields in a group.
 * Splits on space and assigns parts to corresponding fields.
 * E.g., "13 EUR" for price group → price-number="13", price-commodity="EUR"
 */
function distributePendingTextToGroup(
  row: Element,
  group: FieldGroup,
  pendingText: string,
): void {
  const parts = pendingText.split(/\s+/);
  for (let i = 0; i < group.fields.length && i < parts.length; i++) {
    const field = group.fields[i];
    const fieldEl = findFieldElement(row, field.name);
    if (fieldEl) {
      fieldEl.textContent = parts[i];
    }
  }
}

export function handlePendingField(
  e: KeyboardEvent,
  el: HTMLElement,
  row: Element,
  schema: RowSchema,
  callbacks: NavigationCallbacks,
): void {
  const key = e.key;

  // Arrow left: go back to last field
  if (key === "ArrowLeft" && isAtStart(el)) {
    e.preventDefault();
    trimField(el);
    const lastEl = findLastFieldElement(row, schema);
    if (lastEl) {
      focusAtEnd(lastEl);
    }
    return;
  }

  // Backspace on empty: go back to last field
  if (key === "Backspace" && isEmpty(el)) {
    e.preventDefault();
    const lastEl = findLastFieldElement(row, schema);
    if (lastEl) {
      focusAtEnd(lastEl);
    }
    return;
  }

  // Space: allow accumulation (will be trimmed on exit)
  if (key === " ") {
    return; // Let it through
  }

  // Check for trigger characters
  const found = findGroupByPrefix(schema, key);
  if (found) {
    e.preventDefault();
    // Capture pending text before clearing (for prepend behavior)
    const pendingText = (el.textContent ?? "").trim();
    el.textContent = "";

    const { group: targetGroup, groupIndex: targetGroupIndex } = found;
    const firstFieldName = getFirstFieldOfGroup(targetGroup);

    // For repeatable groups, create new instance after last existing one
    if (targetGroup.repeatable) {
      const lastEl = findLastRepeatableFieldElement(row, firstFieldName);
      if (lastEl) {
        const newEl = createRepeatableGroupInstance(
          lastEl,
          targetGroup,
          callbacks,
          row,
        );
        if (newEl) {
          newEl.textContent = pendingText;
          focusAtStart(newEl);
        }
        return;
      }
    }

    // Create new group at its schema-defined position
    const newEl = createGroupElementsAtSchemaPosition(
      row,
      schema,
      targetGroup,
      targetGroupIndex,
      callbacks,
      targetGroup.repeatable,
    );
    if (newEl) {
      // For multi-field groups, split pending text across fields
      if (isFieldGroup(targetGroup) && targetGroup.fields.length > 1 && pendingText.includes(" ")) {
        distributePendingTextToGroup(row, targetGroup, pendingText);
      } else {
        newEl.textContent = pendingText;
      }
      focusAtStart(newEl);
    }
    return;
  }

  // Non-trigger, non-space: check for ambiguous freetext group handling
  // or default field creation
  const triggers = getTriggerPrefixes(schema);
  if (key.length === 1 && !triggers.has(key)) {
    // Check if we should create a narration field (ambiguous freetext)
    for (let i = 0; i < schema.groups.length; i++) {
      const group = schema.groups[i];
      if (group.kind === "ambiguous-freetext") {
        // Check if narration already exists
        const narrationEl = findFieldElement(row, group.fields.second);
        if (!narrationEl) {
          // Create narration field (CSS handles spacing)
          e.preventDefault();
          trimField(el);
          const span = createEditableSpan(group.fields.second);
          callbacks.onCreateField(span);
          el.before(span);
          span.textContent = key;
          focusAtEnd(span);
          return;
        }
        // Narration exists - check if we should convert to payee + new narration
        const payeeEl = findFieldElement(row, group.fields.first);
        if (!payeeEl) {
          // Rename existing narration to payee, create new narration
          e.preventDefault();
          trimField(el);
          // Rename narration -> payee
          narrationEl.dataset.field = group.fields.first;
          // Create new narration span (CSS handles em-dash between payee and narration)
          const newNarration = createEditableSpan(group.fields.second);
          callbacks.onCreateField(newNarration);
          // DOM order: [payee] [narration] [pending]
          el.before(newNarration);
          newNarration.textContent = key;
          focusAtEnd(newNarration);
          return;
        }
      }
    }

    // Check for groups with missing fields (e.g., amount-number exists but amount-commodity was removed)
    const missingField = findGroupWithMissingField(row, schema);
    if (missingField) {
      e.preventDefault();
      trimField(el);
      const field = missingField.group.fields[missingField.missingFieldIndex];
      const span = createEditableSpan(field.name);
      callbacks.onCreateField(span);
      // Insert after the previous field in the group
      const prevField = missingField.group.fields[missingField.missingFieldIndex - 1];
      const prevEl = findFieldElement(row, prevField.name);
      if (prevEl) {
        prevEl.after(span);
      } else {
        el.before(span);
      }
      span.textContent = key;
      focusAtEnd(span);
      return;
    }

    // Check for next default group (optional group without trigger)
    const defaultGroup = findNextDefaultGroup(row, schema);
    if (defaultGroup) {
      e.preventDefault();
      trimField(el);
      const newEl = createGroupElementsAtSchemaPosition(
        row,
        schema,
        defaultGroup.group,
        defaultGroup.groupIndex,
        callbacks,
        false,
      );
      if (newEl) {
        newEl.textContent = key;
        focusAtEnd(newEl);
      }
      return;
    }
  }
}

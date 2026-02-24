/**
 * Field navigation handlers.
 *
 * This module implements keyboard navigation between contenteditable fields
 * based on the field schemas defined in fieldSchema.ts.
 *
 * Conceptually, we separate "editing" (cursor in middle of content) from
 * "appending" (cursor at end, adding new content). This file focuses on
 * appending behavior.
 *
 * Key behaviors:
 * - Regular fields: space/tab exits to next required field or pending area
 * - Whitespace-allowed fields: tab exits if there's a valid next group
 * - Suffix groups ({}): typing } exits to pending
 * - Pending area: accumulates spaces, trigger chars create fields, trim on exit
 * - Ambiguous payee/narration: resolved when second whitespace-allowed field is started
 */

import { getSchema } from "../fieldSchema.ts";
import { isAtEnd, isAtStart } from "./cursor.ts";
import { getRowType } from "./dom.ts";
import { handleEnterKey } from "./enter.ts";
import {
  handleBackspaceMerge,
  handleBareFieldExit,
  handleFreetextFieldExit,
  handleSuffixExit,
  moveToNextField,
  moveToPrevField,
} from "./handlers.ts";
import { type NavigationCallbacks, handlePendingField } from "./pending.ts";
import { findCurrentFieldInSchema, isFieldGroup } from "./schema.ts";

export type { NavigationCallbacks } from "./pending.ts";

export function createKeyDownHandler(
  callbacks: NavigationCallbacks,
): (e: Event) => void {
  return function handleKeyDown(e: Event): void {
    if (!(e instanceof KeyboardEvent)) return;
    const el = e.target;
    if (!(el instanceof HTMLElement)) return;

    const fieldName = el.dataset.field;
    if (!fieldName) return;

    const row = el.closest("tr");
    if (!row) return;

    const rowType = getRowType(row);
    if (!rowType) return;

    const schema = getSchema(rowType);
    if (!schema) return;

    const key = e.key;

    if (key === "Enter") {
      e.preventDefault();
      handleEnterKey(row, callbacks);
      return;
    }

    // Handle pending field separately
    if (fieldName === "pending") {
      handlePendingField(e, el, row, schema, callbacks);
      return;
    }

    // Find current field in schema
    const found = findCurrentFieldInSchema(schema, fieldName);
    if (!found) return;

    const { group, field, groupIndex, fieldIndex } = found;

    // Arrow key navigation
    if (key === "ArrowRight" && isAtEnd(el)) {
      e.preventDefault();
      moveToNextField(row, schema, group, groupIndex, fieldIndex);
      return;
    }

    if (key === "ArrowLeft" && isAtStart(el)) {
      e.preventDefault();
      moveToPrevField(row, schema, group, groupIndex, fieldIndex);
      return;
    }

    // Backspace at start: merge with previous field
    if (key === "Backspace" && isAtStart(el)) {
      if (
        handleBackspaceMerge(e, el, row, schema, group, groupIndex, fieldIndex)
      ) {
        return;
      }
    }

    // Field-type specific exit handling
    if (isFieldGroup(group)) {
      // Suffix exit (e.g., } for cost group)
      if (handleSuffixExit(e, el, row, group)) {
        return;
      }

      // Non-freetext field exit
      if (!field.canContainWhitespace) {
        if (handleBareFieldExit(e, el, row, schema, group, fieldIndex)) {
          return;
        }
      }
    }

    // Freetext field exit (Tab only, if there's a valid next group)
    if (field.canContainWhitespace) {
      if (
        handleFreetextFieldExit(
          e,
          el,
          row,
          schema,
          group,
          groupIndex,
          fieldName,
        )
      ) {
        return;
      }
    }

    // Auto-uppercase commodity fields
    if (isCommodityField(fieldName) && key.length === 1 && /[a-z]/.test(key)) {
      e.preventDefault();
      document.execCommand("insertText", false, key.toUpperCase());
    }
  };
}

function isCommodityField(fieldName: string): boolean {
  return (
    fieldName === "commodity" ||
    fieldName.endsWith("-commodity") ||
    fieldName.startsWith("commodity-")
  );
}

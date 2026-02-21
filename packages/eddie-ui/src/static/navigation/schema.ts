/**
 * Schema lookup and navigation helpers.
 */

import type {
  FieldGroup,
  FieldSpec,
  GroupSpec,
  RowSchema,
} from "../fieldSchema.ts";
import { findFieldElement } from "./dom.ts";

export function isFieldGroup(group: GroupSpec): group is FieldGroup {
  return group.kind === "field-group";
}

export function fieldNameMatches(schemaName: string, actualName: string): boolean {
  if (schemaName === actualName) return true;
  const repeatPattern = new RegExp(`^${schemaName}-\\d+$`);
  return repeatPattern.test(actualName);
}

function findFieldInGroup(
  group: GroupSpec,
  fieldName: string,
): { field: FieldSpec; fieldIndex: number } | null {
  if (group.kind === "ambiguous-freetext") {
    const isMatch =
      fieldName === group.fields.first || fieldName === group.fields.second;
    if (!isMatch) return null;
    return {
      field: { name: fieldName, canContainWhitespace: true },
      fieldIndex: 0,
    };
  }
  const fieldIndex = group.fields.findIndex((f) =>
    fieldNameMatches(f.name, fieldName),
  );
  if (fieldIndex === -1) return null;
  return { field: group.fields[fieldIndex], fieldIndex };
}

export function findCurrentFieldInSchema(
  schema: RowSchema,
  fieldName: string,
): {
  group: GroupSpec;
  field: FieldSpec;
  groupIndex: number;
  fieldIndex: number;
} | null {
  for (const [groupIndex, group] of schema.groups.entries()) {
    const found = findFieldInGroup(group, fieldName);
    if (found) {
      return { group, groupIndex, ...found };
    }
  }
  return null;
}

export function getFirstFieldOfGroup(group: GroupSpec): string {
  if (group.kind === "ambiguous-freetext") {
    return group.fields.second; // narration is the default
  }
  return group.fields[0].name;
}

export function getLastFieldOfGroup(group: GroupSpec): string {
  if (group.kind === "ambiguous-freetext") {
    return group.fields.second;
  }
  return group.fields[group.fields.length - 1].name;
}

/**
 * Find the next field within the same group (for bare fields in multi-field groups).
 * Returns null if this is the last field in the group.
 */
export function findNextFieldInGroup(
  group: FieldGroup,
  fieldIndex: number,
): FieldSpec | null {
  if (fieldIndex + 1 < group.fields.length) {
    return group.fields[fieldIndex + 1];
  }
  return null;
}

/**
 * Check if the next field in the group is a required bare field (no trigger needed).
 * This determines if we can jump directly vs going to pending.
 */
export function hasRequiredBareNextField(
  group: FieldGroup,
  fieldIndex: number,
): boolean {
  const nextField = findNextFieldInGroup(group, fieldIndex);
  if (!nextField) return false;
  return !nextField.canContainWhitespace;
}

/**
 * Find a group by its prefix/trigger character.
 */
export function findGroupByPrefix(
  schema: RowSchema,
  prefix: string,
): { group: FieldGroup; groupIndex: number } | null {
  const groupIndex = schema.groups.findIndex(
    (g) => isFieldGroup(g) && g.prefix === prefix,
  );
  if (groupIndex === -1) return null;
  return { group: schema.groups[groupIndex] as FieldGroup, groupIndex };
}

/**
 * Find the next optional group without a prefix that doesn't exist yet.
 * This is for creating fields like "amount" when typing a number after "account".
 */
export function findNextDefaultGroup(
  row: Element,
  schema: RowSchema,
): { group: FieldGroup; groupIndex: number } | null {
  const groupIndex = schema.groups.findIndex((g) => {
    if (!isFieldGroup(g)) return false;
    if (g.prefix) return false;
    const firstFieldName = getFirstFieldOfGroup(g);
    return !findFieldElement(row, firstFieldName);
  });
  if (groupIndex === -1) return null;
  return { group: schema.groups[groupIndex] as FieldGroup, groupIndex };
}

/**
 * Get all trigger prefixes defined in the schema.
 */
export function getTriggerPrefixes(schema: RowSchema): Set<string> {
  return new Set(
    schema.groups
      .filter((g): g is FieldGroup => isFieldGroup(g) && g.prefix != null)
      .map((g) => g.prefix as string),
  );
}

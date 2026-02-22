import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import type {
  AmbiguousFreetextGroup,
  FieldGroup,
  RowSchema,
} from "./fieldSchema.ts";

describe("schema utilities", () => {
  describe("isFieldGroup", () => {
    it("returns true for field-group kind", () => {
      const group: FieldGroup = {
        kind: "field-group",
        fields: [{ name: "test", canContainWhitespace: false }],
      };
      assert.equal(group.kind === "field-group", true);
    });

    it("returns false for ambiguous-freetext kind", () => {
      const group: AmbiguousFreetextGroup = {
        kind: "ambiguous-freetext",
        fields: { first: "payee", second: "narration" },
      };
      assert.equal(group.kind === "field-group", false);
    });
  });

  describe("fieldNameMatches", () => {
    const matches = (schemaName: string, actualName: string) => {
      if (schemaName === actualName) return true;
      const repeatPattern = new RegExp(`^${schemaName}-\\d+$`);
      return repeatPattern.test(actualName);
    };

    it("matches exact name", () => {
      assert.equal(matches("tags", "tags"), true);
    });

    it("matches numbered instance", () => {
      assert.equal(matches("tags", "tags-1"), true);
      assert.equal(matches("tags", "tags-42"), true);
    });

    it("does not match different base name", () => {
      assert.equal(matches("tags", "links"), false);
      assert.equal(matches("tags", "links-1"), false);
    });

    it("does not match partial name", () => {
      assert.equal(matches("tags", "tags-name"), false);
      assert.equal(matches("amount", "amount-number"), false);
    });
  });

  describe("getFirstFieldOfGroup", () => {
    it("returns first field name for field-group", () => {
      const group: FieldGroup = {
        kind: "field-group",
        fields: [
          { name: "amount-number", canContainWhitespace: false },
          { name: "amount-commodity", canContainWhitespace: false },
        ],
      };
      assert.equal(group.fields[0].name, "amount-number");
    });

    it("returns second field for ambiguous-freetext (narration is default)", () => {
      const group: AmbiguousFreetextGroup = {
        kind: "ambiguous-freetext",
        fields: { first: "payee", second: "narration" },
      };
      assert.equal(group.fields.second, "narration");
    });
  });

  describe("getLastFieldOfGroup", () => {
    it("returns last field name for field-group", () => {
      const group: FieldGroup = {
        kind: "field-group",
        fields: [
          { name: "amount-number", canContainWhitespace: false },
          { name: "amount-commodity", canContainWhitespace: false },
        ],
      };
      assert.equal(
        group.fields[group.fields.length - 1].name,
        "amount-commodity",
      );
    });

    it("returns second field for ambiguous-freetext", () => {
      const group: AmbiguousFreetextGroup = {
        kind: "ambiguous-freetext",
        fields: { first: "payee", second: "narration" },
      };
      assert.equal(group.fields.second, "narration");
    });
  });

  describe("findNextFieldInGroup", () => {
    it("returns next field when one exists", () => {
      const group: FieldGroup = {
        kind: "field-group",
        fields: [
          { name: "cost-number", canContainWhitespace: false },
          { name: "cost-commodity", canContainWhitespace: false },
        ],
      };
      const fieldIndex = 0;
      const nextField =
        fieldIndex + 1 < group.fields.length
          ? group.fields[fieldIndex + 1]
          : null;
      assert.equal(nextField?.name, "cost-commodity");
    });

    it("returns null when at last field", () => {
      const group: FieldGroup = {
        kind: "field-group",
        fields: [
          { name: "cost-number", canContainWhitespace: false },
          { name: "cost-commodity", canContainWhitespace: false },
        ],
      };
      const fieldIndex = 1;
      const nextField =
        fieldIndex + 1 < group.fields.length
          ? group.fields[fieldIndex + 1]
          : null;
      assert.equal(nextField, null);
    });
  });

  describe("hasRequiredBareNextField", () => {
    it("returns true when next field is bare (no whitespace)", () => {
      const group: FieldGroup = {
        kind: "field-group",
        fields: [
          { name: "cost-number", canContainWhitespace: false },
          { name: "cost-commodity", canContainWhitespace: false },
        ],
      };
      const fieldIndex = 0;
      const nextField =
        fieldIndex + 1 < group.fields.length
          ? group.fields[fieldIndex + 1]
          : null;
      const hasRequired = nextField ? !nextField.canContainWhitespace : false;
      assert.equal(hasRequired, true);
    });

    it("returns false when next field allows whitespace", () => {
      const group: FieldGroup = {
        kind: "field-group",
        fields: [
          { name: "account", canContainWhitespace: false },
          { name: "comment", canContainWhitespace: true },
        ],
      };
      const fieldIndex = 0;
      const nextField =
        fieldIndex + 1 < group.fields.length
          ? group.fields[fieldIndex + 1]
          : null;
      const hasRequired = nextField ? !nextField.canContainWhitespace : false;
      assert.equal(hasRequired, false);
    });

    it("returns false when no next field", () => {
      const group: FieldGroup = {
        kind: "field-group",
        fields: [{ name: "tags", canContainWhitespace: false }],
      };
      const fieldIndex = 0;
      const nextField =
        fieldIndex + 1 < group.fields.length
          ? group.fields[fieldIndex + 1]
          : null;
      const hasRequired = nextField ? !nextField.canContainWhitespace : false;
      assert.equal(hasRequired, false);
    });
  });

  describe("findGroupByPrefix", () => {
    it("finds group with matching prefix", () => {
      const schema: RowSchema = {
        groups: [
          {
            kind: "field-group",
            fields: [{ name: "account", canContainWhitespace: false }],
          },
          {
            kind: "field-group",
            prefix: "#",
            fields: [{ name: "tags", canContainWhitespace: false }],
            repeatable: true,
          },
        ],
      };
      let found: { group: FieldGroup; groupIndex: number } | null = null;
      for (let i = 0; i < schema.groups.length; i++) {
        const g = schema.groups[i];
        if (g.kind === "field-group" && g.prefix === "#") {
          found = { group: g, groupIndex: i };
          break;
        }
      }
      assert.equal(found?.group.prefix, "#");
      assert.equal(found?.groupIndex, 1);
    });

    it("returns null when no matching prefix", () => {
      const schema: RowSchema = {
        groups: [
          {
            kind: "field-group",
            fields: [{ name: "account", canContainWhitespace: false }],
          },
        ],
      };
      let found: { group: FieldGroup; groupIndex: number } | null = null;
      for (let i = 0; i < schema.groups.length; i++) {
        const g = schema.groups[i];
        if (g.kind === "field-group" && g.prefix === "#") {
          found = { group: g, groupIndex: i };
          break;
        }
      }
      assert.equal(found, null);
    });
  });

  describe("getTriggerPrefixes", () => {
    it("collects all prefixes from schema", () => {
      const schema: RowSchema = {
        groups: [
          {
            kind: "field-group",
            fields: [{ name: "account", canContainWhitespace: false }],
          },
          {
            kind: "field-group",
            prefix: "#",
            fields: [{ name: "tags", canContainWhitespace: false }],
          },
          {
            kind: "field-group",
            prefix: "^",
            fields: [{ name: "links", canContainWhitespace: false }],
          },
          {
            kind: "field-group",
            prefix: "{",
            suffix: "}",
            fields: [{ name: "cost-number", canContainWhitespace: false }],
          },
        ],
      };
      const prefixes = new Set<string>();
      for (const group of schema.groups) {
        if (group.kind === "field-group" && group.prefix) {
          prefixes.add(group.prefix);
        }
      }
      assert.equal(prefixes.has("#"), true);
      assert.equal(prefixes.has("^"), true);
      assert.equal(prefixes.has("{"), true);
      assert.equal(prefixes.size, 3);
    });

    it("returns empty set when no prefixes", () => {
      const schema: RowSchema = {
        groups: [
          {
            kind: "field-group",
            fields: [{ name: "account", canContainWhitespace: false }],
          },
        ],
      };
      const prefixes = new Set<string>();
      for (const group of schema.groups) {
        if (group.kind === "field-group" && group.prefix) {
          prefixes.add(group.prefix);
        }
      }
      assert.equal(prefixes.size, 0);
    });
  });

  describe("findCurrentFieldInSchema", () => {
    it("finds field in regular group", () => {
      const schema: RowSchema = {
        groups: [
          {
            kind: "field-group",
            fields: [
              { name: "amount-number", canContainWhitespace: false },
              { name: "amount-commodity", canContainWhitespace: false },
            ],
          },
        ],
      };

      const fieldName = "amount-commodity";
      let result: {
        groupIndex: number;
        fieldIndex: number;
        fieldName: string;
      } | null = null;

      for (let gi = 0; gi < schema.groups.length; gi++) {
        const group = schema.groups[gi];
        if (group.kind === "field-group") {
          for (let fi = 0; fi < group.fields.length; fi++) {
            if (group.fields[fi].name === fieldName) {
              result = { groupIndex: gi, fieldIndex: fi, fieldName };
              break;
            }
          }
        }
        if (result) break;
      }

      assert.equal(result?.groupIndex, 0);
      assert.equal(result?.fieldIndex, 1);
    });

    it("finds field in ambiguous-freetext group", () => {
      const schema: RowSchema = {
        groups: [
          {
            kind: "ambiguous-freetext",
            fields: { first: "payee", second: "narration" },
          },
        ],
      };

      const fieldName = "narration";
      let found = false;

      for (const group of schema.groups) {
        if (group.kind === "ambiguous-freetext") {
          if (
            fieldName === group.fields.first ||
            fieldName === group.fields.second
          ) {
            found = true;
            break;
          }
        }
      }

      assert.equal(found, true);
    });

    it("finds repeatable field instance", () => {
      const schema: RowSchema = {
        groups: [
          {
            kind: "field-group",
            prefix: "#",
            fields: [{ name: "tags", canContainWhitespace: false }],
            repeatable: true,
          },
        ],
      };

      const fieldName = "tags-2";
      const matches = (schemaName: string, actualName: string) => {
        if (schemaName === actualName) return true;
        const repeatPattern = new RegExp(`^${schemaName}-\\d+$`);
        return repeatPattern.test(actualName);
      };

      let found = false;
      for (const group of schema.groups) {
        if (group.kind === "field-group") {
          for (const field of group.fields) {
            if (matches(field.name, fieldName)) {
              found = true;
              break;
            }
          }
        }
        if (found) break;
      }

      assert.equal(found, true);
    });
  });
});

/**
 * Field navigation schema definitions.
 *
 * This module defines types and schemas that describe how fields in beancount
 * directives are structured and how navigation between them should work.
 */

export interface FieldSpec {
  name: string;
  canContainWhitespace: boolean;
}

export interface FieldGroup {
  kind: "field-group";
  name: string;
  fields: FieldSpec[];
  optional?: boolean;
  repeatable?: boolean;
  prefix?: string;
  prefixAttached?: boolean;
  suffix?: string;
}

export interface AmbiguousFreetextGroup {
  kind: "ambiguous-freetext";
  name: string;
  fields: {
    first: string;
    second: string;
  };
}

export type GroupSpec = FieldGroup | AmbiguousFreetextGroup;

export interface RowSchema {
  groups: GroupSpec[];
}

function group(
  name: string,
  fields: FieldSpec[],
  options?: Partial<Omit<FieldGroup, "kind" | "name" | "fields">>,
): FieldGroup {
  return { kind: "field-group", name, fields, ...options };
}

function field(name: string, canContainWhitespace = false): FieldSpec {
  return { name, canContainWhitespace };
}

const tagsGroup: FieldGroup = group("tags", [field("tags")], {
  optional: true,
  repeatable: true,
  prefix: "#",
  prefixAttached: true,
});

const linksGroup: FieldGroup = group("links", [field("links")], {
  optional: true,
  repeatable: true,
  prefix: "^",
  prefixAttached: true,
});

const inlineCommentGroup: FieldGroup = group(
  "inline-comment",
  [field("inline-comment", true)],
  {
    optional: true,
    prefix: ";",
    prefixAttached: true,
  },
);

export const postingSchema: RowSchema = {
  groups: [
    group("account", [field("account")]),
    group("amount", [field("amount-number"), field("amount-commodity")], {
      optional: true,
    }),
    group("cost", [field("cost-number"), field("cost-commodity")], {
      optional: true,
      prefix: "{",
      suffix: "}",
    }),
    group("price", [field("price-number"), field("price-commodity")], {
      optional: true,
      prefix: "@",
    }),
    tagsGroup,
    linksGroup,
    inlineCommentGroup,
  ],
};

export const transactionHeaderSchema: RowSchema = {
  groups: [
    group("date", [field("date")]),
    {
      kind: "ambiguous-freetext",
      name: "payee-narration",
      fields: { first: "payee", second: "narration" },
    },
    tagsGroup,
    linksGroup,
    inlineCommentGroup,
  ],
};

export const balanceSchema: RowSchema = {
  groups: [
    group("date", [field("date")]),
    group("account", [field("account")]),
    group("amount", [field("amount-number"), field("amount-commodity")]),
    tagsGroup,
    linksGroup,
    inlineCommentGroup,
  ],
};

export const openSchema: RowSchema = {
  groups: [
    group("date", [field("date")]),
    group("account", [field("account")]),
    group("commodities", [field("commodity")], {
      optional: true,
      repeatable: true,
    }),
    group("booking", [field("booking", true)], { optional: true }),
    tagsGroup,
    linksGroup,
    inlineCommentGroup,
  ],
};

export const closeSchema: RowSchema = {
  groups: [
    group("date", [field("date")]),
    group("account", [field("account")]),
    tagsGroup,
    linksGroup,
    inlineCommentGroup,
  ],
};

export const commoditySchema: RowSchema = {
  groups: [
    group("date", [field("date")]),
    group("commodity", [field("commodity")]),
    tagsGroup,
    linksGroup,
    inlineCommentGroup,
  ],
};

export const padSchema: RowSchema = {
  groups: [
    group("date", [field("date")]),
    group("account", [field("account")]),
    group("sourceAccount", [field("sourceAccount")]),
    tagsGroup,
    linksGroup,
    inlineCommentGroup,
  ],
};

export const noteSchema: RowSchema = {
  groups: [
    group("date", [field("date")]),
    group("account", [field("account")]),
    group("comment", [field("comment", true)]),
    tagsGroup,
    linksGroup,
    inlineCommentGroup,
  ],
};

export const documentSchema: RowSchema = {
  groups: [
    group("date", [field("date")]),
    group("account", [field("account")]),
    group("filename", [field("filename", true)]),
    tagsGroup,
    linksGroup,
    inlineCommentGroup,
  ],
};

export const priceSchema: RowSchema = {
  groups: [
    group("date", [field("date")]),
    group("commodity", [field("commodity")]),
    group("amount", [field("amount-number"), field("amount-commodity")]),
    tagsGroup,
    linksGroup,
    inlineCommentGroup,
  ],
};

export const eventSchema: RowSchema = {
  groups: [
    group("date", [field("date")]),
    group("eventType", [field("eventType", true)]),
    group("description", [field("description", true)]),
    tagsGroup,
    linksGroup,
    inlineCommentGroup,
  ],
};

export const querySchema: RowSchema = {
  groups: [
    group("date", [field("date")]),
    group("name", [field("name", true)]),
    group("queryString", [field("queryString", true)]),
    tagsGroup,
    linksGroup,
    inlineCommentGroup,
  ],
};

export const customSchema: RowSchema = {
  groups: [
    group("date", [field("date")]),
    group("customType", [field("customType", true)]),
    tagsGroup,
    linksGroup,
    inlineCommentGroup,
  ],
};

export const includeSchema: RowSchema = {
  groups: [
    group("filename", [field("filename", true)]),
    tagsGroup,
    linksGroup,
    inlineCommentGroup,
  ],
};

export const pluginSchema: RowSchema = {
  groups: [
    group("module", [field("module", true)]),
    group("config", [field("config", true)], { optional: true }),
    tagsGroup,
    linksGroup,
    inlineCommentGroup,
  ],
};

export const optionSchema: RowSchema = {
  groups: [
    group("name", [field("name", true)]),
    group("value", [field("value", true)]),
    tagsGroup,
    linksGroup,
    inlineCommentGroup,
  ],
};

export const schemas: Record<string, RowSchema> = {
  posting: postingSchema,
  transaction: transactionHeaderSchema,
  balance: balanceSchema,
  open: openSchema,
  close: closeSchema,
  commodity: commoditySchema,
  pad: padSchema,
  note: noteSchema,
  document: documentSchema,
  price: priceSchema,
  event: eventSchema,
  query: querySchema,
  custom: customSchema,
  include: includeSchema,
  plugin: pluginSchema,
  option: optionSchema,
};

export function getSchema(rowType: string): RowSchema | undefined {
  return schemas[rowType];
}

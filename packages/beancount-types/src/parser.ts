import {
  array,
  literal,
  object,
  oneOf,
  optional,
  string,
} from "@tiddo/eddie-parry";
import type { ParryParser, ParryResult } from "@tiddo/eddie-parry";
import { err, isErr, ok } from "@tiddo/eddie-parry";
import type {
  BeancountFile,
  CommentOrBlank,
  Directive,
  FormattingInfo,
} from "./index.ts";

/**
 * Parses an unknown value into a BeancountFile. Use this to validate
 * JSON or other untrusted data before using it as a BeancountFile.
 */
export function parseBeancountFile(value: unknown): ParryResult<BeancountFile> {
  return beancountFileParser(value);
}

export { isErr, isOk } from "@tiddo/eddie-parry";

function recordParser(): ParryParser<Record<string, unknown>> {
  return (value) => {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return err((ref) => `${ref} is not an object`);
    }
    return ok(Object.fromEntries(Object.entries(value)));
  };
}

function unknownParser(): ParryParser<unknown> {
  return (v) => ok(v);
}

const commentOrBlank = oneOf<CommentOrBlank>(
  object({ kind: literal("blank") }),
  object({ kind: literal("comment"), comment: string() }),
);

const formattingInfo: ParryParser<FormattingInfo> = object({
  header: array(commentOrBlank),
  footer: array(commentOrBlank),
  inlineComment: optional(string()),
});

const amount = object({
  number: string(),
  commodity: string(),
});

const optionalStringArray = optional(array(string()));

const posting = object({
  account: string(),
  amount: optional(amount),
  cost: optional(amount),
  price: optional(amount),
  metadata: recordParser(),
  formatting: formattingInfo,
});

const include = object({
  type: literal("include"),
  filename: string(),
  tags: optionalStringArray,
  links: optionalStringArray,
  formatting: formattingInfo,
});

const plugin = object({
  type: literal("plugin"),
  module: string(),
  config: optional(string()),
  tags: optionalStringArray,
  links: optionalStringArray,
  formatting: formattingInfo,
});

const option = object({
  type: literal("option"),
  name: string(),
  value: string(),
  tags: optionalStringArray,
  links: optionalStringArray,
  formatting: formattingInfo,
});

const transaction = object({
  type: literal("transaction"),
  date: string(),
  flag: string(),
  payee: optional(string()),
  narration: string(),
  tags: array(string()),
  links: array(string()),
  postings: array(posting),
  metadata: recordParser(),
  metadataHeader: array(commentOrBlank),
  formatting: formattingInfo,
});

const balance = object({
  type: literal("balance"),
  date: string(),
  account: string(),
  amount,
  tags: optionalStringArray,
  links: optionalStringArray,
  formatting: formattingInfo,
});

const open = object({
  type: literal("open"),
  date: string(),
  account: string(),
  commodities: array(string()),
  booking: optional(string()),
  tags: optionalStringArray,
  links: optionalStringArray,
  formatting: formattingInfo,
});

const close = object({
  type: literal("close"),
  date: string(),
  account: string(),
  tags: optionalStringArray,
  links: optionalStringArray,
  formatting: formattingInfo,
});

const commodity = object({
  type: literal("commodity"),
  date: string(),
  commodity: string(),
  tags: optionalStringArray,
  links: optionalStringArray,
  formatting: formattingInfo,
});

const pad = object({
  type: literal("pad"),
  date: string(),
  account: string(),
  sourceAccount: string(),
  tags: optionalStringArray,
  links: optionalStringArray,
  formatting: formattingInfo,
});

const note = object({
  type: literal("note"),
  date: string(),
  account: string(),
  comment: string(),
  tags: optionalStringArray,
  links: optionalStringArray,
  formatting: formattingInfo,
});

const document = object({
  type: literal("document"),
  date: string(),
  account: string(),
  filename: string(),
  tags: optionalStringArray,
  links: optionalStringArray,
  formatting: formattingInfo,
});

const price = object({
  type: literal("price"),
  date: string(),
  commodity: string(),
  amount,
  tags: optionalStringArray,
  links: optionalStringArray,
  formatting: formattingInfo,
});

const event = object({
  type: literal("event"),
  date: string(),
  eventType: string(),
  description: string(),
  tags: optionalStringArray,
  links: optionalStringArray,
  formatting: formattingInfo,
});

const query = object({
  type: literal("query"),
  date: string(),
  name: string(),
  queryString: string(),
  tags: optionalStringArray,
  links: optionalStringArray,
  formatting: formattingInfo,
});

const custom = object({
  type: literal("custom"),
  date: string(),
  customType: string(),
  values: array(unknownParser()),
  tags: optionalStringArray,
  links: optionalStringArray,
  formatting: formattingInfo,
});

const directive = oneOf<Directive>(
  transaction,
  include,
  plugin,
  option,
  balance,
  open,
  close,
  commodity,
  pad,
  note,
  document,
  price,
  event,
  query,
  custom,
);

const beancountFileParser: ParryParser<BeancountFile> = object({
  directives: array(directive),
  header: array(commentOrBlank),
  footer: array(commentOrBlank),
  metadata: recordParser(),
});

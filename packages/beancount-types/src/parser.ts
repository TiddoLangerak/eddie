import {
  array,
  literal,
  object,
  oneOf,
  optional,
  record,
  string,
  unknown,
} from "@tiddo/eddie-parry";
import type {
  Amount,
  Balance,
  BeancountFile,
  Close,
  CommentOrBlank,
  Commodity,
  Custom,
  Directive,
  Document,
  Event,
  FormattingInfo,
  Include,
  Note,
  Open,
  Option,
  Pad,
  Plugin,
  Posting,
  Price,
  Query,
  Transaction,
} from "./index.ts";

const commentOrBlank = oneOf<CommentOrBlank>(
  object({ kind: literal("blank") }),
  object({ kind: literal("comment"), comment: string() }),
);

const formattingInfo = object<FormattingInfo>({
  header: array(commentOrBlank),
  footer: array(commentOrBlank),
  inlineComment: optional(string()),
});

const amount = object<Amount>({
  number: string(),
  commodity: string(),
});

const posting = object<Posting>({
  account: string(),
  amount: optional(amount),
  cost: optional(amount),
  price: optional(amount),
  metadata: record(),
  formatting: formattingInfo,
});

const include = object<Include>({
  type: literal("include"),
  filename: string(),
  tags: optional(array(string())),
  links: optional(array(string())),
  formatting: formattingInfo,
});

const plugin = object<Plugin>({
  type: literal("plugin"),
  module: string(),
  config: optional(string()),
  tags: optional(array(string())),
  links: optional(array(string())),
  formatting: formattingInfo,
});

const option = object<Option>({
  type: literal("option"),
  name: string(),
  value: string(),
  tags: optional(array(string())),
  links: optional(array(string())),
  formatting: formattingInfo,
});

const transaction = object<Transaction>({
  type: literal("transaction"),
  date: string(),
  flag: string(),
  payee: optional(string()),
  narration: string(),
  tags: array(string()),
  links: array(string()),
  postings: array(posting),
  metadata: record(),
  metadataHeader: array(commentOrBlank),
  formatting: formattingInfo,
});

const balance = object<Balance>({
  type: literal("balance"),
  date: string(),
  account: string(),
  amount,
  tags: optional(array(string())),
  links: optional(array(string())),
  formatting: formattingInfo,
});

const open = object<Open>({
  type: literal("open"),
  date: string(),
  account: string(),
  commodities: array(string()),
  booking: optional(string()),
  tags: optional(array(string())),
  links: optional(array(string())),
  formatting: formattingInfo,
});

const close = object<Close>({
  type: literal("close"),
  date: string(),
  account: string(),
  tags: optional(array(string())),
  links: optional(array(string())),
  formatting: formattingInfo,
});

const commodity = object<Commodity>({
  type: literal("commodity"),
  date: string(),
  commodity: string(),
  tags: optional(array(string())),
  links: optional(array(string())),
  formatting: formattingInfo,
});

const pad = object<Pad>({
  type: literal("pad"),
  date: string(),
  account: string(),
  sourceAccount: string(),
  tags: optional(array(string())),
  links: optional(array(string())),
  formatting: formattingInfo,
});

const note = object<Note>({
  type: literal("note"),
  date: string(),
  account: string(),
  comment: string(),
  tags: optional(array(string())),
  links: optional(array(string())),
  formatting: formattingInfo,
});

const document = object<Document>({
  type: literal("document"),
  date: string(),
  account: string(),
  filename: string(),
  tags: optional(array(string())),
  links: optional(array(string())),
  formatting: formattingInfo,
});

const price = object<Price>({
  type: literal("price"),
  date: string(),
  commodity: string(),
  amount,
  tags: optional(array(string())),
  links: optional(array(string())),
  formatting: formattingInfo,
});

const event = object<Event>({
  type: literal("event"),
  date: string(),
  eventType: string(),
  description: string(),
  tags: optional(array(string())),
  links: optional(array(string())),
  formatting: formattingInfo,
});

const query = object<Query>({
  type: literal("query"),
  date: string(),
  name: string(),
  queryString: string(),
  tags: optional(array(string())),
  links: optional(array(string())),
  formatting: formattingInfo,
});

const custom = object<Custom>({
  type: literal("custom"),
  date: string(),
  customType: string(),
  values: array(unknown()),
  tags: optional(array(string())),
  links: optional(array(string())),
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

export const beancountFile = object<BeancountFile>({
  directives: array(directive),
  header: array(commentOrBlank),
  footer: array(commentOrBlank),
  metadata: record(),
});

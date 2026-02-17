/**
 * Beancount directive parsers.
 */

import type {
  Balance,
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
  Pad,
  Plugin,
  Posting,
  Price,
  Query,
  Transaction,
} from "@tiddo/beancount-types";
import {
  first,
  map,
  optional,
  repeated,
  sepBy,
  sequence,
  string,
} from "./combinators.ts";
import type { Parser, ParserResult, ParserState } from "./combinators.ts";
import {
  afterOptionalWhitespace,
  afterWhitespace,
  boolean,
  currency,
  flag,
  key,
  number,
  optionalWhitespace,
  quotedString,
  whitespace,
} from "./lexical.ts";
import type { Metadata, MetadataValue } from "./primitives.ts";
import {
  account,
  amount,
  blankLinesAndComments,
  commentedLine,
  date,
  links,
  metadataLine,
  postingLine,
  postingMetadataLine,
  tags,
  transactionMetadataLine,
} from "./primitives.ts";

function directiveHeader<
  TType extends string,
  TData extends Record<string, unknown>,
>(
  type: TType,
  params: Parser<TData>,
): Parser<{ type: TType; date: string; formatting: FormattingInfo } & TData> {
  return map(
    commentedLine(date, whitespace, string(type), params),
    ({ parts: [date, , , params], comment }) => ({
      type,
      date,
      ...params,
      formatting: { header: [], footer: [], inlineComment: comment },
    }),
  );
}

const postingBody = map(
  sequence(blankLinesAndComments, postingLine, repeated(postingMetadataLine)),
  ([commentsBefore, line, metadataLines]) => ({
    ...line,
    commentsBefore,
    metadata: Object.fromEntries(metadataLines.map((m) => [m.key, m.value])),
  }),
);

const transactionBody = map(
  sequence(
    blankLinesAndComments,
    repeated(transactionMetadataLine),
    repeated(postingBody),
  ),
  ([metadataHeader, metadataLines, postings]) => ({
    metadataHeader,
    metadata: Object.fromEntries(metadataLines.map((m) => [m.key, m.value])),
    postings,
  }),
);

type TransactionHeader = {
  date: string;
  flag: string;
  payee: string | undefined;
  narration: string;
  tags: string[];
  links: string[];
  inlineComment: string | undefined;
};

const payeeAndNarration = map(
  sequence(
    afterWhitespace(quotedString),
    optional(afterWhitespace(quotedString)),
  ),
  ([firstString, secondString]) => {
    if (secondString !== undefined) {
      return { payee: firstString, narration: secondString };
    }
    return { payee: undefined, narration: firstString };
  },
);

const transactionHeader = map(
  commentedLine(
    date,
    whitespace,
    flag,
    payeeAndNarration,
    optional(afterOptionalWhitespace(tags)),
    optional(afterOptionalWhitespace(links)),
  ),
  ({
    parts: [date, , flag, { payee, narration }, tags, links],
    comment: inlineComment,
  }) => ({
    date,
    flag,
    payee,
    narration,
    tags: tags ?? [],
    links: links ?? [],
    inlineComment,
  }),
);

const transaction = map(
  sequence(transactionHeader, transactionBody),
  ([header, body]) => ({
    type: "transaction" as const,
    date: header.date,
    flag: header.flag,
    payee: header.payee,
    narration: header.narration,
    tags: header.tags,
    links: header.links,
    postings: body.postings.map((p) => {
      const { inlineComment, commentsBefore, ...rest } = p;
      return {
        ...rest,
        formatting: { header: commentsBefore, footer: [], inlineComment },
      };
    }),
    metadata: body.metadata,
    metadataHeader: body.metadataHeader,
    formatting: {
      header: [],
      footer: [],
      inlineComment: header.inlineComment,
    },
  }),
);

const open: Parser<Open> = directiveHeader(
  "open",
  map(
    sequence(
      whitespace,
      account,
      optional(
        afterWhitespace(
          sepBy(
            currency,
            sequence(optionalWhitespace, string(","), optionalWhitespace),
          ),
        ),
      ),
      optional(afterWhitespace(quotedString)),
    ),
    ([, account, currencies, booking]) => ({
      account,
      currencies: currencies ?? [],
      booking,
    }),
  ),
);

const close: Parser<Close> = directiveHeader(
  "close",
  map(sequence(whitespace, account), ([, account]) => ({ account })),
);

const balance: Parser<Balance> = directiveHeader(
  "balance",
  map(
    sequence(whitespace, account, whitespace, amount),
    ([, account, , amount]) => ({ account, amount }),
  ),
);

const commodity: Parser<Commodity> = directiveHeader(
  "commodity",
  map(sequence(whitespace, currency), ([, currency]) => ({ currency })),
);

const pad: Parser<Pad> = directiveHeader(
  "pad",
  map(
    sequence(whitespace, account, whitespace, account),
    ([, account, , sourceAccount]) => ({ account, sourceAccount }),
  ),
);

const note: Parser<Note> = directiveHeader(
  "note",
  map(
    sequence(whitespace, account, whitespace, quotedString),
    ([, account, , comment]) => ({ account, comment }),
  ),
);

const document: Parser<Document> = directiveHeader(
  "document",
  map(
    sequence(whitespace, account, whitespace, quotedString),
    ([, account, , filename]) => ({ account, filename }),
  ),
);

const priceDirective: Parser<Price> = directiveHeader(
  "price",
  map(
    sequence(whitespace, currency, whitespace, amount),
    ([, currency, , amount]) => ({ currency, amount }),
  ),
);

const event: Parser<Event> = directiveHeader(
  "event",
  map(
    sequence(whitespace, quotedString, whitespace, quotedString),
    ([, eventType, , description]) => ({ eventType, description }),
  ),
);

const query: Parser<Query> = directiveHeader(
  "query",
  map(
    sequence(whitespace, quotedString, whitespace, quotedString),
    ([, name, , queryString]) => ({ name, queryString }),
  ),
);

const customValue: Parser<unknown> = first<unknown>(
  quotedString,
  number,
  amount,
  date,
  boolean,
);

const custom: Parser<Custom> = directiveHeader(
  "custom",
  map(
    sequence(whitespace, quotedString, repeated(afterWhitespace(customValue))),
    ([, customType, values]) => ({ customType, values }),
  ),
);

const include: Parser<Include> = map(
  commentedLine(string("include"), afterWhitespace(quotedString)),
  ({ parts: [, filename], comment }) => ({
    type: "include",
    filename,
    formatting: { header: [], footer: [], inlineComment: comment },
  }),
);

const plugin: Parser<Plugin> = map(
  commentedLine(
    string("plugin"),
    afterWhitespace(quotedString),
    optional(afterWhitespace(quotedString)),
  ),
  ({ parts: [, module, config], comment }) => ({
    type: "plugin",
    module,
    config,
    formatting: { header: [], footer: [], inlineComment: comment },
  }),
);

export const directive: Parser<Directive> = first<Directive>(
  include,
  plugin,
  transaction,
  open,
  close,
  balance,
  commodity,
  pad,
  note,
  document,
  priceDirective,
  event,
  query,
  custom,
);

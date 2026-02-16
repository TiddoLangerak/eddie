/**
 * Primitive (compound) parsers building on lexical tokens.
 */

import type { Amount } from "@Tiddo/beancount-types";
import {
  between,
  first,
  map,
  optional,
  sepByAtLeastOnce,
  sequence,
  string,
} from "./combinators.ts";
import type { Parser } from "./combinators.ts";
import {
  account as accountLex,
  afterOptionalWhitespace,
  afterWhitespace,
  currency,
  date as dateLex,
  key,
  lineComment,
  lineEnd,
  link,
  number,
  optionalWhitespace,
  quotedString,
  tag,
  whitespace,
} from "./lexical.ts";

export type MetadataValue = string | number;
export type Metadata = { key: string; value: MetadataValue };

const optionalInlineComment: Parser<string | undefined> = optional(
  afterOptionalWhitespace(lineComment),
);

export function line<TFirst, TRest extends unknown[]>(
  first: Parser<TFirst>,
  ...rest: { [K in keyof TRest]: Parser<TRest[K]> }
): Parser<[TFirst, ...TRest]> {
  return map(
    sequence(first, ...rest, lineEnd),
    (arr) => arr.slice(0, -1) as [TFirst, ...TRest],
  );
}

export function commentedLine<TFirst, TRest extends unknown[]>(
  first: Parser<TFirst>,
  ...rest: { [K in keyof TRest]: Parser<TRest[K]> }
): Parser<{ parts: [TFirst, ...TRest]; comment: string | undefined }> {
  return map(line(first, ...rest, optionalInlineComment), (arr) => ({
    parts: arr.slice(0, -1) as [TFirst, ...TRest],
    comment: arr[arr.length - 1] as string | undefined,
  }));
}

export const amount: Parser<Amount> = map(
  sequence(number, whitespace, currency),
  ([num, , curr]) => ({ number: num, currency: curr }),
);

export const account: Parser<string> = accountLex;

export const date: Parser<string> = dateLex;

export const tags: Parser<string[]> = sepByAtLeastOnce(tag, optionalWhitespace);

export const links: Parser<string[]> = sepByAtLeastOnce(
  link,
  optionalWhitespace,
);

const metadataValue: Parser<MetadataValue> = first(
  quotedString,
  map(number, (n) => Number(n)),
);

export const metadataEntry: Parser<Metadata> = map(
  sequence(
    key,
    optionalWhitespace,
    string(":"),
    optionalWhitespace,
    metadataValue,
  ),
  ([k, , , , v]) => ({ key: k, value: v }),
);

export const metadataLine: Parser<Metadata> = map(
  sequence(
    whitespace,
    metadataEntry,
    optional(afterOptionalWhitespace(lineComment)),
    lineEnd,
  ),
  ([, entry]) => entry,
);

export const cost: Parser<Amount> = between(string("{"), string("}"), amount);

export const price: Parser<Amount> = map(
  sequence(string("@"), optionalWhitespace, amount),
  ([, , amt]) => amt,
);

export interface PostingValue {
  amount?: Amount;
  cost?: Amount;
  price?: Amount;
}

export type PostingLine = { account: string } & PostingValue;

const postingValue: Parser<PostingValue> = map(
  sequence(
    amount,
    optional(afterWhitespace(cost)),
    optional(afterWhitespace(price)),
  ),
  ([amt, c, p]) => ({
    amount: amt,
    cost: c,
    price: p,
  }),
);

export type PostingLineWithComment = PostingLine & { inlineComment?: string };

export const postingLine: Parser<PostingLineWithComment> = map(
  sequence(
    whitespace,
    account,
    optional(afterWhitespace(postingValue)),
    optional(afterOptionalWhitespace(lineComment)),
    lineEnd,
  ),
  ([, acc, value, inlineCommentOpt]) => ({
    account: acc,
    ...value,
    ...(inlineCommentOpt !== undefined && { inlineComment: inlineCommentOpt }),
  }),
);
